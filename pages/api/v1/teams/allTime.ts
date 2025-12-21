// @ts-nocheck
import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';
import { validateSeason } from 'utils/query';

import { query } from '../../../../lib/db';
import use from '../../../../lib/middleware';

const cors = Cors({
  methods: ['GET', 'HEAD'],
});

const SORTABLE_COLUMNS: Record<string, string> = {
  points: 'points',
  wins: 'wins',
  losses: 'losses',
  overtimeLosses: 'overtimeLosses',
  goalsFor: 'goalsFor',
  goalsAgainst: 'goalsAgainst',
  winPercent: 'winPercent',
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  await use(req, res, cors);

  const {
    league = 0,
    sort,
    teamID,
    order = 'desc',
    startSeason,
    endSeason,
    grouped = 'true',
  } = req.query;

  if (startSeason != null && !validateSeason(startSeason as string)) {
    res.status(400).json({ error: 'Invalid startSeason format' });
    return;
  }
  if (endSeason != null && !validateSeason(endSeason as string)) {
    res.status(400).json({ error: 'Invalid endSeason format' });
    return;
  }

  const sortColumn = SORTABLE_COLUMNS[sort] || SORTABLE_COLUMNS.wins;
  const orderDirection = order === 'asc' ? 'ASC' : 'DESC';
  const isGrouped = grouped === 'true';

  const seasonFilter = SQL`WHERE tr.LeagueID = ${+league}`;
  if (startSeason != null) {
    seasonFilter.append(SQL` AND tr.SeasonID >= ${+startSeason}`);
  }
  if (endSeason != null) {
    seasonFilter.append(SQL` AND tr.SeasonID <= ${+endSeason}`);
  }
  let teamFilter = SQL``;
  if (teamID != null) {
    teamFilter.append(SQL` AND tr.TeamID=${+teamID} `);
  }

  const mainQuery = SQL`
  SELECT
        tr.TeamID AS id,
        tr.LeagueID AS league,
        td.Name AS name,
        td.Nickname AS nickname,
  `;

  if (isGrouped) {
    mainQuery
      .append(
        SQL`
        COUNT(DISTINCT tr.SeasonID) AS Seasons,
        SUM(tr.Wins + tr.Losses + tr.OTL + tr.SOL) as GP,
        SUM(tr.Wins) AS wins,
        SUM(tr.Losses) AS losses,
        SUM(tr.OTL) AS overtimeLosses,
        SUM(tr.SOW) AS shootoutWins,
        SUM(tr.SOL) AS shootoutLosses,
        SUM(tr.Points) AS points,
        SUM(tr.GF) AS goalsFor,
        SUM(tr.GA) AS goalsAgainst,
        SUM(tr.GF - tr.GA) as goalsDiff,
        ROUND(SUM(tr.Wins) / NULLIF(SUM(tr.Wins) + SUM(tr.Losses) + SUM(tr.OTL), 0), 3) AS winPercent
      FROM team_records tr
      INNER JOIN (
        SELECT t1.TeamID, t1.LeagueID, t1.Name, t1.Nickname
        FROM team_data AS t1
        INNER JOIN (
          SELECT TeamID, LeagueID, MAX(SeasonID) AS LatestSeason
          FROM team_data
          WHERE LeagueID = ${+league}
          GROUP BY TeamID, LeagueID
        ) AS latest
          ON t1.TeamID = latest.TeamID
          AND t1.LeagueID = latest.LeagueID
          AND t1.SeasonID = latest.LatestSeason
      ) td
        ON tr.TeamID = td.TeamID
        AND tr.LeagueID = td.LeagueID
    `,
      )
      .append(seasonFilter)
      .append(teamFilter)
      .append(
        SQL`
      GROUP BY tr.TeamID, tr.LeagueID, td.Name, td.Nickname
      ORDER BY `,
      )
      .append(sortColumn).append(` ${orderDirection}
    `);
  } else {
    mainQuery
      .append(
        SQL`
        tr.SeasonID AS season,
        tr.Wins + tr.Losses + tr.OTL + tr.SOL as GP,
        tr.Wins AS wins,
        tr.Losses AS losses,
        tr.OTL AS overtimeLosses,
        tr.SOW AS shootoutWins,
        tr.SOL AS shootoutLosses,
        tr.Points AS points,
        tr.GF AS goalsFor,
        tr.GA AS goalsAgainst,
        tr.GF - tr.GA as goalsDiff,
        ROUND(tr.Wins / NULLIF(tr.Wins + tr.Losses + tr.OTL, 0), 3) AS winPercent
      FROM team_records tr
        INNER JOIN team_data td
          ON td.TeamID = tr.TeamID
          AND td.LeagueID = tr.LeagueID
          AND td.SeasonID = tr.SeasonID
    `,
      )
      .append(seasonFilter)
      .append(teamFilter)
      .append(
        SQL`
      ORDER BY `,
      )
      .append(sortColumn).append(` ${orderDirection}
    `);
  }

  const teams = await query(mainQuery);

  if ('error' in teams) {
    res.status(500).send('Server Connection Failed');
    return;
  }

  if (teams.length === 0) {
    res.status(404).json({ message: 'No teams found' });
    return;
  }

  const parsed = teams.map((team) => ({
    id: team.id,
    league: team.league,
    name: team.name,
    nickname: team.nickname,
    ...(isGrouped ? { seasons: team.Seasons } : { season: team.season }),
    gamesPlayed: team.GP,
    wins: team.wins,
    losses: team.losses,
    overtimeLosses: team.overtimeLosses,
    shootoutWins: team.shootoutWins,
    shootoutLosses: team.shootoutLosses,
    points: team.points,
    goalsFor: team.goalsFor,
    goalsAgainst: team.goalsAgainst,
    goalsDiff: team.goalsDiff,
    winPercent: team.winPercent,
  }));

  res.status(200).json(parsed);
};
