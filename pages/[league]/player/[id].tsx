import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  Link,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Image,
} from '@chakra-ui/react';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import classnames from 'classnames';
import { PlayerCards } from 'components/PlayerCards';
import { GoalieBoxscoreTable } from 'components/tables/GoalieBoxscoreTable';
import { PlayerAwards } from 'components/tables/PlayerAwardsTables';
import { SkaterBoxscoreTable } from 'components/tables/SkaterBoxscoreTable';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { useTheme } from 'next-themes';
import { pathToCards } from 'pages/api/v1/players/cards';
import { useEffect, useMemo, useRef } from 'react';
import {
  IndexPortalInfo,
  InternalPlayerAchievement,
  PlayerCard,
} from 'typings/portal-api';

import { Footer } from '../../../components/Footer';
import { Header } from '../../../components/Header';
import { SeasonTypeSelector } from '../../../components/SeasonTypeSelector';
import { GoalieRatingsTable } from '../../../components/tables/GoalieRatingsTable';
import { GoalieScoreTable } from '../../../components/tables/GoalieScoreTable';
import { SkaterAdvStatsTable } from '../../../components/tables/SkaterAdvStatsTable';
import { SkaterRatingsTable } from '../../../components/tables/SkaterRatingsTable';
import { SkaterScoreTable } from '../../../components/tables/SkaterScoreTable';
import { TeamLogo } from '../../../components/TeamLogo';
import { useSeasonType } from '../../../hooks/useSeasonType';
import {
  Goalie,
  GoalieInfo,
  PlayerInfo,
  PlayerWithAdvancedStats,
} from '../../../typings/api';
import { League, leagueNameToId } from '../../../utils/leagueHelpers';
import { portalQuery, query } from '../../../utils/query';
import { seasonTypeToApiFriendlyParam } from '../../../utils/seasonTypeHelpers';
import { GoalieRatings } from '../../api/v1/goalies/ratings/[id]';
import { SkaterRatings as PlayerRatings } from '../../api/v1/players/ratings/[id]';

const fetchPlayerType = (league: League, playerId: string) =>
  query(
    `api/v2/player/playerType?league=${leagueNameToId(
      league,
    )}&playerId=${playerId}`,
  );
const fetchPlayerName = (league: League, playerId: string, seasonId?: string) =>
  query(
    `api/v2/player/playerName?league=${leagueNameToId(
      league,
    )}&playerId=${playerId}${seasonId ? `&seasonId=${seasonId}` : ''}`,
  );

const fetchPlayerAwards = (league: League, playerId: string) =>
  portalQuery(
    `api/v1/history/player?leagueID=${leagueNameToId(
      league,
    )}&fhmID=${playerId}`,
  );

const fetchPortalInfo = (
  league: League,
  playerId: string,
): Promise<IndexPortalInfo[]> =>
  portalQuery(
    `api/v1/player/index-info?leagueID=${leagueNameToId(
      league,
    )}&indexID=${playerId}`,
  );

const fetchPlayerCards = (league: League, playerId: string) =>
  query(
    `api/v1/players/cards?league=${leagueNameToId(league)}&playerid=${playerId}`,
  );

