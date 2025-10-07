// @ts-nocheck
import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';

import { query } from '../../../../lib/db';
import use from '../../../../lib/middleware';

const cors = Cors({
  methods: ['GET', 'HEAD'],
});

export type TeamInfo = {
  id: number;
  season: number;
  league: number;
  conference: number;
  division?: number;
  name: string;
  abbreviation: string;
  location: string;
  nameDetails: {
    first: string;
    second: string;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
  };
  stats: {
    wins: number;
    losses: number;
    overtimeLosses: number;
    shootoutWins: number;
    shootoutLosses: number;
    points: number;
    goalsFor: number;
    goalsAgainst: number;
    winPercent: number;
  };
};

export default async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  await use(req, res, cors);

  const { league = [0], conference, division, season: seasonid } = req.query;

  const leagues = Array.isArray(league) ? league : [league];

  let search;
  if (!Number.isNaN(+seasonid)) {
    search = SQL`
      SELECT t.TeamID, t.LeagueID, t.SeasonID, t.Name, t.Nickname, t.Abbr, t.PrimaryColor, t.SecondaryColor, t.TextColor, t.ConferenceID, t.DivisionID, 
             s.Wins, s.Losses, s.OTL, s.SOW, s.SOL, s.Points, s.GF, s.GA, s.PCT
      FROM team_data AS t
      INNER JOIN team_records AS s
        ON t.TeamID = s.TeamID
        AND t.SeasonID = s.SeasonID
        AND t.LeagueID = s.LeagueID
      WHERE t.LeagueID IN (`.append(leagues.join(',')).append(SQL`)
        AND t.SeasonID=${+seasonid}
    `);
  } else {
    search = SQL`
      SELECT t.TeamID, t.LeagueID, t.SeasonID, t.Name, t.Nickname, t.Abbr, t.PrimaryColor, t.SecondaryColor, t.TextColor, t.ConferenceID, t.DivisionID, 
             s.Wins, s.Losses, s.OTL, s.SOW, s.SOL, s.Points, s.GF, s.GA, s.PCT
      FROM team_data AS t
      INNER JOIN team_records AS s
        ON t.TeamID = s.TeamID
        AND t.SeasonID = s.SeasonID
        AND t.LeagueID = s.LeagueID
      INNER JOIN (
        SELECT LeagueID, TeamID, MAX(SeasonID) AS LatestSeason
        FROM team_data
        WHERE LeagueID IN (`
      .append(leagues.join(','))
      .append(
        SQL`)
        GROUP BY LeagueID, TeamID
      ) latest
        ON t.TeamID = latest.TeamID
        AND t.SeasonID = latest.LatestSeason
        AND t.LeagueID = latest.LeagueID
      WHERE t.LeagueID IN (`,
      )
      .append(leagues.join(',')).append(SQL`)
    `);
  }

  if (!Number.isNaN(+conference)) {
    search.append(SQL` AND ConferenceID=${+conference}`);

    if (+league !== 2 && +league !== 3 && !Number.isNaN(+division)) {
      search.append(SQL` AND DivisionID=${+division}`);
    }
  }

  const teams = await query(search);

  const parsed = teams.map((team) => ({
    id: team.TeamID,
    season: team.SeasonID,
    league: team.LeagueID,
    conference: team.ConferenceID,
    division: team.DivisionID === -1 ? undefined : team.DivisionID,
    name: `${team.Name} ${team.Nickname}`,
    abbreviation: team.Abbr,
    location:
      team.LeagueID === 2 || team.LeagueID === 3 ? team.Nickname : team.Name,
    nameDetails: {
      first: team.Name,
      second: team.Nickname,
    },
    colors: {
      primary: team.PrimaryColor,
      secondary: team.SecondaryColor,
      text: team.TextColor,
    },
    stats: {
      wins: team.Wins,
      losses: team.Losses,
      overtimeLosses: team.OTL,
      shootoutWins: team.SOW,
      shootoutLosses: team.SOL,
      points: team.Points,
      goalsFor: team.GF,
      goalsAgainst: team.GA,
      winPercent: team.PCT.toFixed(3),
    },
  }));

  res.status(200).json(parsed);
};
