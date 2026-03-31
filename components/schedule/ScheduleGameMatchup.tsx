import classnames from 'classnames';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { GameRow } from 'typings/api';

import { TeamInfo } from '../../pages/api/v1/teams';
import { League } from '../../utils/leagueHelpers';
import { onlyIncludeSeasonAndTypeInQuery } from '../../utils/routingHelpers';
import { Link } from '../common/Link';
import { TeamLogo } from '../TeamLogo';

const ScheduleMatchupTeam = ({
  league,
  game,
  teamData,
  winner,
  teamType,
}: {
  league: League;
  game: GameRow;
  teamData: TeamInfo[];
  winner: 'home' | 'away' | 'none';
  teamType: 'Home' | 'Away';
}) => {
  const { teamId, teamScore } = useMemo(() => {
    if (teamType === 'Away') {
      return {
        teamId: game.Away,
        teamScore: game.AwayScore,
      };
    }
    return {
      teamId: game.Home,
      teamScore: game.HomeScore,
    };
  }, [game.AwayScore, game.Away, game.HomeScore, game.Home, teamType]);

  const team = useMemo(
    () => teamData.find((team) => team.id === teamId),
    [teamData, teamId],
  );
  const winNote = game.Shootout ? '(SO)' : game.Overtime ? '(OT)' : '';
  return (
    <div
      className={classnames(
        'flex items-center justify-between font-medium',
        winner === 'none' || winner === teamType.toLowerCase()
          ? 'text-primary'
          : 'text-grey500',
      )}
    >
      <div className="flex items-center font-mont text-lg">
        <TeamLogo
          league={league}
          teamAbbreviation={team?.abbreviation}
          className="mr-1 size-6"
        />
        {team?.location} {winner === teamType.toLowerCase() && winNote}
      </div>
      <div className="flex-1 text-right font-mont text-3xl font-semibold">
        {winner === 'none' ? '-' : teamScore}
      </div>
    </div>
  );
};

export const ScheduleGameMatchup = ({
  league,
  game,
  teamData,
}: {
  league: League;
  game: GameRow;
  teamData: TeamInfo[];
}) => {
  const { query } = useRouter();
  const winner = game.Played
    ? game.AwayScore < game.HomeScore
      ? 'home'
      : 'away'
    : 'none';

  return (
    <Link
      href={{
        pathname: `/[league]/${game.SeasonID}/game/[gameid]`,
        query: {
          ...onlyIncludeSeasonAndTypeInQuery(query),
          gameid: game.Slug,
        },
      }}
      className="flex flex-col border-b-2 border-b-table px-2.5 py-1 hover:bg-secondary"
    >
      <ScheduleMatchupTeam
        game={game}
        league={league}
        teamType="Away"
        winner={winner}
        teamData={teamData}
      />
      <ScheduleMatchupTeam
        game={game}
        league={league}
        teamType="Home"
        winner={winner}
        teamData={teamData}
      />
    </Link>
  );
};
