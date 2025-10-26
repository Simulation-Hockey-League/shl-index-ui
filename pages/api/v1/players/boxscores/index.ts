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
      bss.SeasonID,
      bss.LeagueID,
      bss.gameID,
      s.Slug,
      bss.playerID,
      pm.\`Last Name\` as name,
      bss.teamId,
      td.Abbr AS teamAbbr,
      CASE 
          WHEN bss.teamId = s.Home THEN 1 
          ELSE 0 
      END AS IsHome,
      CASE 
          WHEN bss.teamId = s.Home THEN s.Away
          ELSE s.Home
      END AS OpponentTeamID,
      CASE 
          WHEN bss.teamId = s.Home THEN away_td.Abbr
          ELSE home_td.Abbr
      END AS OpponentAbbr,
      s.Date,
      s.Type,
      bss.GR,
      bss.OGR,
      bss.DGR,
      bss.G,
      bss.A,
      bss.G + bss.A AS Points,
      bss.PlusMinus,
      bss.SOG,
      bss.MS,
      bss.BS,
      bss.PIM,
      bss.HT,
      bss.TK,
      bss.GV,
      bss.SHF,
      bss.TOT,
      bss.PP,
      bss.SH,
      bss.EV,
      bss.FOW,
      bss.FOL,
      bss.FOPct,
      bss.team_shots_on,
      bss.team_shots_against_on,
      bss.team_shots_missed_on,
      bss.team_shots_missed_against_on,
      bss.team_shots_blocked_on,
      bss.team_shots_blocked_against_on,
      bss.team_goals_on,
      bss.team_goal_against_on,
      bss.team_shots_off,
      bss.team_shots_against_off,
      bss.team_shots_missed_off,
      bss.team_shots_missed_against_off,
      bss.team_shots_blocked_off,
      bss.team_shots_blocked_against_off,
      bss.team_goals_off,
      bss.team_goal_against_off,
      bss.oz_starts,
      bss.nz_starts,
      bss.dz_starts,
      bss.team_oz_starts,
      bss.team_nz_starts,
      bss.team_dz_starts,
      bss.sq0,
      bss.sq1,
      bss.sq2,
      bss.sq3,
      bss.sq4
    FROM boxscore_skater_summary AS bss
    LEFT JOIN slugviewer AS s 
      ON bss.gameID = s.gameID 
      AND bss.SeasonID = s.SeasonID 
      AND bss.LeagueID = s.LeagueID
    LEFT JOIN team_data AS td
      ON bss.teamId = td.TeamID
      AND bss.SeasonID = td.SeasonID
      AND bss.LeagueID = td.LeagueID
    LEFT JOIN team_data AS home_td
      ON s.Home = home_td.TeamID
      AND s.SeasonID = home_td.SeasonID
      AND s.LeagueID = home_td.LeagueID
    LEFT JOIN team_data AS away_td
      ON s.Away = away_td.TeamID
      AND s.SeasonID = away_td.SeasonID
      AND s.LeagueID = away_td.LeagueID
          LEFT JOIN
    player_master as pm
    on bss.playerID = pm.PlayerID
    AND bss.SeasonID = pm.SeasonID
    and bss.LeagueID = pm.LeagueID
    WHERE 
      bss.LeagueID = ${league}
      AND bss.SeasonID = ${seasonid}
      AND s.Type = ${type}
  `;

  if (id) {
    baseQuery.append(SQL` AND bss.playerID = ${id}`);
  }
  if (teamID != null) {
    baseQuery.append(SQL` AND bss.teamId = ${teamID}`);
  }

  baseQuery.append(SQL` ORDER BY bss.gameID DESC`);

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
    gameRating: Math.floor(player.GR),
    offensiveGameRating: Math.floor(player.OGR),
    defensiveGameRating: Math.floor(player.DGR),
    goals: player.G,
    assists: player.A,
    points: player.Points,
    plusMinus: player.PlusMinus,
    shotsOnGoal: player.SOG,
    missedShots: player.MS,
    blockedShots: player.BS,
    pim: player.PIM,
    hits: player.HT,
    takeaways: player.TK,
    giveaways: player.GV,
    faceoffs: player.FOW + player.FOL,
    faceoffsWon: player.FOW,
    faceoffPct: player.FOPct,
    shifts: player.SHF,
    timeOnIce: player.TOT,
    ppTimeOnIce: player.PP,
    shTimeOnIce: player.SH,
    team_shots_on: player.team_shots_on,
    team_shots_against_on: player.team_shots_against_on,
    team_shots_missed_on: player.team_shots_missed_on,
    team_shots_missed_against_on: player.team_shots_missed_against_on,
    team_shots_blocked_on: player.team_shots_blocked_on,
    team_shots_blocked_against_on: player.team_shots_blocked_against_on,
    team_goals_on: player.team_goals_on,
    team_goals_against_on: player.team_goal_against_on,
    team_shots_off: player.team_shots_off,
    team_shots_against_off: player.team_shots_against_off,
    team_shots_missed_off: player.team_shots_missed_off,
    team_shots_missed_against_off: player.team_shots_missed_against_off,
    team_shots_blocked_off: player.team_shots_blocked_off,
    team_shots_blocked_against_off: player.team_shots_blocked_against_off,
    team_goals_off: player.team_goals_off,
    team_goals_against_off: player.team_goal_against_off,
    oz_starts: player.oz_starts,
    nz_starts: player.nz_starts,
    dz_starts: player.dz_starts,
    team_oz_starts: player.team_oz_starts,
    team_nz_starts: player.team_nz_starts,
    team_dz_starts: player.team_dz_starts,
    sq0: player.sq0,
    sq1: player.sq1,
    sq2: player.sq2,
    sq3: player.sq3,
    sq4: player.sq4,
  }));

  res.status(200).json(boxscores);
};
