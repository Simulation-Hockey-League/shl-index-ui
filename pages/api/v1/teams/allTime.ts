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
  league: number;
  name: string;
  nickname: string;
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

const SORTABLE_COLUMNS: Record<string, string> = {
  points: 's.points',
  wins: 's.wins',
  losses: 's.losses',
  overtimeLosses: 's.overtimeLosses',
  goalsFor: 's.goalsFor',
  goalsAgainst: 's.goalsAgainst',
  winPercent: 's.winPercent',
};

export default async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  await use(req, res, cors);

  const {
    league = 0,
    sort,
    order = 'desc',
    startSeason,
    endSeason,
  } = req.query;

  const sortSql = SORTABLE_COLUMNS[sort] || SORTABLE_COLUMNS.points;

  let orderSql: string;
  if (order === 'asc') {
    orderSql = 'ASC';
  } else {
    orderSql = 'DESC';
  }

  const search = SQL`
SELECT
  s.TeamID AS id,
  s.LeagueID AS league,
  t.Name AS name,
  t.Nickname AS nickname,
  s.wins,
  s.losses,
  s.overtimeLosses,
  s.shootoutWins,
  s.shootoutLosses,
  s.points,
  s.goalsFor,
  s.goalsAgainst,
  ROUND(s.wins / NULLIF(s.wins + s.losses + s.overtimeLosses, 0), 3) AS winPercent
FROM (
  SELECT
    TeamID,
    LeagueID,
    SUM(Wins) AS wins,
    SUM(Losses) AS losses,
    SUM(OTL) AS overtimeLosses,
    SUM(SOW) AS shootoutWins,
    SUM(SOL) AS shootoutLosses,
    SUM(Points) AS points,
    SUM(GF) AS goalsFor,
    SUM(GA) AS goalsAgainst
  FROM team_records
  WHERE LeagueID = ${+league}`
    .append(startSeason != null ? SQL` AND SeasonID >= ${+startSeason} ` : '')
    .append(endSeason != null ? SQL` AND SeasonID <= ${+endSeason} ` : '')
    .append(SQL`
  GROUP BY TeamID, LeagueID
) s
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
) t
  ON s.TeamID = t.TeamID
  AND s.LeagueID = t.LeagueID`).append(`
ORDER BY ${sortSql} ${orderSql};
`);

  const teams = await query(search);

  if ('error' in teams) {
    res.status(500).send('Server Connection Failed');
    return;
  }

  if (teams.length === 0) {
    res.status(404).json({ message: 'No teams found' });
    return;
  }
  res.status(200).json(teams);
};
