import { FormLabel, Radio, RadioGroup, Spinner, Stack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Footer } from 'components/Footer';
import { HistoryHeader } from 'components/history/historyHeader';
import { PlayerComparisonCard } from 'components/history/PlayerComparisonCard';
import { PlayerSearchInput } from 'components/history/SelectPlayerSearch';
import { LeagueRadios } from 'components/LeagueRadios';
import { SeasonTypeRadios } from 'components/SeasonTypeRadios';
import { useComparisonFilters } from 'hooks/useComparisonFilters';
import { usePlayerComparison } from 'hooks/usePlayerComparison';
import { NextSeo } from 'next-seo';
import { PlayerNames } from 'pages/api/v2/player/playerSearch';
import { useCallback, useEffect, useState } from 'react';
import { leagueNameToId } from 'utils/leagueHelpers';
import { query } from 'utils/query';
import { seasonTypeToTextFriendly } from 'utils/seasonTypeHelpers';

interface PlayerComparisonData {
  playerId: number | null;
  playerName: string | null;
  selectedSeason: number | null;
}

export default function PlayerComparisonPage() {
  const { filters, updateFilters, isInitialized } = useComparisonFilters();
  const [players, setPlayers] = useState<PlayerComparisonData[]>([
    { playerId: null, playerName: null, selectedSeason: null },
    { playerId: null, playerName: null, selectedSeason: null },
  ]);

  const { data: playerSearch } = useQuery<PlayerNames[]>({
    queryKey: ['skaterScoring', filters.league, filters.isGoalie],
    queryFn: () => {
      const goalieParam = filters.isGoalie
        ? '&isGoalie=true'
        : '&isGoalie=false';
      return query(
        `api/v2/player/playerSearch?league=${leagueNameToId(
          filters.league,
        )}${goalieParam}`,
      );
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isInitialized || !playerSearch) return;

    setPlayers(() => [
      {
        playerId: filters.player1,
        playerName:
          playerSearch?.find((p) => p.PlayerID === filters.player1)?.Name ||
          null,
        selectedSeason: null,
      },
      {
        playerId: filters.player2,
        playerName:
          playerSearch?.find((p) => p.PlayerID === filters.player2)?.Name ||
          null,
        selectedSeason: null,
      },
    ]);
  }, [isInitialized, filters, playerSearch]);

  const clearPlayerSelections = useCallback(() => {
    setPlayers([
      { playerId: null, playerName: null, selectedSeason: null },
      { playerId: null, playerName: null, selectedSeason: null },
    ]);
  }, []);

  const player1Data = usePlayerComparison({
    playerId: players[0].playerId,
    league: filters.league,
    seasonType: filters.leagueType,
    isGoalie: filters.isGoalie,
    selectedSeason: players[0].selectedSeason,
  });

  const player2Data = usePlayerComparison({
    playerId: players[1].playerId,
    league: filters.league,
    seasonType: filters.leagueType,
    isGoalie: filters.isGoalie,
    selectedSeason: players[1].selectedSeason,
  });

  const playersData = [player1Data, player2Data];

  const updatePlayer = useCallback(
    (index: number, updates: Partial<PlayerComparisonData>) => {
      setPlayers((prev) => {
        const newPlayers = [...prev];
        newPlayers[index] = { ...newPlayers[index], ...updates };
        return newPlayers;
      });
    },
    [],
  );

  const isLoading = !isInitialized || !playerSearch;

  return (
    <>
      <NextSeo
        title="Player Comparisons"
        openGraph={{
          title: 'Player Comparisons',
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
            <h1 className="mb-6 mt-8 text-2xl font-bold">Player Comparisons</h1>
            <div className="rounded border border-primary px-4 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-6">
                <div className="flex-1">
                  <LeagueRadios
                    value={filters.league as 'shl' | 'smjhl' | 'iihf' | 'wjc'}
                    onChange={(value) => {
                      updateFilters({
                        league: value,
                        player1: null,
                        player2: null,
                      });
                      clearPlayerSelections();
                    }}
                  />
                </div>

                <div className="flex-1">
                  <FormLabel>Player Type</FormLabel>
                  <RadioGroup
                    onChange={(val) => {
                      const isGoalie = val === 'goalie';
                      updateFilters({
                        isGoalie,
                        player1: null,
                        player2: null,
                      });
                      clearPlayerSelections();
                    }}
                    value={filters.isGoalie ? 'goalie' : 'player'}
                  >
                    <Stack direction="row" spacing={5}>
                      <Radio value="player">
                        <span className="text-sm">Skater</span>
                      </Radio>
                      <Radio value="goalie">
                        <span className="text-sm">Goalie</span>
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </div>

                <div className="flex-1">
                  <SeasonTypeRadios
                    value={filters.leagueType}
                    onChange={(value) => updateFilters({ leagueType: value })}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {players.map((player, index) => (
                  <PlayerSearchInput
                    key={index}
                    players={playerSearch}
                    label={`Player ${index + 1}`}
                    value={player.playerId}
                    onChange={(playerId, playerName) => {
                      updateFilters({
                        [`player${index + 1}`]: playerId,
                      } as any);
                      updatePlayer(index, { playerId, playerName });
                    }}
                    availableSeasons={playersData[index].availableSeasons}
                    selectedSeason={player.selectedSeason}
                    onSeasonChange={(season) =>
                      updatePlayer(index, { selectedSeason: season })
                    }
                  />
                ))}
              </div>
            </div>

            {(filters.player1 || filters.player2) && (
              <div className="mt-6">
                <h2 className="mb-4 text-center text-2xl font-bold">
                  {seasonTypeToTextFriendly(filters.leagueType)} Comparison
                  Results
                </h2>
                <PlayerComparisonCard
                  players={players}
                  playersData={playersData}
                  isGoalie={filters.isGoalie}
                />
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
