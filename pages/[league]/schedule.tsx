import { DownloadIcon } from '@chakra-ui/icons';
import { Checkbox, IconButton, Spinner } from '@chakra-ui/react';
import { Tooltip } from '@chakra-ui/react';
import { dehydrate, QueryClient, useQuery } from '@tanstack/react-query';
import { ScheduleTable } from 'components/tables/ScheduleTable';
import { groupBy, isEmpty } from 'lodash';
import { GetServerSideProps } from 'next';
import { NextSeo } from 'next-seo';
import { useCallback, useMemo } from 'react';
import { Game } from 'typings/api';
import { downloadRowsAsCSV } from 'utils/tableHelpers';

import { Select } from '../../components/common/Select';
import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { ScheduleDay } from '../../components/schedule/ScheduleDay';
import { SeasonTypeSelector } from '../../components/SeasonTypeSelector';
import { useRouterPageState } from '../../hooks/useRouterPageState';
import { useSeason } from '../../hooks/useSeason';
import { useSeasonType } from '../../hooks/useSeasonType';
import { League, leagueNameToId } from '../../utils/leagueHelpers';
import { query } from '../../utils/query';
import { TeamInfo } from '../api/v1/teams';

const getTeamsListData = async (league: League, season: number | undefined) => {
  const seasonParam = season ? `&season=${season}` : '';
  return query(`api/v1/teams?league=${leagueNameToId(league)}${seasonParam}`);
};

type ViewMode = 'classic' | 'table';

