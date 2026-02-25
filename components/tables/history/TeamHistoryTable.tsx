import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { TeamHistory } from 'typings/api';
import { selectTeamReport } from 'utils/reportHelpers';
import { REPORT_CONFIGURATIONS } from 'utils/teamColumnConfig';

import { playerTableGlobalFilterFn } from '../shared';
import { Table } from '../Table';
import { HISTORY_TABLE_FLAGS } from '../tableBehavioralFlags';

export const TeamHistoryTable = ({
  stats,
  league,
  grouped,
  report,
}: {
  stats: TeamHistory[];
  league: number;
  grouped: boolean;
  report: selectTeamReport;
}) => {
  const router = useRouter();
  const isInternational = grouped && league > 1;

  const columns = useMemo(() => {
    const config = REPORT_CONFIGURATIONS[report];

    return config.getColumns({
      league,
      router,
      grouped,
      isInternational,
    });
  }, [report, league, router, grouped, isInternational]);

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
  });

  return (
    <Table<TeamHistory>
      table={table}
      tableBehavioralFlags={HISTORY_TABLE_FLAGS}
      label="team_history"
    />
  );
};
