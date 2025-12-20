import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Legend,
} from 'recharts';
import { PlayerHistory, GoalieHistory } from 'typings/api';
import { COMPARISON_CONFIG } from 'utils/comparisonHelpers';
import { calculateTimeOnIceDecimal } from 'utils/playerHelpers';

interface PlayerData {
  availableSeasons: number[];
  careerStats: PlayerHistory[] | GoalieHistory[] | undefined;
  allSeasonStats: any[] | undefined;
  isLoading: boolean;
}

interface PlayerComparisonData {
  playerId: number | null;
  playerName: string | null;
  selectedSeason: number | null;
}

interface ComparisonCareerChartProps {
  players: PlayerComparisonData[];
  playersData: PlayerData[];
  isGoalie: boolean;
}

export const ComparisonCareerChart = ({
  players,
  playersData,
  isGoalie,
}: ComparisonCareerChartProps) => {
  const statOptions = useMemo(() => {
    const base = isGoalie ? COMPARISON_CONFIG.goalie : COMPARISON_CONFIG.skater;

    return base.map((stat) => ({
      value: stat.key,
      label: stat.label,
      cumulative: stat.cumulative ?? true,
      tooltip: stat.tooltip,
    }));
  }, [isGoalie]);

  const [selectedStatOption, setSelectedStatOption] = useState(
    statOptions[0] ?? {
      value: isGoalie ? 'wins' : 'points',
      cumulative: true,
    },
  );

  const bothPlayersSelected = useMemo(() => {
    return players[0].playerName && players[1].playerName;
  }, [players]);

  const chartData = useMemo(() => {
    if (!bothPlayersSelected) return [];

    const p1 = playersData[0]?.allSeasonStats || [];
    const p2 = playersData[1]?.allSeasonStats || [];

    if (!p1.length && !p2.length) return [];

    const normalize = (data: any[], playerNum: number) => {
      if (!data.length) return [];

      const sorted = [...data].sort((a, b) => a.season - b.season);

      let running = 0;

      return sorted.map((season, i) => {
        let val = season[selectedStatOption.value] ?? 0;

        if (selectedStatOption.value === 'timeOnIce') {
          val = parseFloat(
            calculateTimeOnIceDecimal(season.timeOnIce, season.gamesPlayed),
          );
        }

        if (selectedStatOption.cumulative) running += val;

        return {
          careerYear: i + 1,
          actualSeason: season.season,
          [`player${playerNum}Value`]: selectedStatOption.cumulative
            ? running
            : val,
          [`player${playerNum}Name`]: players[playerNum - 1].playerName,
        };
      });
    };

    const p1Data = normalize(p1, 1);
    const p2Data = normalize(p2, 2);

    const maxYears = Math.max(p1Data.length, p2Data.length);

    const merged = [];
    for (let i = 1; i <= maxYears; i++) {
      const d1 = p1Data.find((d) => d.careerYear === i);
      const d2 = p2Data.find((d) => d.careerYear === i);

      merged.push({
        careerYear: i,
        player1Value: d1?.player1Value ?? null,
        player1Season: d1?.actualSeason ?? null,
        player1Name: d1?.player1Name ?? null,
        player2Value: d2?.player2Value ?? null,
        player2Season: d2?.actualSeason ?? null,
        player2Name: d2?.player2Name ?? null,
      });
    }

    return merged;
  }, [playersData, players, selectedStatOption, bothPlayersSelected]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const d = payload[0].payload;

    return (
      <div className="rounded border border-primary bg-primary p-3 shadow-lg">
        <p className="mb-2 font-bold">Career Year {d.careerYear}</p>

        {d.player1Value !== null && (
          <div className="mb-1">
            <p className="font-semibold" style={{ color: '#3b82f6' }}>
              {d.player1Name}
            </p>
            <p className="text-sm">Season {d.player1Season}</p>
            <p className="text-sm">
              {selectedStatOption.label}:{' '}
              {typeof d.player1Value === 'number'
                ? d.player1Value.toFixed(2)
                : d.player1Value}
            </p>
          </div>
        )}

        {d.player2Value !== null && (
          <div>
            <p className="font-semibold" style={{ color: '#10b981' }}>
              {d.player2Name}
            </p>
            <p className="text-sm">Season {d.player2Season}</p>
            <p className="text-sm">
              {selectedStatOption.label}:{' '}
              {typeof d.player2Value === 'number'
                ? d.player2Value.toFixed(2)
                : d.player2Value}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!bothPlayersSelected) {
    return (
      <div className="rounded border border-primary p-8 text-center">
        Select two players to see career progression comparison
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="rounded border border-primary p-8 text-center">
        No career data available for comparison
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">
          Select Stat to Compare
        </label>
        <select
          value={selectedStatOption.value}
          onChange={(e) => {
            const opt = statOptions.find((s) => s.value === e.target.value);
            if (opt) setSelectedStatOption(opt);
          }}
          className="w-full rounded-md border border-primary bg-primary px-3 py-2 md:w-64"
        >
          {statOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.tooltip}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-primary p-4">
        <h3 className="mb-4 text-center text-lg font-bold">
          Career {selectedStatOption?.tooltip}{' '}
          {selectedStatOption.cumulative ? '(Cumulative)' : 'Progression'}
        </h3>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis dataKey="careerYear" />
            <YAxis
              domain={
                selectedStatOption.value === 'savePct'
                  ? [0.75, 1]
                  : ['auto', 'auto']
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />

            <Line
              type="monotone"
              dataKey="player1Value"
              stroke="#3b82f6"
              strokeWidth={2}
              name={players[0].playerName || 'Player 1'}
              connectNulls
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />

            <Line
              type="monotone"
              dataKey="player2Value"
              stroke="#10b981"
              strokeWidth={2}
              name={players[1].playerName || 'Player 2'}
              connectNulls
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <p className="mt-4 text-center text-sm text-grey600">
          {selectedStatOption.cumulative
            ? 'Showing cumulative career totals. Career years are normalized to compare players at the same stage of their career.'
            : 'Showing season-by-season values. Career years are normalized to compare players at the same stage of their career.'}
        </p>
      </div>
    </div>
  );
};
