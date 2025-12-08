import { NextApiRequest, NextApiResponse } from 'next';
import SQL from 'sql-template-strings';

import { query } from '../../../../lib/db';

export type PlayerNames = {
  PlayerID: number;
  Name: string;
};

export default async (
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> => {
  const { league, isGoalie } = req.query;

  if (!league) {
    res.status(400).json({ error: 'Missing leagueID' });
    return;
  }

  const goalieFlag = isGoalie === 'true';

  const search = SQL`
  SELECT pm.PlayerID, pm.\`Last Name\` AS Name
  FROM player_master pm
  LEFT JOIN player_ratings pr
    ON pm.PlayerID = pr.PlayerID
   AND pm.LeagueID = pr.LeagueID
   AND pm.SeasonID = pr.SeasonID
  WHERE pm.LeagueID = ${league}
    AND pm.TeamID >= 0
`;

  if (isGoalie !== undefined) {
    if (goalieFlag) {
      search.append(SQL` AND pr.G = 20`);
    } else {
      search.append(SQL` AND pr.G != 20`);
    }
  }

  search.append(SQL` GROUP BY pm.PlayerID`);
  const playerName = await query(search);

  if ('error' in playerName || playerName.length === 0) {
    res.status(400).json({ error: 'Server error' });
    return;
  }

  res.status(200).json(playerName);
};
