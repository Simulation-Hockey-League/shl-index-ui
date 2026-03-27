import {
  FormControl,
  FormLabel,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { Select } from 'components/common/Select';
import { GetStaticPaths, GetStaticProps } from 'next';
import { NextSeo } from 'next-seo';
import { useCallback, useMemo, useState } from 'react';

import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { Leaderboard } from '../../components/leaderboard/Leaderboard';
import {
  goalieLeaderboardStats,
  LeaderboardTypes,
  leaderboardTypes,
  skaterLeaderboardStats,
} from '../../components/leaderboard/shared';
import { SeasonTypeSelector } from '../../components/SeasonTypeSelector';
import { useRouterPageState } from '../../hooks/useRouterPageState';
import { League } from '../../utils/leagueHelpers';

export default ({ league }: { league: League }) => {
  const [rookie, setRookie] = useState(false);
  const { tab, setRouterPageState } = useRouterPageState<{
    tab: LeaderboardTypes;
  }>({
    keys: ['tab'],
    initialState: {
      tab: 'Skaters',
    },
  });

  const currentActiveTab = useMemo(() => {
    return leaderboardTypes.indexOf(tab);
  }, [tab]);

  const setCurrentActiveTab = useCallback(
    (index: number) => {
      setRouterPageState('tab', leaderboardTypes[index]);
    },
    [setRouterPageState],
  );

  return (
    <>
      <NextSeo
        title={`${league.toUpperCase()} ${tab} Leaders`}
        openGraph={{
          title: `${league.toUpperCase()} ${tab} Leaders`,
        }}
      />
      <Header league={league} activePage="leaders" />
      <div className="mx-auto w-full space-y-2 bg-primary py-6 sm:px-6 lg:w-3/4 lg:py-0 lg:pb-10 lg:pt-px">
        <div className="mt-3 flex flex-col-reverse items-center gap-2 sm:mt-0 sm:flex-row sm:gap-3 lg:float-right lg:flex lg:items-center">
          <SeasonTypeSelector className="z-30 !h-7 w-48 lg:top-7" />
          <Select<LeaderboardTypes>
            options={leaderboardTypes}
            selectedOption={leaderboardTypes[currentActiveTab]}
            onSelection={(value) => {
              setCurrentActiveTab(leaderboardTypes.indexOf(value));
            }}
            className="w-48 sm:!hidden"
          />
        </div>
        <Tabs isLazy index={currentActiveTab} onChange={setCurrentActiveTab}>
          <TabList className="mt-7 !hidden sm:!flex sm:w-full">
            {leaderboardTypes.map((type) => (
              <Tab key={type}>{type}</Tab>
            ))}
          </TabList>
          <div className="flex items-center justify-center py-2 sm:justify-end">
            <FormControl display="flex" alignItems="center" w="auto" gap="1">
              <FormLabel mb="0" className="!text-sm leading-none">
                Rookies Only:
              </FormLabel>
              <Switch
                id="rookie"
                isChecked={rookie}
                onChange={(e) => setRookie(e.target.checked)}
              />
            </FormControl>
          </div>
          <TabPanels>
            {leaderboardTypes.map((type) => {
              if (type === 'Goalies') {
                return (
                  <TabPanel
                    key={type}
                    className="flex flex-wrap justify-center"
                  >
                    <div className="flex flex-wrap justify-center">
                      {goalieLeaderboardStats.map((stat) => (
                        <Leaderboard
                          key={stat}
                          league={league}
                          leaderboardType={{
                            playerType: type,
                            stat,
                          }}
                          rookie={rookie}
                        />
                      ))}
                    </div>
                  </TabPanel>
                );
              }

              return (
                <TabPanel key={type}>
                  <div className="flex flex-wrap justify-center">
                    {skaterLeaderboardStats.map((stat) => (
                      <Leaderboard
                        key={stat}
                        league={league}
                        leaderboardType={{
                          playerType: type,
                          stat,
                        }}
                        rookie={rookie}
                      />
                    ))}
                  </div>
                </TabPanel>
              );
            })}
          </TabPanels>
        </Tabs>
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