export default ({ league }: { league: League }) => {
  const { type } = useSeasonType();
  const { season, isSTHS } = useSeason();

  const handleDownload = () => {
    downloadRowsAsCSV(filteredGames, 'schedule');
  };

  const {
    selectedTeam: currentSelectedTeam,
    unplayedOnly,
    viewMode,
    setRouterPageState,
  } = useRouterPageState<{
    selectedTeam: string;
    unplayedOnly: 'false' | 'true';
    viewMode: ViewMode;
  }>({
    keys: ['selectedTeam', 'unplayedOnly', 'viewMode'],
    initialState: {
      selectedTeam: '-1',
      unplayedOnly: 'false',
      viewMode: 'classic',
    },
  });

  const selectedTeam = parseInt(currentSelectedTeam);

  const { data: teamList } = useQuery<TeamInfo[]>({
    queryKey: ['teams', league, season],
    queryFn: () => getTeamsListData(league, season),
  });

  const { data } = useQuery<Game[]>({
    queryKey: ['schedule', league, season, type],
    queryFn: () => {
      const seasonParam = season ? `&season=${season}` : '';

      return query(
        `api/v1/schedule?league=${leagueNameToId(
          league,
        )}&type=${type}${seasonParam}`,
      );
    },
  });

  const { teamSelectorList, teamSelectorMap } = useMemo(() => {
    if (!teamList) {
      return {
        teamSelectorList: null,
        teamSelectorMap: null,
      };
    }

    const selectorList = (
      teamList
        ?.map((team) => [team.id, team.name])
        .concat([[-1, 'All Teams']]) as [number, string][]
    ).sort((a, b) => a[1].localeCompare(b[1]));

    return {
      teamSelectorList: selectorList.map((team) => team[0]),
      teamSelectorMap: new Map<number, string>(selectorList),
    };
  }, [teamList]);

  const onTeamSelection = useCallback(
    (team: number) => {
      setRouterPageState('selectedTeam', team);
    },
    [setRouterPageState],
  );

  const filteredGames = useMemo(() => {
    return (
      data
        ?.filter((game) => unplayedOnly === 'false' || !game.played)
        .filter(
          (game) =>
            selectedTeam === -1 ||
            game.awayTeam === selectedTeam ||
            game.homeTeam === selectedTeam,
        ) ?? []
    );
  }, [data, selectedTeam, unplayedOnly]);

  const gamesByDate = useMemo(() => {
    return groupBy(filteredGames, (game) => game.date);
  }, [filteredGames]);

  return (
    <>
      <NextSeo
        title={`${league.toUpperCase()} Schedule`}
        openGraph={{
          title: `${league.toUpperCase()} Schedule`,
        }}
      />
      <Header league={league} activePage="schedule" />
      <div className="m-auto w-full bg-primary py-10 lg:w-3/4 lg:p-[2.5%]">
        {isSTHS ? (
          <div className="text-center text-2xl font-bold">
            No Schedule before S53
          </div>
        ) : (
          <>
            {!teamList || !teamSelectorList || !teamSelectorMap || !data ? (
              <div className="flex size-full items-center justify-center">
                <Spinner size="xl" />
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center space-y-2 md:mr-8 md:flex-row md:justify-end md:space-x-2 md:space-y-0">
                  <SeasonTypeSelector className="!h-7 w-48" />
                  <Select<number>
                    options={teamSelectorList}
                    selectedOption={selectedTeam}
                    onSelection={onTeamSelection}
                    optionsMap={teamSelectorMap}
                    className="!h-7 w-56"
                  />
                  <div className="flex items-center overflow-hidden rounded border border-primary text-sm">
                    {(['classic', 'table'] as ViewMode[]).map((mode) => (
                      <Tooltip
                        key={mode}
                        label="Select a team to use table view"
                        isDisabled={!(mode === 'table' && selectedTeam === -1)}
                      >
                        <button
                          onClick={() => setRouterPageState('viewMode', mode)}
                          disabled={mode === 'table' && selectedTeam === -1}
                          className={`px-3 py-1 capitalize transition-colors ${
                            viewMode === mode
                              ? 'bg-blue600'
                              : 'bg-primary text-secondary hover:bg-secondary'
                          } ${mode === 'table' && selectedTeam === -1 ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          {mode}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                  <Checkbox
                    isChecked={unplayedOnly === 'true'}
                    onChange={() =>
                      setRouterPageState(
                        'unplayedOnly',
                        unplayedOnly === 'true' ? 'false' : 'true',
                      )
                    }
                    className="border-primary"
                  >
                    Hide Played Games
                  </Checkbox>
                  {viewMode === 'classic' && (
                    <IconButton
                      icon={<DownloadIcon />}
                      variant="outline"
                      aria-label="Download schedule as CSV"
                      size="sm"
                      onClick={handleDownload}
                      isDisabled={!filteredGames.length}
                    />
                  )}
                </div>

                {viewMode === 'table' ? (
                  <div className="mx-auto mt-6 w-11/12">
                    {selectedTeam === -1 ? (
                      <div className="mt-8 text-3xl font-bold">
                        Select a team to view the table
                      </div>
                    ) : isEmpty(filteredGames) ? (
                      <div className="mt-8 text-3xl font-bold">
                        No games found
                      </div>
                    ) : (
                      <ScheduleTable
                        league={league}
                        data={filteredGames}
                        teams={teamList}
                        selectedTeamId={selectedTeam}
                      />
                    )}
                  </div>
                ) : (
                  <div className="mx-auto mb-10 flex w-11/12 flex-wrap justify-evenly">
                    {isEmpty(gamesByDate) && (
                      <div className="mt-8 text-3xl font-bold">
                        No games found
                      </div>
                    )}
                    {Object.entries(gamesByDate)
                      // NOTE: this is necessary since date parser on mobile requires the dates to follow ISO 8601 (ex. "2017-04-16")
                      .sort((a, b) => {
                        const [aYear, aMonth, aDate] = a[0]
                          .split('-')
                          .map((datePart) => parseInt(datePart));
                        const [bYear, bMonth, bDate] = b[0]
                          .split('-')
                          .map((datePart) => parseInt(datePart));

                        return (
                          new Date(aYear, aMonth - 1, aDate).getTime() -
                          new Date(bYear, bMonth - 1, bDate).getTime()
                        );
                      })
                      .map(([date, games]) => (
                        <ScheduleDay
                          key={date}
                          league={league}
                          date={date}
                          games={games}
                          teamData={teamList}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const queryClient = new QueryClient();
  const { season, league } = query;

  const parsedSeason = parseInt(season as string);

  await queryClient.prefetchQuery({
    queryKey: ['teams', league, parsedSeason],
    queryFn: () => getTeamsListData(league as League, parsedSeason),
  });

  return {
    props: {
      league,
      dehydratedState: dehydrate(queryClient),
    },
  };
};
