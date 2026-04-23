import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { TeamInfo } from 'pages/api/v1/teams';

import { TeamLines } from '../../pages/api/v1/teams/[id]/lines';
import { isMainLeague, League } from '../../utils/leagueHelpers';

import { Line } from './Line';
import { LinePlayer } from './LinePlayer';
import { SpecialTeamsLines } from './SpecialTeams';

const linesDisplays = [
  'Even Strength',
  'Power Play',
  'Penalty Kill',
  'Misc',
] as const;

export const Lines = ({
  league,
  lines,
  teamColors,
}: {
  league: League;
  lines: TeamLines;
  teamColors: TeamInfo['colors'];
}) => {
  return (
    <Tabs>
      <TabList>
        {linesDisplays.map((name) => (
          <Tab key={name}>{name}</Tab>
        ))}
      </TabList>
      <TabPanels>
        <TabPanel>
          {Object.entries(lines.ES)
            .filter(([lineType]) => lineType === '5on5')
            .map(([lineType, group]) => (
              <Line
                key={lineType}
                type={lineType}
                lines={group}
                columns={!isMainLeague(league) ? 4 : 3}
                teamColors={teamColors}
              />
            ))}

          <div className="mt-4 flex w-full flex-col items-center gap-3">
            <h3 className="text-lg font-bold text-primary">Goalies</h3>
            <div className="flex w-full max-w-md gap-3 py-3">
              <LinePlayer
                player={lines.goalies.starter}
                className="flex-1 justify-center"
                teamColors={teamColors}
              />
              <LinePlayer
                player={lines.goalies.backup}
                className="flex-1 justify-center"
                teamColors={teamColors}
              />
            </div>
          </div>

          {Object.entries(lines.ES)
            .filter(([lineType]) => lineType !== '5on5')
            .map(([lineType, group]) => (
              <Line
                key={lineType}
                type={lineType}
                lines={group}
                columns={!isMainLeague(league) ? 4 : 3}
                teamColors={teamColors}
              />
            ))}
        </TabPanel>

        <TabPanel>
          {Object.entries(lines.PP).map(([lineType, group]) => (
            <SpecialTeamsLines
              key={lineType}
              situationType={lineType}
              group={group}
              teamColors={teamColors}
            />
          ))}
        </TabPanel>

        <TabPanel>
          {Object.entries(lines.PK).map(([lineType, group]) => (
            <SpecialTeamsLines
              key={lineType}
              situationType={lineType}
              group={group}
              teamColors={teamColors}
            />
          ))}
        </TabPanel>

        <TabPanel>
          <div className="flex w-full flex-col gap-10 sm:flex-row sm:items-start sm:justify-evenly">
            <div className="flex flex-1 flex-col items-center gap-3">
              <h3 className="text-lg font-bold">Shootout Order</h3>
              <div className="flex w-full flex-col gap-2">
                {lines.shootout
                  .filter((player) => !!player)
                  .map((player, i) => (
                    <LinePlayer
                      key={i}
                      player={player}
                      className="w-full"
                      teamColors={teamColors}
                    />
                  ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center gap-3">
              <h3 className="text-lg font-bold">Extra Attackers</h3>
              <div className="flex w-full flex-col gap-2">
                {lines.extraAttackers
                  .filter((player) => !!player)
                  .map((player, i) => (
                    <LinePlayer
                      key={i}
                      player={player}
                      className="w-full"
                      teamColors={teamColors}
                    />
                  ))}
              </div>
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
