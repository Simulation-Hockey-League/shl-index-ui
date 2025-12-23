import {
  Checkbox,
  Spinner,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { GetStaticPaths, GetStaticProps } from 'next';
import { NextSeo } from 'next-seo';
import { useMemo, useState } from 'react';

import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { SeasonTypeSelector } from '../../components/SeasonTypeSelector';
import { STHSWarningBanner } from '../../components/sths/STHSWarningBanner';
import { GoalieRatingsTable } from '../../components/tables/GoalieRatingsTable';
import { GoalieScoreTable } from '../../components/tables/GoalieScoreTable';
import { SkaterAdvStatsTable } from '../../components/tables/SkaterAdvStatsTable';
import { SkaterRatingsTable } from '../../components/tables/SkaterRatingsTable';
import { SkaterScoreTable } from '../../components/tables/SkaterScoreTable';
import { useSeason } from '../../hooks/useSeason';
import { useSeasonType } from '../../hooks/useSeasonType';
import { Goalie, PlayerWithAdvancedStats } from '../../typings/api';
import { League, leagueNameToId } from '../../utils/leagueHelpers';
import { query } from '../../utils/query';
import { seasonTypeToApiFriendlyParam } from '../../utils/seasonTypeHelpers';
import { GoalieRatings } from '../api/v1/goalies/ratings/[id]';
import { SkaterRatings } from '../api/v1/players/ratings/[id]';

export default ({ league }: { league: League }) => {
  const { season, isSTHS } = useSeason();
  const { type } = useSeasonType();
  const [rookie, setRookie] = useState(false);
  const [positions, setPositions] = useState({
    C: true,
    LW: true,
    RW: true,
    LD: true,
    RD: true,
  });

  const { data: skaterScoring } = useQuery<PlayerWithAdvancedStats[]>({
    queryKey: ['skaterScoring', league, type, season, rookie],
    queryFn: () => {
      const seasonParam = season ? `&season=${season}` : '';
      const seasonTypeParam = type
        ? `&type=${seasonTypeToApiFriendlyParam(type)}`
        : '';
      const rookieParam = rookie ? '&rookie=true' : '';
      return query(
        `api/v1/players/stats?league=${leagueNameToId(
          league,
        )}${seasonParam}${seasonTypeParam}${rookieParam}`,
      );
    },
  });
  const filteredSkaterScoring = useMemo(() => {
    if (!skaterScoring) return [];
    return skaterScoring.filter((player) => {
      return positions[player.position as keyof typeof positions];
    });
  }, [skaterScoring, positions]);

  const { data: goalieScoring } = useQuery<Goalie[]>({
    queryKey: ['goalieScoring', league, type, season, rookie],
    queryFn: () => {
      const seasonParam = season ? `&season=${season}` : '';
      const seasonTypeParam = type
        ? `&type=${seasonTypeToApiFriendlyParam(type)}`
        : '';
      const rookieParam = rookie ? '&rookie=true' : '';
      return query(
        `api/v1/goalies/stats?league=${leagueNameToId(
          league,
        )}${seasonParam}${seasonTypeParam}${rookieParam}`,
      );
    },
  });

  const { data: skaterRatings } = useQuery<SkaterRatings[]>({
    queryKey: ['skaterRatings', league, season],
    queryFn: () => {
      const seasonParam = season ? `&season=${season}` : '';
      return query(
        `api/v1/players/ratings?league=${leagueNameToId(league)}${seasonParam}`,
      );
    },
    enabled: !isSTHS,
  });

  const filteredSkaterRatings = useMemo(() => {
    if (!skaterRatings) return [];
    return skaterRatings.filter((player) => {
      return positions[player.position as keyof typeof positions];
    });
  }, [skaterRatings, positions]);

  const { data: goalieRatings } = useQuery<GoalieRatings[]>({
    queryKey: ['goalieRatings', league, season],
    queryFn: () => {
      const seasonParam = season ? `&season=${season}` : '';
      return query(
        `api/v1/goalies/ratings?league=${leagueNameToId(league)}${seasonParam}`,
      );
    },
    enabled: !isSTHS,
  });

  let isLoading = isSTHS
    ? !filteredSkaterScoring || !goalieScoring
    : !filteredSkaterScoring ||
      !filteredSkaterRatings ||
      !goalieRatings ||
      !goalieScoring;

  return (
    <>
      <NextSeo
        title={`${league.toUpperCase()} Players`}
        openGraph={{
          title: `${league.toUpperCase()} Players`,
        }}
      />
      <Header league={league} activePage="players" />
      <div className="mx-auto w-full bg-primary p-[2.5%] lg:w-3/4 lg:pb-10 lg:pt-px">
        {isLoading ? (
          <div className="flex size-full items-center justify-center">
            <Spinner size="xl" />
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center md:mr-8 md:flex-row md:justify-end">
              <SeasonTypeSelector className="top-7 !h-7 w-48" />
            </div>
            <h2 className="my-7 border-b border-b-primary py-1 text-4xl font-bold">
              Skaters
            </h2>
            {isSTHS && <STHSWarningBanner />}
            <Tabs>
              <TabList>
                <Tab>Stats</Tab>
                {!isSTHS && <Tab>Advanced Stats</Tab>}
                {!isSTHS && <Tab>Ratings</Tab>}
              </TabList>
              <div className="mt-4 flex flex-col gap-4 rounded-md bg-grey900/50 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">Rookies Only:</span>
                  <Switch
                    id="rookie-filter"
                    isChecked={rookie}
                    onChange={(e) => setRookie(e.target.checked)}
                    colorScheme="blue"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-sm font-semibold">Position:</span>
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    {(['C', 'LW', 'RW', 'LD', 'RD'] as const).map((pos) => (
                      <Checkbox
                        key={pos}
                        isChecked={positions[pos]}
                        onChange={(e) =>
                          setPositions({
                            ...positions,
                            [pos]: e.target.checked,
                          })
                        }
                        colorScheme="blue"
                      >
                        {pos}
                      </Checkbox>
                    ))}
                  </div>
                </div>
              </div>
              <TabPanels>
                <TabPanel>
                  <SkaterScoreTable
                    data={filteredSkaterScoring ?? []}
                    type="league"
                  />
                </TabPanel>
                {!isSTHS && filteredSkaterScoring && (
                  <TabPanel>
                    <SkaterAdvStatsTable
                      data={filteredSkaterScoring}
                      type="league"
                    />
                  </TabPanel>
                )}
                {!isSTHS && filteredSkaterRatings && (
                  <TabPanel>
                    <SkaterRatingsTable
                      data={filteredSkaterRatings}
                      type="league"
                    />
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
            <h2 className="my-7 border-b border-b-grey900 py-1 text-4xl font-bold">
              Goalies
            </h2>
            <Tabs>
              <TabList>
                <Tab>Stats</Tab>
                {!isSTHS && <Tab>Ratings</Tab>}
              </TabList>
              <TabPanels>
                <TabPanel>
                  <GoalieScoreTable data={goalieScoring ?? []} type="league" />
                </TabPanel>
                {!isSTHS && goalieRatings && (
                  <TabPanel>
                    <GoalieRatingsTable data={goalieRatings} type="league" />
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
          </>
        )}
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
