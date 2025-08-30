//@ts-nocheck
import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';

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
  } = req.query;

  let type: string;
  if (longType === 'preseason') {
    type = 'ps';
  } else if (longType === 'playoffs') {
    type = 'po';
  } else {
    type = 'rs';
  }

  let orderSql: string;
  if (order === 'asc') {
    orderSql = 'ASC';
  } else {
    orderSql = 'DESC';
  }

  const sortSql = SORTABLE_COLUMNS[sort] || SORTABLE_COLUMNS.wins;
  const goalieStats = await query(
    SQL`
      SELECT 
        s.PlayerID,
        s.LeagueID,
        MAX(p.\`Last Name\`) AS Name,
        COUNT(DISTINCT s.SeasonID) AS Seasons,
        SUM(s.GP) AS GP,
        SUM(s.Minutes) AS Minutes,
        SUM(s.Wins) AS Wins,
        SUM(s.Losses) AS Losses,
        SUM(s.OT) AS OT,
        SUM(s.ShotsAgainst) AS ShotsAgainst,
        SUM(s.Saves) AS Saves,
        SUM(s.GoalsAgainst) AS GoalsAgainst,
        AVG(s.GAA) AS GAA,
        SUM(s.Shutouts) AS Shutouts,
        AVG(s.SavePct) AS SavePct
      FROM `
      .append(`player_goalie_stats_${type} AS s`)
      .append(
        SQL`
      INNER JOIN player_master AS p
        ON s.SeasonID = p.SeasonID
       AND s.LeagueID = p.LeagueID
       AND s.PlayerID = p.PlayerID
      INNER JOIN corrected_player_ratings AS r
        ON s.SeasonID = r.SeasonID
       AND s.LeagueID = r.LeagueID
       AND s.PlayerID = r.PlayerID
      WHERE s.LeagueID = ${+league}
      `,
      )
      .append(
        startSeason != null ? SQL` AND s.SeasonID >= ${+startSeason} ` : '',
      )
      .append(endSeason != null ? SQL` AND s.SeasonID <= ${+endSeason} ` : '')
      .append(teamID != null ? SQL` AND s.TeamID = ${+teamID} ` : '')
      .append(SQL` GROUP BY s.PlayerID, s.LeagueID`)
      .append(minGP != null ? SQL` HAVING SUM(s.GP) >= ${+minGP} ` : '')
      .append(` ORDER BY ${sortSql} ${orderSql}`)
      .append(limit != null ? SQL` LIMIT ${+limit};` : SQL`;`),
  );

  if ('error' in goalieStats) {
    res.status(500).send('Server Connection Failed');
    return;
  }

  if (goalieStats.length === 0) {
    res.status(200).json([]);
    return;
  }

  const parsed = [...goalieStats].map((player) => {
    return {
      id: player.PlayerID,
      name: player.Name,
      position: 'G',
      league: player.LeagueID,
      team: player.Abbr,
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
    };
  });

  res.status(200).json(parsed);
};
