import { TeamInfo } from 'pages/api/v2/teams';
import { useMemo } from 'react';

import { Select } from './common/Select';

export const TeamSelector = ({
  selected,
  onChange,
  teamData,
  className,
}: {
  selected: number;
  onChange: (teamID: number) => void;
  teamData?: TeamInfo[];
  className?: string;
}) => {
  const options = useMemo<number[]>(
    () => [-1, ...(teamData ? teamData.map((t) => t.id) : [])],
    [teamData],
  );

  const optionsMap = useMemo(
    () =>
      new Map<number, string>([
        [-1, 'All Teams'] as const,
        ...(teamData
          ? teamData.map((team) => [team.id, team.name] as const)
          : []),
      ]),
    [teamData],
  );

  return (
    <Select<number>
      options={options}
      selectedOption={selected}
      onSelection={onChange}
      optionsMap={optionsMap}
      className={className}
    />
  );
};
