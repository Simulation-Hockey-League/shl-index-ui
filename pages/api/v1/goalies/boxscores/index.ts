//@ts-nocheck
import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';

import { query } from '../../../../../lib/db';
import use from '../../../../../lib/middleware';

const cors = Cors({
  methods: ['GET', 'HEAD'],
});

export default async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  await use(req, res, cors);

  const {
    id,
    teamID,
    league = 0,
    type: longType = 'regular',
    season: seasonid,
  } = req.query;

  let type: string;
  if (longType === 'preseason') {
    type = 'Pre-Season';
  } else if (longType === 'playoffs') {
    type = 'Playoffs';
  } else {
    type = 'Regular Season';
  }
  if (!seasonid || seasonid < 66) {
    res.status(400).json({ error: 'Season must be 66 or greater' });
    return;
  }

  const baseQuery = SQL`
    SELECT 
    bgs.SeasonID,
    bgs.LeagueID,
    bgs.gameID,
    s.Slug,
    bgs.playerID,
    pm.\`Last Name\` as name,
    bgs.teamId,
    td.Abbr AS teamAbbr,
    CASE 
        WHEN bgs.teamId = s.Home THEN 1 
        ELSE 0 
    END AS IsHome,
    CASE 
        WHEN bgs.teamId = s.Home THEN s.Away
        ELSE s.Home
    END AS OpponentTeamID,
    CASE 
        WHEN bgs.teamId = s.Home THEN away_td.Abbr
        ELSE home_td.Abbr
    END AS OpponentAbbr,
    s.Date,
    s.Type,
    bgs.GameRating,
    bgs.ShotsAgainst,
    bgs.ShotsAgainst,
    bgs.GoalsAgainst,
    bgs.Saves,
    bgs.SavePct,
    bgs.Minutes,
    bgs.PIM,
    CASE 
        WHEN bgs.teamId = s.Home AND s.HomeScore > s.AwayScore THEN 1
        WHEN bgs.teamId = s.Away AND s.AwayScore > s.HomeScore THEN 1
        ELSE 0
    END AS Decision
    
FROM
    boxscore_goalie_summary AS bgs
LEFT JOIN 
    slugviewer AS s 
    ON bgs.gameID = s.gameID 
    AND bgs.SeasonID = s.SeasonID 
    AND bgs.LeagueID = s.LeagueID
LEFT JOIN 
    team_data AS td
    ON bgs.teamId = td.TeamID
    AND bgs.SeasonID = td.SeasonID
    AND bgs.LeagueID = td.LeagueID
LEFT JOIN 
    team_data AS home_td
    ON s.Home = home_td.TeamID
    AND s.SeasonID = home_td.SeasonID
    AND s.LeagueID = home_td.LeagueID
LEFT JOIN 
    team_data AS away_td
    ON s.Away = away_td.TeamID
    AND s.SeasonID = away_td.SeasonID
    AND s.LeagueID = away_td.LeagueID
    LEFT JOIN
    player_master as pm
    on bgs.playerID = pm.PlayerID
    AND bgs.SeasonID = pm.SeasonID
    and bgs.LeagueID = pm.LeagueID
WHERE
      bgs.Minutes >0
      AND bgs.LeagueID = ${league}
      AND bgs.SeasonID = ${seasonid}
      AND s.Type = ${type}
  `;

  if (id) {
    baseQuery.append(SQL` AND bgs.playerID = ${id}`);
  }
  if (teamID) {
    baseQuery.append(SQL` AND bgs.teamId = ${teamID}`);
  }

  baseQuery.append(SQL` ORDER BY bgs.gameID DESC`);

  const parsed = await query(baseQuery);

  const boxscores = parsed.map((player) => ({
    season: player.SeasonID,
    league: player.LeagueID,
    gameID: player.gameID,
    slug: player.Slug,
    playerID: player.playerID,
    name: player.name,
    teamID: player.teamId,
    teamAbbr: player.teamAbbr,
    isHome: player.IsHome,
    opponentTeamID: player.OpponentTeamID,
    opponentAbbr: player.OpponentAbbr,
    date: player.Date,
    type: player.Type,
    gameRating: player.GameRating,
    shotsAgainst: player.ShotsAgainst,
    goalsAgainst: player.GoalsAgainst,
    saves: player.Saves,
    savePct: player.SavePct,
    minutesPlayed: `${
      player.Minutes / 60_000 < 10
        ? '0' + Math.floor(player.Minutes / 60_000)
        : Math.floor(player.Minutes / 60_000)
    }:${
      (player.Minutes / 1_000) % 60 < 10
        ? '0' + Math.floor((player.Minutes / 1_000) % 60)
        : Math.floor((player.Minutes / 1_000) % 60)
    }`,
    PIM: player.PIM,
    descision: player.Decision,
  }));

  res.status(200).json(boxscores);
};
