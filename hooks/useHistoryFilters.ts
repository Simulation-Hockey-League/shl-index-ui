import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { League, leagueNameToId } from 'utils/leagueHelpers';
import { query } from 'utils/query';

import { SeasonTypeOption } from './useSeasonType';

interface BaseFilters {
  league: League;
  startSeason: number;
  endSeason: number;
  franchiseID: number;
  grouped: boolean;
}
export interface PlayerFilters extends BaseFilters {
  leagueType: SeasonTypeOption;
  position: string;
  minGP: number;
  active: boolean;
}
export interface TeamFilters extends BaseFilters {}

const defaultPlayerFilters: PlayerFilters = {
  league: 'shl',
  leagueType: 'regular',
  position: 'skaters',
  startSeason: 1,
  endSeason: 85,
  franchiseID: -1,
  minGP: 0,
  grouped: true,
  active: false,
};

const defaultTeamFilters: TeamFilters = {
  league: 'shl',
  startSeason: 1,
  endSeason: 85,
  franchiseID: -1,
  grouped: true,
};

export function useHistoryFilters(
  type: 'player',
  customDefaults?: Partial<PlayerFilters>,
): {
  filters: PlayerFilters;
  updateFilters: (updates: Partial<PlayerFilters>) => void;
  isInitialized: boolean;
};

export function useHistoryFilters(
  type: 'team',
  customDefaults?: Partial<TeamFilters>,
): {
  filters: TeamFilters;
  updateFilters: (updates: Partial<TeamFilters>) => void;
  isInitialized: boolean;
};

export function useHistoryFilters(
  type: 'player' | 'team',
  customDefaults?: Partial<PlayerFilters | TeamFilters>,
) {
  const router = useRouter();

  const baseDefaults =
    type === 'player' ? defaultPlayerFilters : defaultTeamFilters;

  const currentLeague = useMemo(() => {
    if (router.isReady && router.query.league) {
      return router.query.league as League;
    }
    return customDefaults?.league || 'shl';
  }, [router.isReady, router.query.league, customDefaults?.league]);

  const { data: seasonsData } = useQuery<Array<{ season: string }>, Error>({
    queryKey: ['seasons', currentLeague],
    queryFn: () =>
      query(`api/v1/leagues/seasons?league=${leagueNameToId(currentLeague)}`),
  });

  const maxSeason = useMemo(
    () =>
      seasonsData ? Math.max(...seasonsData.map((s) => parseInt(s.season))) : 1,
    [seasonsData],
  );

  const defaults = useMemo(
    () => ({
      ...baseDefaults,
      league: currentLeague,
      startSeason: maxSeason,
      endSeason: maxSeason,
      ...customDefaults,
    }),
    [maxSeason, customDefaults, currentLeague, baseDefaults],
  );

  const [filters, setFiltersState] = useState<PlayerFilters | TeamFilters>(
    defaults,
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!router.isReady || isInitialized || !seasonsData) return;

    const hasAnyQueryParams = Object.keys(router.query).length > 0;

    const baseUrlFilters = {
      league: (router.query.league as League) || defaults.league,
      startSeason: router.query.startSeason
        ? Number(router.query.startSeason)
        : defaults.startSeason,
      endSeason: router.query.endSeason
        ? Number(router.query.endSeason)
        : defaults.endSeason,
      franchiseID: router.query.teamID
        ? Number(router.query.teamID)
        : defaults.franchiseID,
      grouped:
        router.query.grouped !== undefined
          ? router.query.grouped === 'true'
          : defaults.grouped,
    };

    const finalUrlFilters: PlayerFilters | TeamFilters =
      type === 'player'
        ? {
            ...baseUrlFilters,
            leagueType:
              (router.query.type as SeasonTypeOption) ||
              (defaults as PlayerFilters).leagueType,
            position:
              (router.query.position as string) ||
              (defaults as PlayerFilters).position,
            minGP: router.query.minGP
              ? Number(router.query.minGP)
              : (defaults as PlayerFilters).minGP,
            active:
              router.query.active !== undefined
                ? router.query.active === 'true'
                : (defaults as PlayerFilters).active,
          }
        : baseUrlFilters;

    setFiltersState(finalUrlFilters);
    setIsInitialized(true);

    if (!hasAnyQueryParams) {
      const query: Record<string, string> = {
        league: String(finalUrlFilters.league),
        startSeason: String(finalUrlFilters.startSeason),
        endSeason: String(finalUrlFilters.endSeason),
        grouped: String(finalUrlFilters.grouped),
      };

      if (type === 'player') {
        const playerFilters = finalUrlFilters as PlayerFilters;
        query.type = playerFilters.leagueType;
        query.position = playerFilters.position;
        query.active = String(playerFilters.active);
        if (playerFilters.minGP > 0) {
          query.minGP = String(playerFilters.minGP);
        }
      }

      if (finalUrlFilters.franchiseID >= 0) {
        query.teamID = String(finalUrlFilters.franchiseID);
      }

      router.replace(
        {
          pathname: router.pathname,
          query,
        },
        undefined,
        { shallow: true },
      );
    }
  }, [router.isReady, isInitialized, seasonsData, router, defaults, type]);

  const updateFilters = useCallback(
    (updates: Partial<PlayerFilters | TeamFilters>) => {
      const newFilters = { ...filters, ...updates };
      setFiltersState(newFilters);

      const query: Record<string, string> = {
        league: newFilters.league,
        startSeason: String(newFilters.startSeason),
        endSeason: String(newFilters.endSeason),
        grouped: String(newFilters.grouped),
      };

      if (type === 'player') {
        const playerFilters = newFilters as PlayerFilters;
        query.type = playerFilters.leagueType;
        query.position = playerFilters.position;
        if (playerFilters.minGP > 0) {
          query.minGP = String(playerFilters.minGP);
        }
        query.active = String(playerFilters.active);
      }

      if (newFilters.franchiseID >= 0) {
        query.teamID = String(newFilters.franchiseID);
      }

      router.replace(
        {
          pathname: router.pathname,
          query,
        },
        undefined,
        { shallow: true },
      );
    },
    [filters, router, type],
  );

  return {
    filters,
    updateFilters,
    isInitialized: isInitialized && !!seasonsData,
  };
}
