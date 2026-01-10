//@ts-nocheck
import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';
import { validateSeason } from 'utils/query';

import { query } from '../../../../../lib/db';
import use from '../../../../../lib/middleware';

const cors = Cors({
  methods: ['GET', 'HEAD'],
});

const SORTABLE_COLUMNS: Record<string, string> = {
  wins: 'Wins',
  losses: 'Losses',
  ot: 'OT',
  goalsAgainst: 'GoalsAgainst',
  shutouts: 'Shutouts',
  savePct: 'SavePct',
  gaa: 'GAA',
  minutes: 'Minutes',
  gamesPlayed: 'GP',
};

export default async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  await use(req, res, cors);

  const {
    league = 0,
    type: longType = 'regular',
    sort,
    order = 'desc',
    startSeason,
    endSeason,
    teamID,
    minGP,
    limit,
    grouped = 'true',
    active = 'false',
    rookie = 'false',
    playerID,
  } = req.query;

  let type: string;
  if (longType === 'pre') {
    type = 'ps';
  } else if (longType === 'playoffs') {
    type = 'po';
  } else {
    type = 'rs';
  }

  if (startSeason != null && !validateSeason(startSeason as string)) {
    res.status(400).json({ error: 'Invalid startSeason format' });
    return;
  }
  if (endSeason != null && !validateSeason(endSeason as string)) {
    res.status(400).json({ error: 'Invalid endSeason format' });
    return;
  }

  const sortSql = SORTABLE_COLUMNS[sort] || SORTABLE_COLUMNS.wins;
  const orderDirection = order === 'asc' ? 'ASC' : 'DESC';
  const isGrouped = grouped === 'true';

  const goalieString = SQL`
  SELECT 
        s.PlayerID,
        s.LeagueID,
       
  `;
  if (isGrouped) {
    goalieString.append(
      SQL`
       MAX(p.\`Last Name\`) AS Name,
        COUNT(DISTINCT s.SeasonID) AS Seasons,
        GROUP_CONCAT(DISTINCT t.Abbr ORDER BY t.Abbr) AS TeamAbbrs,
        SUM(s.GP) AS GP,
        SUM(s.Minutes) AS Minutes,
        SUM(s.Wins) AS Wins,
        SUM(s.Losses) AS Losses,
        SUM(s.OT) AS OT,
        SUM(s.ShotsAgainst) AS ShotsAgainst,
        SUM(s.Saves) AS Saves,
        SUM(s.GoalsAgainst) AS GoalsAgainst,
        ROUND(
          (SUM(s.GoalsAgainst) * 60) / NULLIF(SUM(s.Minutes), 0),
          2
        ) AS GAA,
        SUM(s.Shutouts) AS Shutouts,
        ROUND(
        SUM(s.Saves) / NULLIF(SUM(s.ShotsAgainst), 0),
        3
      ) AS SavePct
      FROM `,
    );
  } else {
    goalieString.append(
      SQL`
       p.\`Last Name\` AS Name,
       t.Abbr AS TeamAbbrs,
       s.SeasonID,
       s.GP,
       s.Minutes,
       s.Wins,
       s.Losses,
       s.OT,
       s.ShotsAgainst,
       s.Saves,
       s.GoalsAgainst,
       s.GAA,
       s.Shutouts,
       s.SavePct,
       (s.SeasonID = rs.RookieSeasonID) AS isRookie
      FROM `,
    );
  }
  goalieString.append(`player_goalie_stats_${type} AS s`).append(
    SQL`
      INNER JOIN player_master AS p
      ON s.SeasonID = p.SeasonID
      AND s.LeagueID = p.LeagueID
      AND s.PlayerID = p.PlayerID
      LEFT JOIN team_data AS t
      ON s.TeamID = t.TeamID
      AND s.LeagueID = t.LeagueID
      AND s.SeasonID = t.SeasonID
      INNER JOIN player_ratings AS r
      ON s.SeasonID = r.SeasonID
      AND s.LeagueID = r.LeagueID
      AND s.PlayerID = r.PlayerID`,
  );

  if (!isGrouped) {
    goalieString.append(
      SQL`
      LEFT JOIN player_rookie_season AS rs
      ON rs.PlayerID = s.PlayerID
     AND rs.LeagueID = s.LeagueID
      `,
    );
  }

  goalieString
    .append(
      SQL`
      WHERE s.LeagueID = ${+league}
      `,
    )
    .append(startSeason != null ? SQL` AND s.SeasonID >= ${+startSeason} ` : '')
    .append(endSeason != null ? SQL` AND s.SeasonID <= ${+endSeason} ` : '')
    .append(teamID != null ? SQL` AND s.TeamID = ${+teamID} ` : '')
    .append(playerID != null ? SQL` AND s.PlayerID = ${+playerID} ` : '')
    .append(rookie === 'true' ? SQL` AND s.SeasonID = rs.RookieSeasonID ` : '')
    .append(isGrouped ? SQL` GROUP BY s.PlayerID, s.LeagueID` : '')
    .append(
      isGrouped && minGP != null
        ? SQL` HAVING SUM(s.GP) >= ${+minGP} `
        : !isGrouped && minGP != null
        ? SQL` AND s.GP >= ${+minGP} `
        : '',
    )
    .append(` ORDER BY ${sortSql} ${orderDirection}`)
    .append(limit != null ? SQL` LIMIT ${+limit};` : SQL`;`);
  let goalieStats = await query(goalieString);

  if ('error' in goalieStats) {
    res.status(500).send('Server Connection Failed');
    return;
  }

  if (goalieStats.length === 0) {
    res.status(200).json([]);
    return;
  }

  const activePlayers = await query(SQL`
      SELECT PlayerID
      FROM player_master
      WHERE LeagueID = ${+league}
      AND SeasonID = (SELECT MAX(SeasonID) FROM player_master WHERE LeagueID = ${+league})
      AND TeamID >= 0;`);

  if ('error' in activePlayers) {
    res.status(500).send('Server Connection Failed');
    return;
  }

  const activePlayerSet = new Set(activePlayers.map((p) => p.PlayerID));

  if (active === 'true') {
    goalieStats = goalieStats.filter((player) =>
      activePlayerSet.has(player.PlayerID),
    );
  }

  const parsed = [...goalieStats].map((player) => {
    return {
      id: player.PlayerID,
      name: player.Name,
      position: 'G',
      league: player.LeagueID,
      ...(isGrouped
        ? { seasons: player.Seasons }
        : { season: player.SeasonID, isRookie: Boolean(player.isRookie) }),
      teamAbbr: player.TeamAbbrs,
      season: player.SeasonID,
      gamesPlayed: player.GP,
      minutes: player.Minutes,
      wins: player.Wins,
      losses: player.Losses,
      ot: player.OT,
      shotsAgainst: player.ShotsAgainst,
      saves: player.Saves,
      goalsAgainst: player.GoalsAgainst,
      gaa: player.GAA.toFixed(2),
      shutouts: player.Shutouts,
      savePct: player.SavePct.toFixed(3),
      stillActive: activePlayerSet.has(player.PlayerID),
    };
  });

  res.status(200).json(parsed);
};
