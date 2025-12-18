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
import { GoalieHistory } from 'typings/api';
import { leagueIDToName } from 'utils/leagueHelpers';
import { onlyIncludeSeasonAndTypeInQuery } from 'utils/routingHelpers';

import { playerTableGlobalFilterFn } from '../shared';
import { Table } from '../Table';
import { HISTORY_TABLE_FLAGS } from '../tableBehavioralFlags';
import { TableHeader } from '../TableHeader';

const columnHelper = createColumnHelper<GoalieHistory>();

export const GoalieHistoryTable = ({
  stats,
  league,
}: {
  stats: GoalieHistory[];
  league: number;
}) => {
  const router = useRouter();

  const columns = useMemo(
    () => [
      columnHelper.group({
        header: 'Player Info',
        id: 'player-table-basic-info',
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
            enableGlobalFilter: true,
            header: 'Player',
            id: 'player-table-player',
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
        header: '',
        id: 'player-table-main',
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
          columnHelper.accessor('wins', {
            header: () => <TableHeader title="wins">Wins</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('losses', {
            header: () => <TableHeader title="losses">Losses</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('ot', {
            header: () => <TableHeader title="OTL">OTL</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('shutouts', {
            header: () => <TableHeader title="shutouts">SO</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
        ],
      }),
      columnHelper.group({
        header: '',
        id: 'player-table-misc',
        columns: [
          columnHelper.accessor('shotsAgainst', {
            header: () => <TableHeader title="shotsAgainst">SA</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('goalsAgainst', {
            header: () => <TableHeader title="goalsAgainst">GA</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('savePct', {
            header: () => <TableHeader title="savePcts">SV%</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('minutes', {
            header: () => <TableHeader title="Minutes Played">MP</TableHeader>,
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
      sorting: [{ id: 'player-table-main', desc: true }],
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
    <Table<GoalieHistory>
      table={table}
      tableBehavioralFlags={HISTORY_TABLE_FLAGS}
      label={`player_history`}
    />
  );
};
