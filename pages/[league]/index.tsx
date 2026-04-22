import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { PlayerSearchNavigate } from 'components/history/SelectPlayerSearchNav';
import { LastFifteenTable } from 'components/tables/LastFifteen';
import { useSeason } from 'hooks/useSeason';
import type { GetStaticPaths, GetStaticProps } from 'next/types';
import { NextSeo } from 'next-seo';
import { useMemo } from 'react';
import { lastFifteen, PlayerNames } from 'typings/api';
import { leagueNameToId } from 'utils/leagueHelpers';
import { query } from 'utils/query';

import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { HomepageLeaders } from '../../components/homepage/HomepageLeaders';
import { Livestream } from '../../components/Livestream';
import { League } from '../../utils/leagueHelpers';

export default ({ league }: { league: League }) => {
  const { season } = useSeason();

  const { data: playerSearch } = useQuery<PlayerNames[]>({
    queryKey: ['skaterScoring', league],
    queryFn: () =>
      query(`api/v2/player/playerSearch?league=${leagueNameToId(league)}`),
    refetchOnWindowFocus: false,
  });

  const { data: lastFifteen, isLoading: lastFifteenLoading } = useQuery<
    lastFifteen[]
  >({
    queryKey: ['lastFifteen', league, season],
    queryFn: () =>
      query(
        `api/v1/standings/last-fifteen?leagueID=${leagueNameToId(league)}&seasonID=${season}`,
      ),
    refetchOnWindowFocus: false,
  });

  const conferenceZero = useMemo(
    () => lastFifteen?.filter((t) => t.ConferenceID === 0) ?? [],
    [lastFifteen],
  );
  const conferenceOne = useMemo(
    () => lastFifteen?.filter((t) => t.ConferenceID === 1) ?? [],
    [lastFifteen],
  );

  return (
    <>
      <NextSeo
        title={league.toUpperCase()}
        openGraph={{ title: league.toUpperCase() }}
      />
      <Header league={league} />
      <div className="mx-auto my-0 w-full flex-1 overflow-visible bg-primary p-4 md:p-6 xl:w-3/4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="md:col-span-3">
            <Tabs variant="soft-rounded" colorScheme="blue" isLazy>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="pb-4 text-3xl font-bold">Trending Teams</h3>
                  <span className="text-sm font-normal text-secondary">
                    Teams performance over the last 15 games
                  </span>
                </div>
                <TabList className="mt-2 sm:mt-0">
                  <Tab fontSize="sm">By Conference</Tab>
                  <Tab fontSize="sm">All Teams</Tab>
                </TabList>
              </div>

              <TabPanels mt={3}>
                <TabPanel p={0}>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <LastFifteenTable
                        league={league}
                        data={conferenceZero}
                        title="Conference 1"
                        isLoading={lastFifteenLoading}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <LastFifteenTable
                        league={league}
                        data={conferenceOne}
                        title="Conference 2"
                        isLoading={lastFifteenLoading}
                      />
                    </div>
                  </div>
                </TabPanel>
                <TabPanel p={0}>
                  <LastFifteenTable
                    league={league}
                    data={lastFifteen ?? []}
                    title="All Teams"
                    isLoading={lastFifteenLoading}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </div>

          <div className="divide-y-2 divide-secondary md:col-span-1">
            <div className="relative isolate z-10 mb-4">
              <PlayerSearchNavigate players={playerSearch} league={league} />
            </div>
            <h3 className="pb-4 text-3xl font-bold">League Leaders</h3>
            <HomepageLeaders league={league} skaterType="skater" stat="goals" />
            <HomepageLeaders
              league={league}
              skaterType="skater"
              stat="points"
            />
            <HomepageLeaders league={league} skaterType="goalie" stat="wins" />
            <HomepageLeaders
              league={league}
              skaterType="goalie"
              stat="shutouts"
            />
          </div>

          <div className="hidden md:col-span-3 md:block">
            <Livestream league={league} />
          </div>

          <div className="hidden divide-y-2 divide-secondary md:col-span-1 md:block">
            <h3 className="pb-4 text-3xl font-bold">Rookie Leaders</h3>
            <HomepageLeaders
              league={league}
              skaterType="skater"
              stat="goals"
              rookie="true"
            />
            <HomepageLeaders
              league={league}
              skaterType="skater"
              stat="points"
              rookie="true"
            />
            <HomepageLeaders
              league={league}
              skaterType="goalie"
              stat="wins"
              rookie="true"
            />
            <HomepageLeaders
              league={league}
              skaterType="goalie"
              stat="shutouts"
              rookie="true"
            />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const leagues = ['shl', 'smjhl', 'iihf', 'wjc'];

  const paths = leagues.map((league) => ({
    params: { league },
  }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  return { props: { league: ctx.params?.league } };
};
