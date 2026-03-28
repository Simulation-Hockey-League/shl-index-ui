import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import classnames from 'classnames';
import { useRouter } from 'next/router';
import { last_fifteen } from 'pages/api/v1/standings/last-fifteen';
import { useMemo } from 'react';

import { League } from '../../utils/leagueHelpers';
import { onlyIncludeSeasonAndTypeInQuery } from '../../utils/routingHelpers';
import { Link } from '../common/Link';
import { TeamLogo } from '../TeamLogo';

import { Table } from './Table';
import { STANDINGS_TABLE } from './tableBehavioralFlags';
import { TableHeader } from './TableHeader';

const columnHelper = createColumnHelper<last_fifteen>();

const SkeletonCell = ({ wide = false }: { wide?: boolean }) => (
  <div
    className={classnames(
      'animate-pulse rounded bg-secondary/40',
      wide ? 'h-4 w-24' : 'h-4 w-8',
    )}
  />
);

const SKELETON_ROWS = 8;

export const LastFifteenTable = ({
  league,
  data,
  title,
  isLoading = false,
}: {
  league: League;
  data: Array<last_fifteen>;
  title?: string;
  isLoading?: boolean;
}) => {
  const router = useRouter();

  const columns = useMemo(
    () => [
      columnHelper.accessor(
        ({ Abbr, Name, Nickname, TeamID }) => [Abbr, Name, Nickname, TeamID],
        {
          header: title ?? 'Team',
          id: 'team',
          cell: (props) => {
            const cellValue = props.getValue();
            return (
              <Link
                href={{
                  pathname: '/[league]/team/[id]',
                  query: {
                    ...onlyIncludeSeasonAndTypeInQuery(router.query),
                    id: cellValue[3],
                  },
                }}
                className="grid min-w-0 max-w-[240px] grid-cols-[40px_40px_1fr] items-center pr-3 md:min-w-[200px] md:pr-0"
              >
                <TeamLogo
                  league={league}
                  teamAbbreviation={cellValue[0] as string}
                  aria-label={`${cellValue[2]} logo`}
                  className="size-[30px]"
                />
                <span className="inline text-left text-blue600 md:hidden">
                  {cellValue[0]}
                </span>
                <span className="mx-2.5 my-0 hidden min-w-max text-left text-blue600 md:inline">
                  {cellValue[1]}
                </span>
              </Link>
            );
          },
          enableSorting: false,
        },
      ),
      columnHelper.accessor('GP', {
        header: () => <TableHeader title="Games Played">GP</TableHeader>,
      }),
      columnHelper.accessor('Wins', {
        header: () => <TableHeader title="Wins">W</TableHeader>,
      }),
      columnHelper.accessor('Losses', {
        header: () => <TableHeader title="Losses">L</TableHeader>,
      }),
      columnHelper.accessor('OTL', {
        header: () => <TableHeader title="Overtime Losses">OT</TableHeader>,
      }),
      columnHelper.accessor('GoalDiff', {
        cell: (props) => {
          const currentValue = props.getValue();
          return (
            <span
              className={classnames(
                currentValue === 0
                  ? 'text-primary'
                  : currentValue > 0
                    ? 'text-[#48b400]'
                    : 'text-[#d60000]',
              )}
            >
              {currentValue > 0 && '+'}
              {currentValue}
            </span>
          );
        },
        header: () => <TableHeader title="Goal Differential">DIFF</TableHeader>,
        sortingFn: 'basic',
      }),
    ],
    [league, router.query, title],
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-secondary">
              <th className="py-2 pr-3 text-left font-semibold">
                {title ?? 'Team'}
              </th>
              {['GP', 'W', 'L', 'OT', 'DIFF'].map((h) => (
                <th key={h} className="p-2 text-center font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <tr key={i} className="border-b border-secondary/30">
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="size-[30px] animate-pulse rounded-full bg-secondary/40" />
                    <SkeletonCell wide />
                  </div>
                </td>
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="p-2 text-center">
                    <div className="flex justify-center">
                      <SkeletonCell />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <Table<last_fifteen> table={table} tableBehavioralFlags={STANDINGS_TABLE} />
  );
};
