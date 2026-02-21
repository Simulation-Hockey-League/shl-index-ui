import { FormLabel, Spinner } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Footer } from 'components/Footer';
import { HistoryHeader } from 'components/history/HistoryHeader';
import { LeagueRadios } from 'components/LeagueRadios';
import { ReportSelector } from 'components/ReportSelector';
import { SeasonRangeSelector } from 'components/SeasonRangeSelector';
import { TeamHistoryTable } from 'components/tables/history/TeamHistoryTable';
import { TeamSelector } from 'components/TeamSelector';
import { useHistoryFilters } from 'hooks/useHistoryFilters';
import { useSeason } from 'hooks/useSeason';
import { useTeam } from 'hooks/useTeam';
import { NextSeo } from 'next-seo';
import { TeamHistory } from 'typings/api';
import { leagueNameToId } from 'utils/leagueHelpers';
import { query } from 'utils/query';
import { selectTeamReport, TEAM_REPORT_LABELS } from 'utils/reportHelpers';

export default function TeamsPage() {
  const { filters, updateFilters, isInitialized } = useHistoryFilters('team');

  const { seasonsList } = useSeason();

  const { teamData, teamLoading } = useTeam(leagueNameToId(filters.league));

  const { data: teamHistory } = useQuery<TeamHistory[]>({
    queryKey: [
      'teamsAllTime',
      leagueNameToId(filters.league),
      filters.startSeason,
      filters.endSeason,
      filters.franchiseID,
      filters.grouped,
    ],
    queryFn: () => {
      const startSeasonParam = filters.startSeason
        ? `&startSeason=${filters.startSeason}`
        : '';
      const endSeasonParam = filters.endSeason
        ? `&endSeason=${filters.endSeason}`
        : '';
      const teamIDParam =
        filters.franchiseID >= 0 ? `&teamID=${filters.franchiseID}` : '';
      const groupedParam = filters.grouped ? `&grouped=true` : '&grouped=false';

      return query(
        `api/v1/teams/allTime?league=${leagueNameToId(
          filters.league,
        )}${startSeasonParam}${endSeasonParam}${teamIDParam}${groupedParam}`,
      );
    },
    enabled: isInitialized,
    refetchOnWindowFocus: false,
  });

  const isLoading = !isInitialized || !teamHistory;

  return (
    <>
      <NextSeo
        title="Team History"
        openGraph={{
          title: 'Team History',
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
            <h1 className="mb-6 mt-8 text-2xl font-bold">Team History</h1>
            <div className="rounded border border-primary px-4 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-6">
                <LeagueRadios
                  value={filters.league as 'shl' | 'smjhl' | 'iihf' | 'wjc'}
                  onChange={(value) => updateFilters({ league: value })}
                />
                <div className="flex-1">
                  <ReportSelector<selectTeamReport>
                    options={Array.from(TEAM_REPORT_LABELS.keys())}
                    value={filters.report}
                    onChange={(value) => updateFilters({ report: value })}
                    labels={TEAM_REPORT_LABELS}
                    className="flex-1"
                  />
                </div>
                <div className="flex-1">
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
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.grouped}
                    onChange={(e) =>
                      updateFilters({ grouped: e.target.checked })
                    }
                    className="size-4 rounded border-primary"
                  />
                  <span className="text-xs font-medium">Sum Results</span>
                </label>

                <div className="flex-1">
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
                </div>
              </div>
            </div>
            <TeamHistoryTable
              stats={teamHistory || []}
              league={leagueNameToId(filters.league)}
              grouped={filters.grouped}
              report={filters.report}
            />
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
