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
  points: 'P',
  goals: 'G',
  assists: 'A',
  gamesPlayed: 'GP',
  pim: 'PIM',
  hits: 'Hits',
  shotsBlocked: 'shotsBlocked',
  fights: 'Fights',
  fightWins: 'Fights_Won',
  faceoffs: 'FO',
  faceoffWins: 'FOW',
  ppGoals: 'PPG',
  ppAssists: 'PPA',
  ppPoints: 'PPP',
  shGoals: 'SHG',
  shAssists: 'SHA',
  shPoints: 'SHP',
  timeOnIce: 'TOI',
  giveaways: 'GvA',
  takeaways: 'TkA',
  plusMinus: 'PlusMinus',
  shots: 'SOG',
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

  const sortSql = SORTABLE_COLUMNS[sort] || SORTABLE_COLUMNS.points;
  const orderDirection = order === 'asc' ? 'ASC' : 'DESC';
  const isGrouped = grouped === 'true';

  const playerString = SQL`
    SELECT 
    s.PlayerID,
    s.LeagueID,
  `;
  if (isGrouped) {
    playerString.append(
      SQL`
      MAX(p.\`Last Name\`) AS Name,
      COUNT(DISTINCT s.SeasonID) AS Seasons,
      GROUP_CONCAT(DISTINCT t.Abbr ORDER BY t.Abbr) AS TeamAbbrs,
      SUM(s.GP) AS GP,
      SUM(s.G) AS G,
      SUM(s.A) AS A,
      SUM(s.G + s.A) AS P,
      SUM(s.GWG) AS GWG,
      SUM(s.TOI + s.PPTOI + s.SHTOI) AS TOI,
      SUM(s.TOI) as EVTOI,
      SUM(s.PPTOI) as PPTOI,
      SUM(s.SHTOI) as SHTOI,
      SUM(s.PPG) as PPG,
      SUM(s.PPA) as PPA,
      SUM(s.PPG + s.PPA) as PPP,
      SUM(s.SHG) as SHG,
      SUM(s.SHA) as SHA,
      SUM(s.SHG + s.SHA) as SHP,
      SUM(s.G - s.PPG - s.SHG) as EVG,
      SUM(s.A - s.PPA - s.SHA) as EVA,
      SUM((s.G + s.A) - (s.PPG + s.PPA) - (s.SHG + s.SHA)) as EVP,
      SUM(s.GvA) AS GvA,
      SUM(s.TkA) AS TkA,
      SUM(s.HIT) AS Hits,
      SUM(s.SB) AS shotsBlocked,
      SUM(s.Fights) AS Fights,
      SUM(s.Fights_Won) AS Fights_Won,
      SUM(s.PlusMinus) AS PlusMinus,
      SUM(s.PIM) AS PIM,
      SUM(s.SOG) AS SOG,
      SUM(s.FO) AS FO,
      SUM(s.FOW) AS FOW
      FROM `,
    );
  } else {
    playerString.append(
      SQL`
      p.\`Last Name\` AS Name,
      s.SeasonID,
      t.Abbr AS TeamAbbrs,
      s.GP,
      s.G,
      s.A,
      s.G + s.A AS P,
      s.GWG,
      (s.TOI + s.PPTOI+ s.SHTOI) as TOI,
      s.TOI as EVTOI,
      s.PPTOI,
      s.SHTOI,
      s.PPG as PPG,
      s.PPA as PPA,
      (s.PPG + s.PPA) as PPP,
      s.SHG as SHG,
      s.SHA as SHA,
      (s.SHG + s.SHA) as SHP,
      (s.G - s.PPG - s.SHG) as EVG,
      (s.A - s.PPA - s.SHA) as EVA,
      ((s.G + s.A) - (s.PPG + s.PPA) - (s.SHG + s.SHA)) as EVP,
      s.GvA,
      s.TkA,
      s.HIT AS Hits,
      s.SB AS shotsBlocked,
      s.Fights AS Fights,
      s.Fights_Won AS Fights_Won,
      s.PlusMinus AS PlusMinus,
      s.PIM,
      s.SOG,
      s.FO, 
      s.FOW,
      (s.SeasonID = rs.RookieSeasonID) AS isRookie
      FROM `,
    );
  }

  playerString.append(`player_skater_stats_${type} AS s`).append(
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
     AND s.PlayerID = r.PlayerID
  `,
  );

  if (!isGrouped) {
    playerString.append(SQL`
    LEFT JOIN player_skater_rookie_season AS rs
      ON rs.PlayerID = s.PlayerID
     AND rs.LeagueID = s.LeagueID
  `);
  }
  playerString
    .append(
      SQL`
  WHERE s.LeagueID = ${+league}
    AND r.G < 19
    AND p.TeamID >= 0
`,
    )
    .append(
      position === 'forward'
        ? SQL` AND (r.LD < 20 AND r.RD < 20) `
        : position === 'defenseman'
        ? SQL` AND (r.LD = 20 OR r.RD = 20) `
        : SQL``,
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
    .append(` ORDER BY ${sortSql} ${orderDirection} `)
    .append(limit != null ? SQL` LIMIT ${+limit} ` : '');

  let playerStats = await query(playerString);

  if ('error' in playerStats) {
    res.status(500).send('Server Connection Failed');
    return;
  }

  if (playerStats.length === 0) {
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
    playerStats = playerStats.filter((player) =>
      activePlayerSet.has(player.PlayerID),
    );
  }

  const parsed = [...playerStats].map((player) => {
    return {
      id: player.PlayerID,
      name: player.Name,
      league: player.LeagueID,
      ...(isGrouped
        ? { seasons: player.Seasons }
        : { season: player.SeasonID, isRookie: Boolean(player.isRookie) }),
      teamAbbr: player.TeamAbbrs,
      gamesPlayed: player.GP,
      goals: player.G,
      assists: player.A,
      points: player.P,
      plusMinus: player.PlusMinus,
      pim: player.PIM,
      shotsOnGoal: player.SOG,
      hits: player.Hits,
      shotsBlocked: player.shotsBlocked,
      faceoffs: player.FO,
      faceoffWins: player.FOW,
      fights: player.Fights,
      fightWins: player.Fights_Won,
      fightLosses: player.Fights - player.Fights_Won,
      giveaways: player.GvA,
      takeaways: player.TkA,
      timeOnIce: player.TOI,
      evTimeOnIce: player.EVTOI,
      ppTimeOnIce: player.PPTOI,
      shTimeOnIce: player.SHTOI,
      ppGoals: player.PPG,
      ppAssists: player.PPA,
      ppPoints: player.PPP,
      shGoals: player.SHG,
      shAssists: player.SHA,
      shPoints: player.SHP,
      evGoals: player.EVG,
      evAssists: player.EVA,
      evPoints: player.EVP,
      stillActive: activePlayerSet.has(player.PlayerID),
    };
  });

  res.status(200).json(parsed);
};
