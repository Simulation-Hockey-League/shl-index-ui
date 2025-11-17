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
import { seasonTypeToApiFriendlyParam } from 'utils/seasonTypeHelpers';

import { Goalie_Boxscore } from '../../typings/api';
import { query } from '../../utils/query';
import { onlyIncludeSeasonAndTypeInQuery } from '../../utils/routingHelpers';
import { Link } from '../common/Link';

import { Table } from './Table';
import { BOXSCORE_GOALIE_TABLE_FLAGS } from './tableBehavioralFlags';
import { TableHeader } from './TableHeader';

const columnHelper = createColumnHelper<Goalie_Boxscore>();

export const GoalieBoxscoreTable = ({
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
  const { data: goalieBoxScoreStats, isLoading: goalieBoxScoreStatsIsLoading } =
    useQuery<Goalie_Boxscore[]>({
      queryKey: ['goalieBoxScoreStats', league, playerID, type, season],
      queryFn: () => {
        const seasonTypeParam = type
          ? `&type=${seasonTypeToApiFriendlyParam(type)}`
          : '';
        return query(
          `api/v1/goalies/boxscores?id=${playerID}&league=${leagueNameToId(
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
        header: '',
        id: 'player-table-misc',
        columns: [
          columnHelper.accessor('descision', {
            enableGlobalFilter: true,
            header: () => <TableHeader title="descision">Des</TableHeader>,
            cell: ({ row }) => {
              const { descision } = row.original;
              return `${descision ? 'W' : 'L'}`;
            },
          }),
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
          columnHelper.accessor('minutesPlayed', {
            header: () => <TableHeader title="Minutes Played">MP</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('PIM', {
            header: () => <TableHeader title="PIM">PIM</TableHeader>,
            enableGlobalFilter: false,
            sortDescFirst: true,
          }),
          columnHelper.accessor('gameRating', {
            header: () => (
              <TableHeader title="gameRating">gameRating</TableHeader>
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
    data: goalieBoxScoreStats ?? [],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'player-table-basic-info', desc: true }],
    },
  });

  if (goalieBoxScoreStatsIsLoading || !goalieBoxScoreStats) {
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
            <option className="!bg-primary" key={s} value={s}>
              Season {s}
            </option>
          ))}
      </Select>
      <Table<Goalie_Boxscore>
        table={table}
        tableBehavioralFlags={BOXSCORE_GOALIE_TABLE_FLAGS}
        label={`${type}_goalie_stats_boxscores`}
      />
    </>
  );
};
