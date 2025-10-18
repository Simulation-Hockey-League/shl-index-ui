import { Select, Spinner } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { leagueNameToId } from 'utils/leagueHelpers';
import { calculateTimeOnIce } from 'utils/playerHelpers';
import { seasonTypeToApiFriendlyParam } from 'utils/seasonTypeHelpers';

import { Skater_Boxscore } from '../../typings/api';
import { query } from '../../utils/query';
import { onlyIncludeSeasonAndTypeInQuery } from '../../utils/routingHelpers';
import { Link } from '../common/Link';

import {
  calculateColumnAverageForColumnID,
  calculateColumnSumForColumnID,
} from './shared';
import { Table } from './Table';
import { TABLE_BOXSCORE_FLAGS } from './tableBehavioralFlags';
import { TableHeader } from './TableHeader';

const columnHelper = createColumnHelper<Skater_Boxscore>();

export const SkaterBoxscoreTable = ({
  playerID,
  league,
  type,
  seasonList,
  selectedSeason,
}: {
  playerID: string;
  league: 'shl' | 'smjhl' | 'iihf' | 'wjc';
  type: 'Pre-Season' | 'Regular Season' | 'Playoffs';
  seasonList: number[];
  selectedSeason?: string;
}) => {
  const useSeason =
    selectedSeason && Number(selectedSeason) >= 66
      ? Number(selectedSeason)
      : seasonList[0];

  const router = useRouter();
  const [season, setSeason] = useState<number>(useSeason);

  leagueNameToId;
  const { data: playerBoxScoreStats, isLoading: playerBoxScoreStatsIsLoading } =
    useQuery<Skater_Boxscore[]>({
      queryKey: ['playerBoxScoreStats', league, playerID, type, season],
      queryFn: () => {
        const seasonTypeParam = type
          ? `&type=${seasonTypeToApiFriendlyParam(type)}`
          : '';
        return query(
          `api/v1/players/boxscores?id=${playerID}&league=${leagueNameToId(
            league,
          )}${seasonTypeParam}&season=${season}`,
        );
      },
    });

  const columns = useMemo(
    () => [
      columnHelper.group({
        header: '',
        id: 'player-table-basic-info',
        columns: [
          columnHelper.accessor(({ date, slug }) => [date, slug], {
            header: 'Game',
            id: 'player-table-game',
            enableGlobalFilter: true,
            cell: (props) => {
              const cellValue = props.getValue();
              return (
                <Link
                  href={{
                    pathname: `/[league]/[season]/game/[id]`,
                    query: {
                      ...onlyIncludeSeasonAndTypeInQuery(router.query),
                      id: cellValue[1],
                      league: league,
                      season: season.toString(),
                    },
                  }}
                  className="inline-block w-full max-w-[180px] truncate text-left leading-none text-blue600 "
                >
                  {cellValue[0]}
                </Link>
              );
            },
          }),

          columnHelper.accessor('teamAbbr', {
            enableGlobalFilter: true,
            header: () => <TableHeader title="teamAbbr">Team</TableHeader>,
          }),
          columnHelper.accessor('opponentAbbr', {
            enableGlobalFilter: true,
            header: () => <TableHeader title="opponentAbbr">Opp</TableHeader>,
            cell: ({ row }) => {
              const { opponentAbbr, isHome } = row.original;
              return `${isHome ? 'vs' : '@'} ${opponentAbbr}`;
            },
          }),
        ],
      }),
      columnHelper.group({
        header: 'Scoring',
        columns: [
          columnHelper.accessor('goals', {
            header: () => <TableHeader title="Goals">G</TableHeader>,
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'goals'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('assists', {
            header: () => <TableHeader title="Assists">A</TableHeader>,
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'assists'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('points', {
            header: () => <TableHeader title="Points">PTS</TableHeader>,
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'points'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('plusMinus', {
            header: () => <TableHeader title="Plus/Minus">+/-</TableHeader>,
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'plusMinus'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('pim', {
            header: () => (
              <TableHeader title="Penalties in Minutes">PIM</TableHeader>
            ),
            footer: ({ table }) => calculateColumnSumForColumnID(table, 'pim'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
        ],
      }),
      columnHelper.group({
        header: 'Shots',
        id: 'shots',
        columns: [
          columnHelper.accessor('shotsOnGoal', {
            header: () => <TableHeader title="Shots On Goal">S</TableHeader>,
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'shotsOnGoal'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('missedShots', {
            header: () => <TableHeader title="missedShots">MS</TableHeader>,
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'missedShots'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('blockedShots', {
            header: () => <TableHeader title="blockedShots">BLK</TableHeader>,
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'blockedShots'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
        ],
      }),
      columnHelper.group({
        header: 'Ice Time',
        columns: [
          columnHelper.accessor('shifts', {
            header: () => <TableHeader title="shifts">Shifts</TableHeader>,
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'shifts'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('timeOnIce', {
            id: 'player-table-toi',
            header: () => (
              <TableHeader title="Time on Ice (in Minutes)">TOI</TableHeader>
            ),
            cell: ({ getValue }) => {
              const seconds = getValue<number>();
              return calculateTimeOnIce(seconds, 1);
            },
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'player-table-toi'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('ppTimeOnIce', {
            id: 'player-table-pptoi',
            header: () => (
              <TableHeader title="PP Time on Ice (in Minutes)">
                PPTOI
              </TableHeader>
            ),
            cell: ({ getValue }) => {
              const seconds = getValue<number>();
              return calculateTimeOnIce(seconds, 1);
            },
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'player-table-pptoi'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('shTimeOnIce', {
            id: 'player-table-shtoi',
            header: () => (
              <TableHeader title="SH Time on Ice (in Minutes)">
                SHTOI
              </TableHeader>
            ),
            cell: ({ getValue }) => {
              const seconds = getValue<number>();
              return calculateTimeOnIce(seconds, 1);
            },
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'player-table-shtoi'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
        ],
      }),

      columnHelper.group({
        header: 'Faceoffs',
        columns: [
          columnHelper.accessor(
            ({ faceoffs, faceoffsWon }) =>
              faceoffs && faceoffsWon ? faceoffsWon : '-',
            {
              id: 'player-table-faceoff-wins',
              header: () => <TableHeader title="Faceoff Wins">W</TableHeader>,
              footer: ({ table }) =>
                calculateColumnSumForColumnID(
                  table,
                  'player-table-faceoff-wins',
                ) || '-',
              sortingFn: 'alphanumeric',
              enableGlobalFilter: false,
              sortDescFirst: true,
            },
          ),
          columnHelper.accessor(
            ({ faceoffs, faceoffsWon }) =>
              faceoffs && faceoffsWon ? faceoffs - faceoffsWon : '-',
            {
              id: 'player-table-faceoff-losses',
              header: () => <TableHeader title="Faceoff Losses">L</TableHeader>,
              footer: ({ table }) =>
                calculateColumnSumForColumnID(
                  table,
                  'player-table-faceoff-losses',
                ) || '-',
              sortingFn: 'alphanumeric',
              enableGlobalFilter: false,
              sortDescFirst: true,
            },
          ),
          columnHelper.accessor(
            ({ faceoffs, faceoffsWon }) =>
              faceoffs && faceoffsWon
                ? `${((faceoffsWon / faceoffs) * 100).toFixed(1)}%`
                : '-',
            {
              id: 'player-table-faceoffPct',
              header: () => (
                <TableHeader title="Faceoff Win Percent">FO%</TableHeader>
              ),
              footer: ({ table }) => {
                const wins = calculateColumnSumForColumnID(
                  table,
                  'player-table-faceoff-wins',
                );
                const total =
                  wins +
                  calculateColumnSumForColumnID(
                    table,
                    'player-table-faceoff-losses',
                  );

                if (isNaN(wins) || isNaN(total)) return '-';
                return `${((wins / total) * 100).toFixed(1)}%`;
              },
              sortingFn: 'alphanumeric',
              enableGlobalFilter: false,
              sortDescFirst: true,
            },
          ),
        ],
      }),
      columnHelper.group({
        header: '',
        id: 'player-table-misc',
        columns: [
          columnHelper.accessor('hits', {
            header: () => <TableHeader title="hits">Hits</TableHeader>,
            footer: ({ table }) => calculateColumnSumForColumnID(table, 'hits'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('takeaways', {
            header: () => <TableHeader title="takeaways">Tka</TableHeader>,
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'takeaways'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('giveaways', {
            header: () => <TableHeader title="giveaways">Gva</TableHeader>,
            footer: ({ table }) =>
              calculateColumnSumForColumnID(table, 'giveaways'),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
        ],
      }),
      columnHelper.group({
        header: 'Game Rating',
        columns: [
          columnHelper.accessor('gameRating', {
            header: () => (
              <TableHeader title="Overall Game Rating">GR</TableHeader>
            ),
            footer: ({ table }) =>
              Math.round(
                calculateColumnAverageForColumnID(table, 'gameRating'),
              ),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('offensiveGameRating', {
            header: () => (
              <TableHeader title="Offensive Game Rating">OGR</TableHeader>
            ),
            footer: ({ table }) =>
              Math.round(
                calculateColumnAverageForColumnID(table, 'offensiveGameRating'),
              ),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('defensiveGameRating', {
            header: () => (
              <TableHeader title="Defensive Game Rating">DGR</TableHeader>
            ),
            footer: ({ table }) =>
              Math.round(
                calculateColumnAverageForColumnID(table, 'defensiveGameRating'),
              ),
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
        ],
      }),
    ],
    [league, router.query, season],
  );

  const table = useReactTable({
    columns,
    data: playerBoxScoreStats ?? [],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'player-table-basic-info', desc: true }],
    },
  });

  if (playerBoxScoreStatsIsLoading || !playerBoxScoreStats) {
    return <Spinner />;
  }
  return (
    <>
      {selectedSeason && Number(selectedSeason) < 66 && (
        <p className="text-red200">No Play by play data before S66</p>
      )}
      <Select
        value={season?.toString()}
        onChange={(e) => setSeason(Number(e.target.value))}
      >
        {seasonList
          .sort((a, b) => b - a)
          .map((s) => (
            <option key={s} value={s}>
              Season {s}
            </option>
          ))}
      </Select>
      <Table<Skater_Boxscore>
        table={table}
        tableBehavioralFlags={TABLE_BOXSCORE_FLAGS({
          playerType: 'skater',
          data: 'scoring',
        })}
        label={`${type}_skater_stats_boxscores`}
      />
    </>
  );
};
