import { PlayerHistory, GoalieHistory } from 'typings/api';
import { CAREER_STAT_CONFIGS } from 'utils/comparisonHelpers';

import { ComparisonTable } from './ComparisonTable';

interface CareerStatsComparisonProps {
  players: Array<{
    name: string;
    career: PlayerHistory | GoalieHistory;
    seasons: { min: number; max: number };
  }>;
  isGoalie?: boolean;
}

export function CareerStatsComparison({
  players,
  isGoalie = false,
}: CareerStatsComparisonProps) {
  if (players.some((p) => !p?.career)) {
    return (
      <div className="text-primary">
        No career stats available for comparison
      </div>
    );
  }

  return (
    <div className="w-full rounded border border-primary p-4">
      <h3 className="mb-3 text-center text-lg font-bold">Career Stats</h3>
      <ComparisonTable
        players={players.map((p) => ({ name: p.name, data: p.career }))}
        stats={
          isGoalie ? CAREER_STAT_CONFIGS.goalie : CAREER_STAT_CONFIGS.skater
        }
      />
    </div>
  );
}
