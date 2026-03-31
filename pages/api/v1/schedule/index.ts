//@ts-nocheck
import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';
import { GameRow } from 'typings/api';

import { query } from '../../../../lib/db';
import use from '../../../../lib/middleware';

const cors = Cors({
  methods: ['GET', 'HEAD'],
});

const seasonTypes = ['Pre-Season', 'Regular Season', 'Playoffs'] as const;
export type SeasonType = (typeof seasonTypes)[number];

export default async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  await use(req, res, cors);

  const { league = 0, season: seasonid, type = 'Regular Season' } = req.query;

  const [season] =
    (!Number.isNaN(+seasonid) && [{ SeasonID: +seasonid }]) ||
    (await query(SQL`
      SELECT DISTINCT SeasonID
      FROM slugviewer
      WHERE LeagueID=${league}
      ORDER BY SeasonID DESC
      LIMIT 1
    `));

  const search = SQL`
    SELECT *
    FROM slugviewer
    WHERE LeagueID=${+league}
      AND SeasonID=${season.SeasonID}
  `;

  if (seasonTypes.includes(type as SeasonType)) {
    search.append(SQL`AND Type=${type}`);
  }

  const schedule = await query<GameRow[]>(search);
  res.status(200).json(schedule);
};
