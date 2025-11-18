import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  PlayerWithAdvancedStats,
  Goalie,
  PlayerHistory,
  GoalieHistory,
} from 'typings/api';
import { InternalPlayerAchievement } from 'typings/portal-api';
import { League, leagueNameToId } from 'utils/leagueHelpers';
import { query, portalQuery } from 'utils/query';

import { SeasonTypeOption } from './useSeasonType';

interface UsePlayerComparisonProps {
  playerId: number | null;
  league: League;
  seasonType: SeasonTypeOption;
  isGoalie: boolean;
  selectedSeason?: number | null;
}

export function usePlayerComparison({
  playerId,
  league,
  seasonType,
  isGoalie,
  selectedSeason,
}: UsePlayerComparisonProps) {
  const endpoint = isGoalie ? 'goalies' : 'players';
  const seasonTypeParam = `&type=${seasonType}`;

  const { data: awards } = useQuery<InternalPlayerAchievement[]>({
    queryKey: ['playerAwards', league, playerId],
    queryFn: () =>
      portalQuery(
        `api/v1/history/player?leagueID=${leagueNameToId(
          league,
        )}&fhmID=${playerId}`,
      ),
    enabled: !!playerId,
    refetchOnWindowFocus: false,
  });

  const { data: careerStats } = useQuery<PlayerHistory[] | GoalieHistory[]>({
    queryKey: [
      'playerCareerStats',
      league,
      playerId,
      seasonType,
      isGoalie,
      endpoint,
      seasonTypeParam,
    ],
    queryFn: () =>
      query(
        `api/v1/${endpoint}/stats/allTime?league=${leagueNameToId(
          league,
        )}&playerID=${playerId}${seasonTypeParam}`,
      ),
    enabled: !!playerId,
    refetchOnWindowFocus: false,
  });

  const { data: allSeasonStats } = useQuery<
    PlayerWithAdvancedStats[] | Goalie[]
  >({
    queryKey: [
      'playerSeasonStats',
      league,
      playerId,
      seasonType,
      isGoalie,
      endpoint,
      seasonTypeParam,
    ],
    queryFn: () =>
      query(
        `api/v1/${endpoint}/stats/${playerId}?league=${leagueNameToId(
          league,
        )}${seasonTypeParam}`,
      ),
    enabled: !!playerId,
    refetchOnWindowFocus: false,
  });

  const availableSeasons = useMemo(() => {
    if (!allSeasonStats) return [];
    return Array.from(new Set(allSeasonStats.map((stat) => stat.season))).sort(
      (a, b) => b - a,
    );
  }, [allSeasonStats]);

  const seasonStats = useMemo(() => {
    if (!selectedSeason || !allSeasonStats) return null;

    const filtered = allSeasonStats.filter(
      (stat) => stat.season === selectedSeason,
    );

    return isGoalie
      ? (filtered as Goalie[])
      : (filtered as PlayerWithAdvancedStats[]);
  }, [selectedSeason, allSeasonStats, isGoalie]);

  return {
    awards,
    careerStats,
    seasonStats,
    availableSeasons,
    isLoading: !careerStats && !!playerId,
  };
}