export default ({ playerId, league }: { playerId: string; league: League }) => {
  const router = useRouter();

  const { portalView, season } = router.query;

  const shouldShowIndexView = !portalView;

  const { setTheme } = useTheme();

  useEffect(() => {
    if (!shouldShowIndexView) return;

    if (portalView === 'dark') {
      setTheme('dark');
    } else if (portalView === 'light') {
      setTheme('light');
    }
  }, [portalView, shouldShowIndexView, setTheme]);

  const { type } = useSeasonType();

  const { data: playerTypeInfo } = useQuery<{
    playerType: 'skater' | 'goalie';
  }>({
    queryKey: ['playerType', league, playerId],
    queryFn: () => fetchPlayerType(league, playerId),
  });

  const { data: playerNameInfo } = useQuery<{ name: string }>({
    queryKey: ['playerName', league, playerId, season],
    queryFn: () =>
      fetchPlayerName(
        league,
        playerId,
        season ? (season as string) : undefined,
      ),
  });

  const { data: playerInfo } = useQuery<PlayerInfo[] | GoalieInfo[]>({
    queryKey: ['playerInfo', league, playerId, playerTypeInfo?.playerType],
    queryFn: () => {
      const endpoint =
        playerTypeInfo?.playerType === 'goalie' ? 'goalies' : 'players';
      return query(
        `api/v1/${endpoint}/${playerId}?league=${leagueNameToId(league)}`,
      );
    },
    enabled: !!playerTypeInfo,
  });

  const { data: playerAwards } = useQuery<InternalPlayerAchievement[]>({
    queryKey: ['playerAwards', league, playerId],
    queryFn: () => fetchPlayerAwards(league, playerId),
  });

  const { data: playerPortalInfo } = useQuery({
    queryKey: ['playerPortalInfo', league, playerId],
    queryFn: () => fetchPortalInfo(league, playerId),
    select: (data) => data[0],
  });

  const { data: playerCards } = useQuery<PlayerCard[]>({
    queryKey: ['playerCards', league, playerId],
    queryFn: () => fetchPlayerCards(league, playerId),
  });

  const { data: playerRatings } = useQuery<PlayerRatings[] | GoalieRatings[]>({
    queryKey: ['playerRatings', league, playerId, playerTypeInfo?.playerType],
    queryFn: () => {
      const endpoint =
        playerTypeInfo?.playerType === 'goalie' ? 'goalies' : 'players';
      return query(
        `api/v1/${endpoint}/ratings/${playerId}?league=${leagueNameToId(
          league,
        )}`,
      );
    },
    enabled: !!playerTypeInfo?.playerType,
  });

  const { data: playerStats } = useQuery<PlayerWithAdvancedStats[] | Goalie[]>({
    queryKey: [
      'playerStats',
      league,
      playerId,
      type,
      playerTypeInfo?.playerType,
    ],
    queryFn: () => {
      const seasonTypeParam = type
        ? `&type=${seasonTypeToApiFriendlyParam(type)}`
        : '';
      const endpoint =
        playerTypeInfo?.playerType === 'goalie' ? 'goalies' : 'players';
      return query(
        `api/v1/${endpoint}/stats/${playerId}?league=${leagueNameToId(
          league,
        )}${seasonTypeParam}`,
      );
    },
    enabled: !!playerTypeInfo?.playerType,
  });

  const isLoading = !playerInfo || !playerRatings || !playerStats;
  const loaderRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (shouldShowIndexView) return;

    const contentHeight = isLoading
      ? loaderRef.current?.offsetHeight
      : detailsRef.current?.offsetHeight;
    parent.postMessage(contentHeight ?? 0, '*');
  }, [isLoading, shouldShowIndexView]);

  const seasonList = useMemo(() => {
    if (!playerStats) return [];
    return Array.from(
      new Set(playerStats.map((statsEntry) => statsEntry.season)),
    )
      .filter((season) => season >= 66)
      .sort((a, b) => b - a);
  }, [playerStats]);

  return (
    <>
      <NextSeo
        title={playerNameInfo?.name ?? 'Player'}
        openGraph={{
          title: playerNameInfo?.name ?? 'Player',
        }}
      />
      {shouldShowIndexView && <Header league={league} activePage="players" />}
      <div
        className={classnames(
          'mx-auto w-full bg-primary',
          shouldShowIndexView && 'p-[2.5%] lg:w-3/4 lg:px-0 lg:pb-10 lg:pt-px',
        )}
      >
        {isLoading ? (
          <div className="flex size-full items-center justify-center">
            <Spinner ref={loaderRef} size="xl" />
          </div>
        ) : (
          <div
            ref={detailsRef}
            className={classnames(
              'mx-auto',
              shouldShowIndexView && 'lg:w-11/12',
            )}
          >
            {shouldShowIndexView && (
              <div className="my-4 px-4">
                <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-6">
                  <div className="order-2 flex shrink-0 items-center justify-center md:order-1">
                    {playerCards && playerCards.length > 0 ? (
                      <Image
                        src={
                          playerPortalInfo?.selectedImage
                            ? `${pathToCards}${playerPortalInfo.selectedImage}`
                            : playerCards[0].image_url
                        }
                        alt={`${playerNameInfo?.name ?? 'Player'} card`}
                        className="h-44 w-auto rounded-md object-contain md:h-48"
                      />
                    ) : (
                      <Link
                        href={`/${league}/team/${playerInfo[0].teamID}`}
                        aria-label={`View ${playerInfo[0].team}'s page`}
                      >
                        <TeamLogo
                          league={league}
                          teamAbbreviation={playerInfo[0]?.team}
                          className="size-32 md:size-40"
                        />
                      </Link>
                    )}
                  </div>

                  <div className="order-1 flex min-w-0 flex-1 flex-col items-center gap-2 md:order-2 md:items-start">
                    <div className="flex w-full justify-center md:justify-end">
                      <SeasonTypeSelector className="!h-7 w-48" />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="font-mont text-2xl font-bold uppercase leading-tight md:text-3xl">
                        {playerNameInfo?.name ?? 'Player'}
                      </div>

                      {playerCards && playerCards.length > 0 && (
                        <Link
                          href={`/${league}/team/${playerInfo[0].teamID}`}
                          className="flex-shrink-0"
                        >
                          <TeamLogo
                            league={league}
                            teamAbbreviation={playerInfo[0]?.team}
                            className="size-7 md:size-9"
                          />
                        </Link>
                      )}
                    </div>

                    {playerPortalInfo && (
                      <div className="text-center font-mont text-sm text-secondary md:text-left">
                        <Link
                          className="!text-blue600"
                          href={`https://simulationhockey.com/member.php?action=profile&uid=${playerPortalInfo.userID}`}
                          isExternal
                        >
                          {playerPortalInfo.username}
                        </Link>
                        {' · '}#{playerPortalInfo.jerseyNumber}
                        {' · '}S{playerPortalInfo.season}
                        {' · '}
                        <Link
                          className="!text-blue600"
                          href={`https://portal.simulationhockey.com/player/${playerPortalInfo.playerUpdateID}`}
                          isExternal
                        >
                          View in portal <ExternalLinkIcon mx="2px" />
                        </Link>
                      </div>
                    )}

                    <div className="text-center font-mont text-lg uppercase">
                      {'position' in playerInfo[0]
                        ? playerInfo[0].position
                        : 'G'}{' '}
                      | {Math.floor(playerInfo[0].height / 12)} ft{' '}
                      {playerInfo[0].height % 12} in | {playerInfo[0].weight}{' '}
                      lbs
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!shouldShowIndexView && (
              <div className="flex flex-col items-center md:mr-8 md:flex-row md:justify-end">
                <SeasonTypeSelector className="top-7 mb-4 !h-7 w-48 md:mb-0 md:ml-4" />
              </div>
            )}

            <Tabs isLazy>
              <TabList flexWrap="wrap">
                <Tab
                  _selected={{
                    color: 'rgb(var(--hyperlink))',
                    borderBottomColor: 'rgb(var(--hyperlink))',
                  }}
                >
                  Stats
                </Tab>
                {playerTypeInfo?.playerType === 'skater' && (
                  <Tab
                    _selected={{
                      color: 'rgb(var(--hyperlink))',
                      borderBottomColor: 'rgb(var(--hyperlink))',
                    }}
                  >
                    Adv Stats
                  </Tab>
                )}
                <Tab
                  _selected={{
                    color: 'rgb(var(--hyperlink))',
                    borderBottomColor: 'rgb(var(--hyperlink))',
                  }}
                >
                  Ratings
                </Tab>
                <Tab
                  _selected={{
                    color: 'rgb(var(--hyperlink))',
                    borderBottomColor: 'rgb(var(--hyperlink))',
                  }}
                >
                  Game Logs
                </Tab>
                <Tab
                  _selected={{
                    color: 'rgb(var(--hyperlink))',
                    borderBottomColor: 'rgb(var(--hyperlink))',
                  }}
                >
                  Awards
                </Tab>
                <Tab
                  _selected={{
                    color: 'rgb(var(--hyperlink))',
                    borderBottomColor: 'rgb(var(--hyperlink))',
                  }}
                >
                  Cards
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  {playerTypeInfo?.playerType === 'skater' && (
                    <SkaterScoreTable
                      data={
                        playerStats as Exclude<typeof playerStats, Goalie[]>
                      }
                      type="player"
                    />
                  )}
                  {playerTypeInfo?.playerType === 'goalie' && (
                    <GoalieScoreTable
                      data={
                        playerStats as Exclude<
                          typeof playerStats,
                          PlayerWithAdvancedStats[]
                        >
                      }
                      type="player"
                    />
                  )}
                </TabPanel>
                {playerTypeInfo?.playerType === 'skater' && (
                  <TabPanel>
                    <SkaterAdvStatsTable
                      data={
                        playerStats as Exclude<typeof playerStats, Goalie[]>
                      }
                      type="player"
                    />
                  </TabPanel>
                )}

                <TabPanel>
                  {playerTypeInfo?.playerType === 'skater' && (
                    <SkaterRatingsTable
                      data={
                        playerRatings as Exclude<
                          typeof playerRatings,
                          GoalieRatings[]
                        >
                      }
                      type="player"
                    />
                  )}
                  {playerTypeInfo?.playerType === 'goalie' && (
                    <GoalieRatingsTable
                      data={
                        playerRatings as Exclude<
                          typeof playerRatings,
                          PlayerRatings[]
                        >
                      }
                      type="player"
                    />
                  )}
                </TabPanel>
                <TabPanel>
                  {playerTypeInfo?.playerType === 'skater' && (
                    <SkaterBoxscoreTable
                      playerID={playerId}
                      league={league}
                      type={type}
                      seasonList={seasonList}
                      selectedSeason={
                        Array.isArray(season) ? season[0] : season
                      }
                    />
                  )}
                  {playerTypeInfo?.playerType === 'goalie' && (
                    <GoalieBoxscoreTable
                      playerID={playerId}
                      league={league}
                      type={type}
                      seasonList={seasonList}
                      selectedSeason={
                        Array.isArray(season) ? season[0] : season
                      }
                    />
                  )}
                </TabPanel>
                <TabPanel>
                  {playerAwards && playerAwards.length > 0 && (
                    <PlayerAwards playerAwards={playerAwards} />
                  )}
                </TabPanel>
                <TabPanel>
                  {playerCards && <PlayerCards cards={playerCards} />}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </div>
        )}
      </div>
      {shouldShowIndexView && <Footer />}
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const queryClient = new QueryClient();
  const { league, id } = query;

  await queryClient.prefetchQuery({
    queryKey: ['playerType', league, id],
    queryFn: () => fetchPlayerType(league as League, id as string),
  });

  await queryClient.prefetchQuery({
    queryKey: ['playerName', league, id],
    queryFn: () => fetchPlayerName(league as League, id as string),
  });

  return {
    props: {
      league,
      playerId: id,
      dehydratedState: dehydrate(queryClient),
    },
  };
};
