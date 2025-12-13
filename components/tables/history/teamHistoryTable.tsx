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
import { TeamHistory } from 'typings/api';
import { leagueIDToName } from 'utils/leagueHelpers';
import { onlyIncludeSeasonAndTypeInQuery } from 'utils/routingHelpers';

import { playerTableGlobalFilterFn } from '../shared';
import { Table } from '../Table';
import { HISTORY_TABLE_FLAGS } from '../tableBehavioralFlags';
import { TableHeader } from '../TableHeader';

const columnHelper = createColumnHelper<TeamHistory>();

export const TeamHistoryTable = ({
  stats,
  league,
}: {
  stats: TeamHistory[];
  league: number;
}) => {
  const router = useRouter();

  const columns = useMemo(
    () => [
      columnHelper.group({
        header: '',
        id: 'team-table-info',
        columns: [
          columnHelper.accessor(
            ({ name, nickname, id }) => [name, nickname, id],
            {
              enableGlobalFilter: true,
              header: 'Team',
              id: 'team-table-team',
              cell: (props) => {
                const cellValue = props.getValue();
                return (
                  <Link
                    href={{
                      pathname: `/[league]/team/[id]`,
                      query: {
                        ...onlyIncludeSeasonAndTypeInQuery(router.query),
                        league: leagueIDToName(league),
                        id: cellValue[2],
                      },
                    }}
                    className="inline-block truncate text-left leading-none text-blue600 "
                  >
                    {cellValue[0]} {cellValue[1]}
                  </Link>
                );
              },
            },
          ),
          columnHelper.accessor('name', {
            header: () => <TableHeader title="name">name</TableHeader>,
            enableGlobalFilter: true,
          }),
        ],
      }),
      columnHelper.group({
        header: '',
        id: 'team-table-main',
        columns: [
          columnHelper.accessor((row) => row.seasons ?? row.season, {
            id: 'team-table-main-season',
            header: () => <TableHeader title="season">Season</TableHeader>,
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
          columnHelper.accessor('overtimeLosses', {
            header: () => <TableHeader title="OTL">OTL</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('points', {
            id: 'team-table-main-points',
            header: () => <TableHeader title="points">Points</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('shootoutWins', {
            header: () => <TableHeader title="shootoutWins">SOW</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('shootoutLosses', {
            header: () => <TableHeader title="shootoutLosses">SOL</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('goalsFor', {
            header: () => <TableHeader title="goalsFor">GF</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('goalsAgainst', {
            header: () => <TableHeader title="goalsAgainst">GA</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('winPercent', {
            header: () => <TableHeader title="winPercent">Win%</TableHeader>,
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
      sorting: [{ id: 'team-table-main-points', desc: true }],
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
    <Table<TeamHistory>
      table={table}
      tableBehavioralFlags={HISTORY_TABLE_FLAGS}
      label={`team_history`}
    />
  );
};
