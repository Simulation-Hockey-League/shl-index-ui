//@ts-nocheck
import Cors from 'cors';
import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';

import { query } from '../../../../lib/db';
import use from '../../../../lib/middleware';

const cors = Cors({
  methods: ['GET', 'HEAD'],
});

export const pathToCards = 'https://simulationhockey.com/tradingcards/';

export default async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  await use(req, res, cors);

  const { league, playerid } = req.query;

  if (!league || !playerid) {
    res.status(400).end('Missing league or playerid');
    return;
  }

  const cards = await query(SQL`
    SELECT playerID, leagueID, overall, image_url
    FROM cards
    WHERE playerID=${+playerid}
    AND leagueID=${+league}
    ORDER BY overall DESC
  `);

  if ('error' in cards) {
    res.status(500).end('Server connection failed');
    return;
  }

  const parsed = cards.map((card) => ({
    playerID: card.playerID,
    leagueID: card.leagueID,
    card_rarity: card.card_rarity,
    overall: card.overall,
    image_url: `${pathToCards}${card.image_url}`,
  }));

  res.status(200).json(parsed);
};
