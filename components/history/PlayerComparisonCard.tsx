import { Spinner } from '@chakra-ui/react';
import { useMemo } from 'react';
import {
  PlayerWithAdvancedStats,
  Goalie,
  PlayerHistory,
  GoalieHistory,
} from 'typings/api';
import { InternalPlayerAchievement } from 'typings/portal-api';

import { AwardsComparison } from './AwardComparison';
import { CareerStatsComparison } from './CareerStatComparison';
import { PlayerStatsComparison } from './PlayerStatComparison';

interface PlayerComparisonData {
  playerId: number | null;
  playerName: string | null;
  selectedSeason: number | null;
}

interface PlayerData {
  availableSeasons: number[];
  careerStats: PlayerHistory[] | GoalieHistory[] | undefined;
  seasonStats: PlayerWithAdvancedStats[] | Goalie[] | null;
  awards: InternalPlayerAchievement[] | undefined;
  isLoading: boolean;
}

interface PlayerComparisonCardProps {
  players: PlayerComparisonData[];
  playersData: PlayerData[];
  isGoalie: boolean;
}

export function PlayerComparisonCard({
  players,
  playersData,
  isGoalie,
}: PlayerComparisonCardProps) {
  const isLoading = playersData.some((p) => p.isLoading);

  const bothPlayersSelected = useMemo(() => {
    return players[0].playerName && players[1].playerName;
  }, [players]);

  const { player1Seasons, player2Seasons } = useMemo(() => {
    const p1 = playersData[0]?.availableSeasons ?? [];
    const p2 = playersData[1]?.availableSeasons ?? [];

    return {
      player1Seasons: {
        min: Math.min(...p1),
        max: Math.max(...p1),
      },
      player2Seasons: {
        min: Math.min(...p2),
        max: Math.max(...p2),
      },
    };
  }, [playersData]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              {bothPlayersSelected &&
                players[0].selectedSeason &&
                players[1].selectedSeason && (
                  <div className="rounded border border-primary p-4 text-center">
                    <h3 className="mb-4 text-center text-lg font-bold">
                      Season {players[0].selectedSeason} vs Season{' '}
                      {players[1].selectedSeason}
                    </h3>
                    <PlayerStatsComparison
                      players={[
                        {
                          name: players[0].playerName!,
                          stats: playersData[0].seasonStats,
                        },
                        {
                          name: players[1].playerName!,
                          stats: playersData[1].seasonStats,
                        },
                      ]}
                      isGoalie={isGoalie}
                      showAdvancedStats={!isGoalie}
                    />
                  </div>
                )}
            </div>
            <div>
              {bothPlayersSelected &&
                playersData[0].careerStats &&
                playersData[1].careerStats &&
                playersData[0].careerStats.length > 0 &&
                playersData[1].careerStats.length > 0 && (
                  <CareerStatsComparison
                    players={[
                      {
                        name: players[0].playerName!,
                        career: playersData[0].careerStats[0],
                        seasons: player1Seasons,
                      },
                      {
                        name: players[1].playerName!,
                        career: playersData[1].careerStats[0],
                        seasons: player2Seasons,
                      },
                    ]}
                    isGoalie={isGoalie}
                  />
                )}
            </div>

            <div>
              {bothPlayersSelected && (
                <AwardsComparison
                  players={[
                    {
                      name: players[0].playerName!,
                      awards: playersData[0].awards,
                    },
                    {
                      name: players[1].playerName!,
                      awards: playersData[1].awards,
                    },
                  ]}
                />
              )}
            </div>
          </div>

          {!bothPlayersSelected && (
            <div className="rounded border border-primary p-8 text-center">
              <p className="text-grey600">
                Select two players to compare their stats
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
