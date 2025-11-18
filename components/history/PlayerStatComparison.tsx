import { PlayerWithAdvancedStats, Goalie } from 'typings/api';
import { STAT_CONFIGS } from 'utils/comparisonHelpers';

import { ComparisonTable } from './ComparisonTable';

interface PlayerStatsComparisonProps {
  players: Array<{
    name: string;
    stats: PlayerWithAdvancedStats[] | Goalie[] | null;
  }>;
  showAdvancedStats?: boolean;
  isGoalie?: boolean;
}

export function PlayerStatsComparison({
  players,
  showAdvancedStats = false,
  isGoalie = false,
}: PlayerStatsComparisonProps) {
  if (players.some((p) => !p?.stats || p.stats.length === 0)) {
    return (
      <div className="text-sm text-primary">
        No stats available for comparison
      </div>
    );
  }

  const basicStats = isGoalie ? STAT_CONFIGS.goalie : STAT_CONFIGS.skater;

  return (
    <div className="w-full space-y-4">
      <ComparisonTable
        players={players.map((p) => ({ name: p.name, data: p.stats![0] }))}
        stats={basicStats}
      />

      {showAdvancedStats && !isGoalie && (
        <>
          <h4 className="text-center text-sm font-semibold">Advanced Stats</h4>
          <ComparisonTable
            players={players.map((p) => ({ name: p.name, data: p.stats![0] }))}
            stats={STAT_CONFIGS.advanced}
            getValueFn={(data, key) => data.advancedStats?.[key]}
          />
        </>
      )}
    </div>
  );
}
