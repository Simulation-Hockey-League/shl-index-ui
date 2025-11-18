import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Link } from 'components/common/Link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { PlayerHistory } from 'typings/api';
import { leagueIDToName } from 'utils/leagueHelpers';
import { calculateTimeOnIce } from 'utils/playerHelpers';
import { onlyIncludeSeasonAndTypeInQuery } from 'utils/routingHelpers';

import { playerTableGlobalFilterFn } from '../shared';
import { Table } from '../Table';
import { HISTORY_TABLE_FLAGS } from '../tableBehavioralFlags';
import { TableHeader } from '../TableHeader';

const columnHelper = createColumnHelper<PlayerHistory>();

export const SkaterHistoryTable = ({
  stats,
  league,
}: {
  stats: PlayerHistory[];
  league: number;
}) => {
  const router = useRouter();

  const columns = useMemo(
    () => [
      columnHelper.group({
        header: 'Player Info',
        columns: [
          columnHelper.display({
            id: 'rank',
            header: () => <TableHeader title="Rank">#</TableHeader>,
            cell: (props) => {
              const sortedRows = props.table.getSortedRowModel().rows;
              const currentRowId = props.row.id;
              const rank =
                sortedRows.findIndex((row) => row.id === currentRowId) + 1;
              return rank;
            },
            enableSorting: false,
            enableGlobalFilter: false,
          }),
          columnHelper.accessor(({ name, id }) => [name, id], {
            header: 'Player',
            id: 'player-table-player',
            enableGlobalFilter: true,
            cell: (props) => {
              const cellValue = props.getValue();
              return (
                <Link
                  href={{
                    pathname: `/[league]/player/[id]`,
                    query: {
                      ...onlyIncludeSeasonAndTypeInQuery(router.query),
                      league: leagueIDToName(league),
                      id: cellValue[1],
                    },
                  }}
                  className="inline-block max-w-[300px] truncate text-left leading-none text-blue600 "
                >
                  {cellValue[0]}
                </Link>
              );
            },
          }),
          columnHelper.accessor('teamAbbr', {
            header: () => <TableHeader title="teamAbbr">Teams</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: false,
            cell: ({ getValue }) => {
              const raw = getValue();
              if (!raw) {
                return <div className="text-xs">—</div>;
              }
              const teams = raw.split(',');
              const formatted = teams
                .map((team: string, index: number) =>
                  index > 0 && index % 3 === 0 ? ` ${team}` : team,
                )
                .join(',');
              return (
                <div className="whitespace-normal break-words text-xs leading-tight">
                  {formatted}
                </div>
              );
            },
          }),
          columnHelper.accessor('name', {
            header: () => <TableHeader title="name">name</TableHeader>,
            enableGlobalFilter: true,
          }),
        ],
      }),
      columnHelper.group({
        header: 'Scoring',
        columns: [
          columnHelper.accessor((row) => row.seasons ?? row.season, {
            id: 'player-table-season',
            header: () => <TableHeader title="season">Season</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('gamesPlayed', {
            header: () => <TableHeader title="gamesPlayed">GP</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('goals', {
            header: () => <TableHeader title="Goals">G</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('assists', {
            header: () => <TableHeader title="Assists">A</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('points', {
            id: 'player-table-player-points',
            header: () => <TableHeader title="Points">PTS</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('plusMinus', {
            header: () => <TableHeader title="Plus/Minus">+/-</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('pim', {
            header: () => (
              <TableHeader title="Penalties in Minutes">PIM</TableHeader>
            ),
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
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('shotsBlocked', {
            header: () => <TableHeader title="blockedShots">SB</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
        ],
      }),
      columnHelper.group({
        header: 'Ice Time',
        columns: [
          columnHelper.accessor(
            (row) => {
              const seconds = row.timeOnIce ?? 0;
              const games = row.gamesPlayed ?? 1;
              return seconds / games;
            },
            {
              id: 'player-table-toi',
              header: () => (
                <TableHeader title="Time on Ice (in Minutes)">TOI</TableHeader>
              ),
              cell: ({ getValue }) => calculateTimeOnIce(getValue(), 1),
              enableGlobalFilter: false,
              sortDescFirst: true,
            },
          ),
          columnHelper.accessor(
            (row) => {
              const seconds = row.ppTimeOnIce ?? 0;
              const games = row.gamesPlayed ?? 1;
              return seconds / games;
            },
            {
              id: 'player-table-pptoi',
              header: () => (
                <TableHeader title="PP Time on Ice (in Minutes)">
                  PPTOI
                </TableHeader>
              ),
              cell: ({ getValue }) => calculateTimeOnIce(getValue(), 1),
              enableGlobalFilter: false,
              sortDescFirst: true,
            },
          ),
          columnHelper.accessor(
            (row) => {
              const seconds = row.shTimeOnIce ?? 0;
              const games = row.gamesPlayed ?? 1;
              return seconds / games;
            },
            {
              id: 'player-table-shtoi',
              header: () => (
                <TableHeader title="SH Time on Ice (in Minutes)">
                  SHTOI
                </TableHeader>
              ),
              cell: ({ getValue }) => calculateTimeOnIce(getValue(), 1),
              enableGlobalFilter: false,
              sortDescFirst: true,
            },
          ),
        ],
      }),

      columnHelper.group({
        header: 'Misc Points',
        id: 'player-table-misc-points',
        columns: [
          columnHelper.accessor(
            (row) => (row.points ?? 0) / (row.gamesPlayed || 1),
            {
              id: 'player-table-PGP',
              header: () => <TableHeader title="P/GP">P/GP</TableHeader>,
              cell: ({ getValue }) => getValue().toFixed(2),
              enableGlobalFilter: false,
              sortDescFirst: true,
            },
          ),

          columnHelper.accessor('evGoals', {
            header: () => <TableHeader title="evGoals">EVG</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('evPoints', {
            header: () => <TableHeader title="evPoints">EVP</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('ppGoals', {
            header: () => <TableHeader title="ppGoals">PPG</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('shGoals', {
            header: () => <TableHeader title="shGoals">SHG</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
        ],
      }),

      columnHelper.group({
        header: 'Faceoffs',
        columns: [
          columnHelper.accessor(
            ({ faceoffs, faceoffWins }) =>
              faceoffs && faceoffWins ? faceoffWins : '-',
            {
              id: 'player-table-faceoff-wins',
              header: () => <TableHeader title="Faceoff Wins">W</TableHeader>,

              sortingFn: 'alphanumeric',
              enableGlobalFilter: false,
              sortDescFirst: true,
            },
          ),
          columnHelper.accessor(
            ({ faceoffs, faceoffWins }) =>
              faceoffs && faceoffWins ? faceoffs - faceoffWins : '-',
            {
              id: 'player-table-faceoff-losses',
              header: () => <TableHeader title="Faceoff Losses">L</TableHeader>,
              sortingFn: 'alphanumeric',
              enableGlobalFilter: false,
              sortDescFirst: true,
            },
          ),
          columnHelper.accessor(
            ({ faceoffs, faceoffWins }) =>
              faceoffs && faceoffWins
                ? `${((faceoffWins / faceoffs) * 100).toFixed(1)}%`
                : '-',
            {
              id: 'player-table-faceoffPct',
              header: () => (
                <TableHeader title="Faceoff Win Percent">FO%</TableHeader>
              ),
              sortingFn: 'alphanumeric',
              enableGlobalFilter: false,
              sortDescFirst: true,
            },
          ),
        ],
      }),
      columnHelper.group({
        header: 'Misc',
        id: 'player-table-misc',
        columns: [
          columnHelper.accessor('hits', {
            header: () => <TableHeader title="hits">Hits</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('takeaways', {
            header: () => <TableHeader title="takeaways">Tka</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('giveaways', {
            header: () => <TableHeader title="giveaways">Gva</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
        ],
      }),
    ],
    [league, router.query],
  );

  const table = useReactTable({
    columns,
    data: stats,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableGlobalFilter: true,
    globalFilterFn: playerTableGlobalFilterFn,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      sorting: [{ id: 'player-table-player-points', desc: true }],
      pagination: {
        pageSize: 25,
        pageIndex: 0,
      },
    },
    state: {
      columnVisibility: {
        name: false,
      },
    },
  });

  return (
    <Table<PlayerHistory>
      table={table}
      tableBehavioralFlags={HISTORY_TABLE_FLAGS}
      label={`player_history`}
    />
  );
};
