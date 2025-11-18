import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { League } from 'utils/leagueHelpers';

import { SeasonTypeOption } from './useSeasonType';

interface ComparisonFilters {
  league: League;
  leagueType: SeasonTypeOption;
  isGoalie: boolean;
  player1: number | null;
  player2: number | null;
}

const defaultComparisonFilters: ComparisonFilters = {
  league: 'shl',
  leagueType: 'regular',
  isGoalie: false,
  player1: null,
  player2: null,
};

export function useComparisonFilters(
  customDefaults?: Partial<ComparisonFilters>,
) {
  const router = useRouter();

  const defaults = useMemo(
    () => ({
      ...defaultComparisonFilters,
      ...customDefaults,
    }),
    [customDefaults],
  );

  const [filters, setFilters] = useState<ComparisonFilters>(defaults);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!router.isReady || isInitialized) return;

    const parsed: ComparisonFilters = {
      league: (router.query.league as League) || defaults.league,
      isGoalie: router.query.isGoalie
        ? router.query.isGoalie === 'true'
        : defaults.isGoalie,
      leagueType:
        (router.query.type as SeasonTypeOption) || defaults.leagueType,
      player1: router.query.player1
        ? Number(router.query.player1)
        : defaults.player1,
      player2: router.query.player2
        ? Number(router.query.player2)
        : defaults.player2,
    };

    setFilters(parsed);
    setIsInitialized(true);

    if (Object.keys(router.query).length === 0) {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            league: parsed.league,
            isGoalie: parsed.isGoalie,
            ...(parsed.player1 !== null && { player1: String(parsed.player1) }),
            ...(parsed.player2 !== null && { player2: String(parsed.player2) }),
          },
        },
        undefined,
        { shallow: true },
      );
    }
  }, [
    defaults.league,
    defaults.player1,
    defaults.player2,
    defaults.isGoalie,
    isInitialized,
    router,
    router.isReady,
    router.query,
    defaults.leagueType,
  ]);

  const updateFilters = useCallback(
    (updates: Partial<ComparisonFilters>) => {
      const newFilters = { ...filters, ...updates };
      setFilters(newFilters);

      const query: any = {
        league: newFilters.league,
        isGoalie: newFilters.isGoalie,
        type: newFilters.leagueType,
      };

      if (newFilters.player1 !== null) query.player1 = newFilters.player1;
      if (newFilters.player2 !== null) query.player2 = newFilters.player2;

      router.replace(
        {
          pathname: router.pathname,
          query,
        },
        undefined,
        { shallow: true },
      );
    },
    [filters, router],
  );

  return {
    filters,
    updateFilters,
    isInitialized,
  };
}
