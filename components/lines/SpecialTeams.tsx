import { Box, Grid } from '@chakra-ui/react';
import { TeamInfo } from 'pages/api/v1/teams';
import {
  AnyLine,
  DEFENSE_POSITIONS,
  FORWARD_POSITIONS,
} from 'utils/playerHelpers';

import { LinePlayer } from './LinePlayer';

export const SpecialTeamsLines = ({
  situationType,
  group,
  teamColors,
}: {
  situationType: string;
  group: Record<string, AnyLine>;
  teamColors: TeamInfo['colors'];
}) => (
  <div className="mb-5">
    <div className="mb-4 border-b border-b-grey200 pb-3 text-center text-2xl font-bold">
      {situationType.replace('on', ' on ')}
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Object.values(group).map((unit, i) => (
        <SpecialTeamsUnit
          key={i}
          unitNumber={i + 1}
          line={unit}
          teamColors={teamColors}
        />
      ))}
    </div>
  </div>
);

export const SpecialTeamsUnit = ({
  unitNumber,
  line,
  teamColors,
}: {
  unitNumber: number;
  line: AnyLine;
  teamColors: TeamInfo['colors'];
}) => {
  const fwds = FORWARD_POSITIONS.filter((p) => line[p]);
  const defs = DEFENSE_POSITIONS.filter((p) => line[p]);

  if (!fwds.length && !defs.length) return null;

  return (
    <Box rounded="lg" p={4}>
      <div className="mb-2 text-center text-sm font-bold">
        Unit {unitNumber}
      </div>
      {fwds.length > 0 && (
        <Grid templateColumns={`repeat(${fwds.length}, 1fr)`} gap={1} py={3}>
          {fwds.map((pos) => (
            <LinePlayer
              key={pos}
              player={line[pos]}
              className="justify-center"
              teamColors={teamColors}
            />
          ))}
        </Grid>
      )}
      {defs.length > 0 && (
        <Grid
          templateColumns={`repeat(${defs.length}, 1fr)`}
          gap={2}
          width={fwds.length === 3 ? `${(defs.length / 3) * 100}%` : '100%'}
          mx={fwds.length === 3 ? 'auto' : undefined}
        >
          {defs.map((pos) => (
            <LinePlayer
              key={pos}
              player={line[pos]}
              className="justify-center"
              teamColors={teamColors}
            />
          ))}
        </Grid>
      )}
    </Box>
  );
};
