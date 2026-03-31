import { GameRow } from 'typings/api';

import { TeamInfo } from '../../pages/api/v1/teams';
import { League } from '../../utils/leagueHelpers';

import { ScheduleGameMatchup } from './ScheduleGameMatchup';

export const ScheduleDay = ({
  league,
  date,
  games,
  teamData,
}: {
  league: League;
  date: string;
  games: GameRow[];
  teamData: TeamInfo[];
}) => {
  return (
    <div className="m-4 flex w-[300px] flex-col px-1 ">
      <h2 className="border-b-2 border-b-grey500 pb-1 font-mont text-2xl font-bold">
        {date}
      </h2>
      {games.map((game) => (
        <ScheduleGameMatchup
          game={game}
          key={game.Slug}
          league={league}
          teamData={teamData}
        />
      ))}
    </div>
  );
};
