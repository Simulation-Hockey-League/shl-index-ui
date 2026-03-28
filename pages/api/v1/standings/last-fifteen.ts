import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';

import { query } from '../../../../lib/db';
import use from '../../../../lib/middleware';

const cors = Cors({
  methods: ['GET', 'HEAD'],
});

export default async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  await use(req, res, cors);

  const leagueID = req.query.leagueID as string;
  const seasonID = req.query.seasonID as string;

  if (Number(seasonID) <= 65) {
    res.status(400).json({ error: 'Season but be above S66' });
    return;
  }
  if (!leagueID || !seasonID) {
    res.status(400).json({ error: 'needs seasonID and leagueID' });
    return;
  }

  const top_15 = await query(SQL`
    CALL team_last_X(${seasonID}, ${leagueID},15)
  `);

  if ('error' in top_15) {
    res.status(400).json({ error: 'Server error' });
    return;
  }

  res.status(200).json(top_15[0]);
};
