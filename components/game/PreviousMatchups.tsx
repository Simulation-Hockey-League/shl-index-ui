import { Spinner } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import classnames from 'classnames';
import { useRouter } from 'next/router';
import { GameRow } from 'typings/api';

import { GamePreviewData } from '../../pages/api/v2/schedule/game/preview';
import { League } from '../../utils/leagueHelpers';
import { query } from '../../utils/query';
import { onlyIncludeSeasonAndTypeInQuery } from '../../utils/routingHelpers';
import { Link } from '../common/Link';
import { TeamLogo } from '../TeamLogo';

export const PreviousMatchups = ({
  league,
  previewData,
}: {
  league: League;
  previewData: GamePreviewData | undefined;
}) => {
  console.log(previewData);
  const router = useRouter();
  const { data } = useQuery<GameRow[]>({
    queryKey: [
      `previousMatchups`,
      previewData?.game.LeagueID,
      previewData?.game.SeasonID,
      previewData?.game.Type,
      previewData?.game.Away,
      previewData?.game.Home,
    ],
    queryFn: () =>
      query(
        `api/v2/schedule/game/previousMatchups?league=${previewData?.game.LeagueID}&season=${previewData?.game.SeasonID}&type=${previewData?.game.Type}&away=${previewData?.game.Away}&home=${previewData?.game.Home}`,
      ),
    enabled: !!previewData,
  });

  if (!previewData || !data) {
    return (
      <div className="flex h-fit w-full flex-col items-center justify-center bg-primary p-4">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-primary">
      <div className="border-b-2 border-b-grey300 px-4 py-2.5 font-semibold">
        {previewData.game.Type} Series
      </div>
      {data.length === 0 ? (
        <div className="flex flex-col bg-primary px-4 py-2.5">
          No previous games played
        </div>
      ) : (
        <div className="divide-y-2 divide-grey300">
          {data.map((matchup) => {
            const awayTeamInfo =
              matchup.Away === previewData.game.Away
                ? previewData.teams.away
                : previewData.teams.home;

            const homeTeamInfo =
              matchup.Home === previewData.game.Home
                ? previewData.teams.home
                : previewData.teams.away;

            return (
              <Link
                key={matchup.Slug}
                href={{
                  pathname: `/[league]/${previewData.game.SeasonID}/game/[gameid]`,
                  query: {
                    ...onlyIncludeSeasonAndTypeInQuery(router.query),
                    gameid: matchup.Slug,
                  },
                }}
                className={classnames(
                  'flex flex-col bg-primary px-4 py-2.5 hover:brightness-75',
                )}
              >
                <span className="mb-1.5 font-mont text-sm font-medium">
                  {matchup.Date} {matchup.Played ? ' • Final' : ' • Not Played'}
                </span>
                <div className="mb-1.5 flex items-center justify-between font-mont text-sm font-medium">
                  <div className="flex items-center">
                    <TeamLogo
                      league={league}
                      teamAbbreviation={awayTeamInfo.abbr}
                      className="mr-2 size-[25px]"
                    />
                    {awayTeamInfo.nickname}
                  </div>
                  <span
                    className={classnames(
                      'text-base',
                      matchup.AwayScore < matchup.HomeScore && 'text-grey500',
                      !matchup.Played && 'hidden',
                    )}
                  >
                    {matchup.AwayScore}
                  </span>
                </div>
                <div className="mb-1.5 flex items-center justify-between font-mont text-sm font-medium">
                  <div className="flex items-center">
                    <TeamLogo
                      league={league}
                      teamAbbreviation={homeTeamInfo.abbr}
                      className="mr-2 size-[25px]"
                    />
                    {homeTeamInfo.nickname}
                  </div>
                  <span
                    className={classnames(
                      'text-base',
                      matchup.HomeScore < matchup.AwayScore && 'text-grey500',
                      !matchup.Played && 'hidden',
                    )}
                  >
                    {matchup.HomeScore}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
