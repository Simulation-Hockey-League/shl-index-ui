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
  name: string;
  abbreviation: string;
  location: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
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
      SELECT t.TeamID, t.LeagueID, t.SeasonID, t.Name, t.Nickname, t.Abbr, t.PrimaryColor, t.SecondaryColor, t.TextColor
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
      SELECT t.TeamID, t.LeagueID, t.SeasonID, t.Name, t.Nickname, t.Abbr, t.PrimaryColor, t.SecondaryColor, t.TextColor
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
    search.append(SQL` AND t.ConferenceID=${+conference}`);

    if (+league !== 2 && +league !== 3 && !Number.isNaN(+division)) {
      search.append(SQL` AND t.DivisionID=${+division}`);
    }
  }
  search.append(SQL` ORDER BY t.Name ASC`);

  const teams = await query(search);

  if ('error' in teams) {
    res.status(500).send('Server Connection Failed');
    return;
  }

  if (teams.length === 0) {
    res.status(200).json([]);
    return;
  }

  const parsed = teams.map((team) => ({
    id: team.TeamID,
    league: team.LeagueID,
    season: team.SeasonID,
    name: `${team.Name} ${team.Nickname}`,
    abbreviation: team.Abbr,
    location:
      team.LeagueID === 2 || team.LeagueID === 3 ? team.Nickname : team.Name,
    colors: {
      primary: team.PrimaryColor,
      secondary: team.SecondaryColor,
      text: team.TextColor,
    },
  }));

  res.status(200).json(parsed);
};
