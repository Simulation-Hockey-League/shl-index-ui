import { FormLabel, Spinner, Tooltip } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Footer } from 'components/Footer';
import { HistoryHeader } from 'components/history/HistoryHeader';
import { LeagueRadios } from 'components/LeagueRadios';
import {
  PositionTypeOption,
  PositionTypeSelector,
} from 'components/PositionTypeSelector';
import { SeasonRangeSelector } from 'components/SeasonRangeSelector';
import { SeasonTypeRadios } from 'components/SeasonTypeRadios';
import { GoalieHistoryTable } from 'components/tables/history/GoalieHistoryTable';
import { SkaterHistoryTable } from 'components/tables/history/SkaterHistoryTable';
import { TeamSelector } from 'components/TeamSelector';
import { useHistoryFilters } from 'hooks/useHistoryFilters';
import { useSeason } from 'hooks/useSeason';
import { useTeam } from 'hooks/useTeam';
import debounce from 'lodash/debounce';
import { NextSeo } from 'next-seo';
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { GoalieHistory } from 'typings/api';
import { PlayerHistory } from 'typings/api';
import { leagueNameToId } from 'utils/leagueHelpers';
import { query } from 'utils/query';

export default function PlayersPage() {
  const { filters, updateFilters, isInitialized } = useHistoryFilters('player');

  const { seasonsList } = useSeason();

  const { teamData, teamLoading } = useTeam(leagueNameToId(filters.league));

  const [minGPInput, setMinGPInput] = useState(filters.minGP);

  const debouncedUpdateMinGP = useMemo(
    () =>
      debounce((value: number) => {
        updateFilters({ minGP: value });
      }, 500),
    [updateFilters],
  );

  useEffect(() => {
    setMinGPInput(filters.minGP);
  }, [filters.minGP]);

  useEffect(() => {
    return () => {
      debouncedUpdateMinGP.cancel();
    };
  }, [debouncedUpdateMinGP]);

  const handleMinGPChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setMinGPInput(value);
      debouncedUpdateMinGP(value);
    },
    [debouncedUpdateMinGP],
  );

  const isGoalie = useMemo(() => {
    return filters.position === 'goalie';
  }, [filters.position]);

  const { data: skaterHistory } = useQuery<PlayerHistory[] | GoalieHistory[]>({
    queryKey: [
      'skatersAllTime',
      leagueNameToId(filters.league),
      filters.leagueType,
      filters.position,
      filters.startSeason,
      filters.endSeason,
      filters.franchiseID,
      filters.minGP,
      filters.grouped,
      ,
      isGoalie,
      filters.active,
      filters.rookie,
    ],
    queryFn: () => {
      const positionParam =
        filters.position && filters.position !== 'skaters'
          ? `&position=${filters.position}`
          : '';
      const startSeasonParam = filters.startSeason
        ? `&startSeason=${filters.startSeason}`
        : '';
      const endSeasonParam = filters.endSeason
        ? `&endSeason=${filters.endSeason}`
        : '';
      const minGPParam = filters.minGP ? `&minGP=${filters.minGP}` : '';
      const franchiseIDParam =
        filters.franchiseID >= 0 ? `&teamID=${filters.franchiseID}` : '';
      const groupedParam = filters.grouped ? '&grouped=true' : '&grouped=false';
      const seasonTypeParam = filters.leagueType
        ? `&type=${filters.leagueType}`
        : '';
      const activeParam = filters.active ? '&active=true' : '&active=false';
      const rookieParam = filters.rookie ? '&rookie=true' : '&rookie=false';
      const skaterParam = isGoalie ? 'goalies' : 'players';
      return query(
        `api/v1/${skaterParam}/stats/allTime?league=${leagueNameToId(
          filters.league,
        )}${positionParam}${seasonTypeParam}${startSeasonParam}${endSeasonParam}${minGPParam}${franchiseIDParam}${groupedParam}${activeParam}${rookieParam}`,
      );
    },
    enabled: isInitialized,
    refetchOnWindowFocus: false,
  });

  const isLoading = !isInitialized || !skaterHistory;

  return (
    <>
      <NextSeo
        title="Player History"
        openGraph={{
          title: 'Players History',
        }}
      />
      <HistoryHeader />
      <div className="mx-auto w-full bg-primary p-[2.5%] lg:w-3/4 lg:pb-10 lg:pt-px">
        {isLoading ? (
          <div className="flex size-full items-center justify-center">
            <Spinner size="xl" />
          </div>
        ) : (
          <>
            <h1 className="mb-6 mt-8 text-2xl font-bold">Player History</h1>
            <div className="rounded border border-primary px-4 py-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-2 lg:grid-cols-4">
                <LeagueRadios
                  value={filters.league as 'shl' | 'smjhl' | 'iihf' | 'wjc'}
                  onChange={(value) => updateFilters({ league: value })}
                />
                <div className="md:col-span-2 lg:col-span-1">
                  <SeasonTypeRadios
                    value={filters.leagueType}
                    onChange={(value) => updateFilters({ leagueType: value })}
                  />
                </div>
                <div className="col-span-1 md:col-span-1 lg:col-span-1">
                  <FormLabel>Position</FormLabel>
                  <PositionTypeSelector
                    selected={filters.position as PositionTypeOption}
                    onChange={(value) => updateFilters({ position: value })}
                  />
                </div>
                <div className="col-span-2 md:col-span-1 lg:col-span-1">
                  <FormLabel>Team</FormLabel>
                  {!teamLoading && (
                    <TeamSelector
                      selected={filters.franchiseID}
                      onChange={(value) =>
                        updateFilters({ franchiseID: value })
                      }
                      teamData={teamData}
                    />
                  )}
                </div>
                <div className="col-span-2 md:col-span-2 lg:col-span-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-6">
                    <SeasonRangeSelector
                      seasonsList={seasonsList}
                      startSeason={filters.startSeason}
                      endSeason={filters.endSeason}
                      onStartSeasonChange={(season) =>
                        updateFilters({ startSeason: season })
                      }
                      onEndSeasonChange={(season) =>
                        updateFilters({ endSeason: season })
                      }
                    />

                    <div className="flex flex-col gap-2">
                      <FormLabel className="mb-0">Filters</FormLabel>
                      <div className="flex flex-row items-center gap-3">
                        <Tooltip
                          label="Disabled when you have rookies selected"
                          isDisabled={!filters.rookie}
                        >
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={filters.grouped}
                              disabled={filters.rookie}
                              onChange={(e) =>
                                updateFilters({ grouped: e.target.checked })
                              }
                              className="size-4 rounded border-primary disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <span className="text-xs font-medium">
                              Sum Results
                            </span>
                          </label>
                        </Tooltip>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.active}
                            onChange={(e) =>
                              updateFilters({ active: e.target.checked })
                            }
                            className="size-4 rounded border-primary"
                          />
                          <span className="text-xs font-medium">
                            Still Active?
                          </span>
                        </label>
                        <Tooltip
                          label="Disabled when you have sum selected"
                          isDisabled={!filters.grouped}
                        >
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={filters.rookie}
                              disabled={filters.grouped}
                              onChange={(e) =>
                                updateFilters({ rookie: e.target.checked })
                              }
                              className="size-4 rounded border-primary disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <span className="text-xs font-medium">
                              Rookie Season
                            </span>
                          </label>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <FormLabel>Min GP</FormLabel>
                  <input
                    type="number"
                    min="0"
                    value={minGPInput}
                    onChange={handleMinGPChange}
                    className="h-8 w-full rounded border border-primary bg-primary px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>
            {isGoalie ? (
              <GoalieHistoryTable
                stats={(skaterHistory as GoalieHistory[]) || []}
                league={leagueNameToId(filters.league)}
              />
            ) : (
              <SkaterHistoryTable
                stats={(skaterHistory as PlayerHistory[]) || []}
                league={leagueNameToId(filters.league)}
              />
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
