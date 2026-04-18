import { Box, Grid } from '@chakra-ui/react';
import { TeamInfo } from 'pages/api/v1/teams';
import { useMemo } from 'react';
import {
  AnyLine,
  DEFENSE_POSITIONS,
  FORWARD_POSITIONS,
} from 'utils/playerHelpers';

import { LinePlayer } from './LinePlayer';

const PositionGrid = ({
  lineEntries,
  teamColors,
}: {
  lineEntries: AnyLine[];
  teamColors: TeamInfo['colors'];
}) => {
  const activeFwdCols = FORWARD_POSITIONS.filter((p) =>
    lineEntries.some((l) => l[p]),
  );
  const activeDefCols = DEFENSE_POSITIONS.filter((p) =>
    lineEntries.some((l) => l[p]),
  );

  return (
    <div className="flex flex-col gap-6">
      {activeFwdCols.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Grid
            templateColumns={`2.5rem repeat(${activeFwdCols.length}, 1fr)`}
            gap={1}
          >
            <Box />
            {activeFwdCols.map((pos) => (
              <div
                key={pos}
                className="text-center text-xs uppercase tracking-widest"
              >
                {pos}
              </div>
            ))}
          </Grid>
          {lineEntries.map((line, i) => (
            <Grid
              key={i}
              templateColumns={`2.5rem repeat(${activeFwdCols.length}, 1fr)`}
              gap={1}
              alignItems="stretch"
            >
              <div className="text-xs">L{i + 1}</div>
              {activeFwdCols.map((pos) => (
                <Box key={pos}>
                  {line[pos] ? (
                    <LinePlayer
                      player={line[pos]}
                      className="w-full justify-center"
                      teamColors={teamColors}
                    />
                  ) : (
                    <div className="flex w-full items-center justify-center rounded-md border border-dashed border-grey200 py-3 text-xs">
                      —
                    </div>
                  )}
                </Box>
              ))}
            </Grid>
          ))}
        </div>
      )}

      {activeDefCols.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Grid
            templateColumns={`2.5rem repeat(${activeFwdCols.length}, 1fr)`}
            gap={1}
          >
            <Box />
            <Box
              gridColumn={`2 / span ${activeFwdCols.length}`}
              display="flex"
              justifyContent={activeFwdCols.length === 3 ? 'center' : 'start'}
              gap={2}
            >
              {activeDefCols.map((pos) => (
                <div
                  key={pos}
                  className="w-1/3 text-center text-xs font-semibold uppercase"
                >
                  {pos}
                </div>
              ))}
            </Box>
          </Grid>
          {lineEntries.map((line, i) => (
            <Grid
              key={i}
              templateColumns={`2.5rem repeat(${activeFwdCols.length}, 1fr)`}
              gap={1}
              alignItems="stretch"
            >
              <div className="text-xs">L{i + 1}</div>
              <Grid
                gridColumn={`2 / span ${activeFwdCols.length}`}
                templateColumns={`repeat(${activeDefCols.length}, 1fr)`}
                gap={1}
                w={
                  activeFwdCols.length === 3
                    ? `${(activeDefCols.length / 3) * 100}%`
                    : 'full'
                }
                mx={activeFwdCols.length === 3 ? 'auto' : undefined}
              >
                {activeDefCols.map((pos) => (
                  <Box key={pos}>
                    {line[pos] ? (
                      <LinePlayer
                        player={line[pos]}
                        className="w-full justify-center"
                        teamColors={teamColors}
                      />
                    ) : (
                      <div className="flex w-full items-center justify-center rounded-md border border-dashed py-3">
                        —
                      </div>
                    )}
                  </Box>
                ))}
              </Grid>
            </Grid>
          ))}
        </div>
      )}
    </div>
  );
};

export const Line = ({
  type,
  lines,
  columns = 3,
  teamColors,
}: {
  type: string;
  lines: Record<string, AnyLine>;
  columns: 3 | 4;
  teamColors: TeamInfo['colors'];
}) => {
  const lineEntries = useMemo(
    () =>
      Object.values(lines)
        .slice(0, columns)
        .filter((l) => l.LW || l.C || l.RW || l.LD || l.RD),
    [lines, columns],
  );

  if (!lineEntries.length) return null;

  return (
    <div className="mb-5">
      <div className="mb-4 border-b border-b-grey200 pb-3 text-center font-mont text-2xl font-bold">
        {type.split('on').join(' on ')}
      </div>
      <PositionGrid lineEntries={lineEntries} teamColors={teamColors} />
    </div>
  );
};
