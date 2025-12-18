import { useMemo } from 'react';

import { Select } from './common/Select';

const POSITION_OPTIONS = [
  'skaters',
  'forward',
  'defenseman',
  'goalie',
] as const;
export type PositionTypeOption = (typeof POSITION_OPTIONS)[number];

export const PositionTypeSelector = ({
  selected,
  onChange,
  className,
}: {
  selected: PositionTypeOption;
  onChange: (pos: PositionTypeOption) => void;
  className?: string;
}) => {
  const optionsMap = useMemo(
    () =>
      new Map<PositionTypeOption, string>([
        ['skaters', 'Skaters'],
        ['forward', 'Forward'],
        ['defenseman', 'Defense'],
        ['goalie', 'Goalie'],
      ]),
    [],
  );

  return (
    <Select<PositionTypeOption>
      options={POSITION_OPTIONS}
      selectedOption={selected}
      onSelection={onChange}
      optionsMap={optionsMap}
      className={className}
    />
  );
};
