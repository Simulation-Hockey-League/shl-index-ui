import { FormLabel } from '@chakra-ui/react';
import { Select } from 'components/common/Select';
import { useMemo } from 'react';

interface SeasonRangeSelectorProps {
  seasonsList: number[];
  startSeason: number;
  endSeason: number;
  onStartSeasonChange: (season: number) => void;
  onEndSeasonChange: (season: number) => void;
}

export const SeasonRangeSelector = ({
  seasonsList,
  startSeason,
  endSeason,
  onStartSeasonChange,
  onEndSeasonChange,
}: SeasonRangeSelectorProps) => {
  const sortedSeasons = useMemo(
    () => [...seasonsList].sort((a, b) => b - a),
    [seasonsList],
  );

  const startSeasonOptions = useMemo(
    () => sortedSeasons.filter((season) => season <= endSeason),
    [sortedSeasons, endSeason],
  );

  const endSeasonOptions = useMemo(
    () => sortedSeasons.filter((season) => season >= startSeason),
    [sortedSeasons, startSeason],
  );

  return (
    <div className="flex flex-col gap-2">
      <FormLabel className="mb-0">Season Range</FormLabel>
      <div className="flex items-center gap-2">
        <Select<number>
          options={startSeasonOptions}
          selectedOption={startSeason}
          onSelection={onStartSeasonChange}
        />
        <span className="text-xs">to</span>
        <Select<number>
          options={endSeasonOptions}
          selectedOption={endSeason}
          onSelection={onEndSeasonChange}
        />
      </div>
    </div>
  );
};
