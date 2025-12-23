//@ts-nocheck
import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';
import { getRatingTable } from 'utils/query';

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
    league = 0,
    type: longType = 'regular',
    season: seasonid,
    rookie = 'false',
  } = req.query;

  let type: string;
  if (longType === 'preseason') {
    type = 'ps';
  } else if (longType === 'playoffs') {
    type = 'po';
  } else {
    type = 'rs';
  }

  const [season] =
    (seasonid !== undefined &&
      !Number.isNaN(seasonid) && [{ SeasonID: seasonid }]) ||
    (await query(
      SQL`
      SELECT DISTINCT SeasonID
      FROM `.append(`player_goalie_stats_${type}`).append(SQL`
      WHERE LeagueID=${+league}
      ORDER BY SeasonID DESC
      LIMIT 1
  `),
    ));

  const rating_string = getRatingTable(season.SeasonID);

  const goalieStats = await query(
    SQL`
    SELECT s.PlayerID, s.LeagueID, s.SeasonID, s.TeamID, p.\`Last Name\` AS Name, s.GP, s.Minutes, s.Wins, s.Losses, s.OT, s.ShotsAgainst, s.Saves, s.GoalsAgainst, s.GAA, s.Shutouts, s.SavePct, s.GameRating, team_data.Abbr, team_data.LeagueID, team_data.TeamID, team_data.SeasonID, (s.SeasonID = rs.RookieSeasonID) AS isRookie
    FROM `
      .append(`player_goalie_stats_${type} AS s`)
      .append(
        SQL`
    INNER JOIN player_master as p
    ON s.SeasonID = p.SeasonID 
    AND s.LeagueID = p.LeagueID
    AND s.PlayerID = p.PlayerID
	INNER JOIN`,
      )
      .append(` ${rating_string} as r`)
      .append(
        SQL`
    ON s.SeasonID = r.SeasonID 
    AND s.LeagueID = r.LeagueID
    AND s.PlayerID = r.PlayerID
    INNER JOIN team_data
    ON p.TeamID = team_data.TeamID
    AND s.SeasonID = team_data.SeasonID
    AND s.LeagueID = team_data.LeagueID  
    LEFT JOIN player_goalie_rookie_season AS rs
      ON rs.PlayerID = s.PlayerID
     AND rs.LeagueID = s.LeagueID
    WHERE s.LeagueID=${+league}
    AND s.SeasonID=${season.SeasonID}
    AND r.G=20
	AND p.TeamID>=0
  `,
      )
      .append(
        rookie === 'true' ? SQL`  AND s.SeasonID = rs.RookieSeasonID;` : SQL`;`,
      ),
  );

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
      gameRating: player.GameRating,
      rookie: Boolean(player.isRookie),
    };
  });

  res.status(200).json(parsed);
};
