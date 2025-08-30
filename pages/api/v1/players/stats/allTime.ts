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
  points: 'SUM(s.G) + SUM(s.A)',
  goals: 'SUM(s.G)',
  assists: 'SUM(s.A)',
  gamesPlayed: 'SUM(s.GP)',
  pim: 'SUM(s.PIM)',
  hits: 'SUM(s.HIT)',
  blocks: 'SUM(s.SB)',
  fights: 'SUM(s.Fights)',
  fightWins: 'SUM(s.Fights_Won)',
  faceoffs: 'SUM(s.FO)',
  faceoffWins: 'SUM(s.FOW)',
  ppGoals: 'SUM(s.PPG)',
  ppAssists: 'SUM(s.PPA)',
  ppPoints: 'SUM(s.PPG + s.PPA)',
  shGoals: 'SUM(s.SHG)',
  shAssists: 'SUM(s.SHA)',
  shPoints: 'SUM(s.SHG + s.SHA)',
  timeOnIce: 'SUM(s.TOI)',
  giveaways: 'SUM(s.GvA)',
  takeaways: 'SUM(s.TkA)',
  plusMinus: 'SUM(s.PlusMinus)',
  shots: 'SUM(s.SOG)',
};

export type SeasonType = string;

export default async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  await use(req, res, cors);

  const {
    league = 0,
    type: longType = 'regular',
    position,
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

  const sortSql = SORTABLE_COLUMNS[sort];
  if (!sortSql) {
    res.status(400).json({ error: 'Invalid sort option. See API for options' });
    return;
  }
  const playerStats = await query(
    SQL`
  SELECT 
      s.PlayerID,
      s.LeagueID,
      MAX(p.\`Last Name\`) AS Name,
      COUNT(DISTINCT s.SeasonID) AS Seasons,
      SUM(s.GP) AS GP,
      SUM(s.G) AS G,
      SUM(s.A) AS A,
      SUM(s.G) + SUM(s.A) AS Points,
      SUM(s.GWG) AS GWG,
      SUM(s.TOI) AS TOI,
      SUM(s.GvA) AS GvA,
      SUM(s.TkA) AS TkA,
      SUM(s.HIT) AS Hits,
      SUM(s.SB) AS Blocks,
      SUM(s.Fights) AS Fights,
      SUM(s.Fights_Won) AS Fights_Won,
      SUM(s.PlusMinus) AS PlusMinus,
      SUM(s.PIM) AS PIM,
      SUM(s.PPG) AS PPG,
      SUM(s.PPA) AS PPA,
      SUM(s.PPG + s.PPA) AS PPP,
      SUM(s.SHG) AS SHG,
      SUM(s.SHA) AS SHA,
      SUM(s.SHG + s.SHA) AS SHPoints,
      SUM(s.SOG) AS SOG,
      SUM(s.FO) AS FO,
      SUM(s.FOW) AS FOW,
      MAX(r.LD) AS LD,
      MAX(r.RD) AS RD,
      MAX(r.LW) AS LW,
      MAX(r.C)  AS C,
      MAX(r.RW) AS RW
  FROM `
      .append(`player_skater_stats_${type} AS s`)
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
    AND r.G < 19
    AND p.TeamID >= 0
  `
          .append(
            position === 'forward'
              ? SQL` AND (r.LD < 20 AND r.RD < 20) `
              : position === 'defenseman'
              ? SQL` AND (r.LD = 20 OR r.RD = 20) `
              : SQL``,
          )
          .append(
            startSeason != null ? SQL` AND s.SeasonID >= ${+startSeason} ` : '',
          )
          .append(
            endSeason != null ? SQL` AND s.SeasonID <= ${+endSeason} ` : '',
          )
          .append(teamID != null ? SQL` AND s.TeamID = ${+teamID} ` : '')
          .append(SQL` GROUP BY s.PlayerID, s.LeagueID`)
          .append(minGP != null ? SQL` HAVING SUM(s.GP) >= ${+minGP} ` : '')
          .append(` ORDER BY ${sortSql} ${orderSql} `)
          .append(limit != null ? SQL` LIMIT ${+limit} ` : ''),
      ),
  );

  if ('error' in playerStats) {
    res.status(500).send('Server Connection Failed');
    return;
  }

  if (playerStats.length === 0) {
    res.status(200).json([]);
    return;
  }

  const parsed = [...playerStats].map((player) => {
    return {
      id: player.PlayerID,
      name: player.Name,
      league: player.LeagueID,
      seasons: player.Seasons,
      gamesPlayed: player.GP,
      goals: player.G,
      assists: player.A,
      points: player.Points,
      plusMinus: player.PlusMinus,
      pim: player.PIM,
      shotsOnGoal: player.SOG,
      hits: player.Hits,
      blocks: player.Blocks,
      faceoffs: player.FO,
      faceoffWins: player.FOW,
      fights: player.Fights,
      fightWins: player.Fights_Won,
      fightLosses: player.Fights - player.Fights_Won,
      giveaways: player.GvA,
      takeaways: player.TkA,
      timeOnIce: player.TOI,
      ppGoals: player.PPG,
      ppAssists: player.PPA,
      ppPoints: player.PPP,
      shGoals: player.SHG,
      shAssists: player.SHA,
      shPoints: player.SHPoints,
    };
  });

  res.status(200).json(parsed);
};
