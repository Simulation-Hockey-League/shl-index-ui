import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import classnames from 'classnames';
import { useRouter } from 'next/router';
import { TeamInfo } from 'pages/api/v1/teams';
import { useMemo } from 'react';
import { Game } from 'typings/api';

import { League } from '../../utils/leagueHelpers';
import { onlyIncludeSeasonAndTypeInQuery } from '../../utils/routingHelpers';
import { Link } from '../common/Link';
import { TeamLogo } from '../TeamLogo';

import { Table } from './Table';
import { GAMES_TABLE } from './tableBehavioralFlags';
import { TableHeader } from './TableHeader';

const columnHelper = createColumnHelper<Game>();

export const ScheduleTable = ({
  league,
  data,
  teams,
  selectedTeamId,
}: {
  league: League;
  data: Game[];
  teams: TeamInfo[];
  selectedTeamId: number;
}) => {
  const router = useRouter();

  const teamsById = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams],
  );

  const rollingGames = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let otl = 0;

    const sorted = [...data].sort((a, b) => {
      const [aY, aM, aD] = a.date.split('-').map(Number);
      const [bY, bM, bD] = b.date.split('-').map(Number);
      return (
        new Date(aY, aM - 1, aD).getTime() - new Date(bY, bM - 1, bD).getTime()
      );
    });

    return sorted.map((game): Game => {
      if (!game.played) return { ...game, wlOtl: undefined };

      const isHome = game.homeTeam === selectedTeamId;
      const teamScore = isHome ? game.homeScore : game.awayScore;
      const oppScore = isHome ? game.awayScore : game.homeScore;
      const won = teamScore > oppScore;
      const isOtl = !won && (game.overtime || game.shootout);

      if (won) wins++;
      else if (isOtl) otl++;
      else losses++;

      return { ...game, wlOtl: `${wins}-${losses}-${otl}` };
    });
  }, [data, selectedTeamId]);

  const columns = useMemo(
    () => [
      columnHelper.accessor(
        (row) => {
          const [year, month, day] = row.date.split('-').map(Number);
          return new Date(year, month - 1, day).getTime();
        },
        {
          id: 'game-date',
          header: () => <TableHeader title="Date">Date</TableHeader>,
          sortDescFirst: true,
          cell: ({ row }) => (
            <span className="text-sm text-primary">{row.original.date}</span>
          ),
        },
      ),
      columnHelper.accessor(
        (row) =>
          row.homeTeam === selectedTeamId ? row.awayTeam : row.homeTeam,
        {
          id: 'opponent',
          header: () => <TableHeader title="Opponent">Opponent</TableHeader>,
          enableSorting: true,
          cell: (props) => {
            const opponentId = props.getValue();
            const opponent = teamsById.get(opponentId);
            const isHome = props.row.original.homeTeam === selectedTeamId;
            return (
              <div className="flex items-center gap-2 pr-4 md:pr-0">
                <span className="w-4 text-xs text-secondary">
                  {isHome ? 'vs' : '@'}
                </span>
                <Link
                  href={{
                    pathname: '/[league]/team/[id]',
                    query: {
                      ...onlyIncludeSeasonAndTypeInQuery(router.query),
                      id: opponentId,
                    },
                  }}
                  className="flex items-center gap-2"
                >
                  <TeamLogo
                    league={league}
                    teamAbbreviation={opponent?.abbreviation}
                    aria-label={`${opponent?.name} logo`}
                    className="size-[26px]"
                  />
                  <span className="inline text-left text-blue600 md:hidden">
                    {opponent?.abbreviation}
                  </span>
                  <span className="mx-2.5 my-0 hidden min-w-max text-left text-blue600 md:inline">
                    {opponent?.name}
                  </span>
                </Link>
              </div>
            );
          },
        },
      ),
      columnHelper.accessor(
        ({ homeScore, awayScore, overtime, shootout, played, homeTeam }) => ({
          homeScore,
          awayScore,
          overtime,
          shootout,
          played,
          homeTeam,
        }),
        {
          id: 'result',
          header: () => <TableHeader title="Result">Result</TableHeader>,
          enableSorting: false,
          cell: (props) => {
            const {
              homeScore,
              awayScore,
              overtime,
              shootout,
              played,
              homeTeam,
            } = props.getValue();

            if (!played) {
              return <span className="text-sm text-tertiary">–</span>;
            }

            const isHome = homeTeam === selectedTeamId;
            const teamScore = isHome ? homeScore : awayScore;
            const oppScore = isHome ? awayScore : homeScore;
            const won = teamScore > oppScore;
            const tag = shootout ? 'SO' : overtime ? 'OT' : null;

            return (
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={classnames(
                      'flex size-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                      won
                        ? 'bg-green500'
                        : 'border border-secondary bg-secondary text-tertiary',
                    )}
                  >
                    {won ? 'W' : 'L'}
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {teamScore}–{oppScore}
                  </span>
                </div>
                {tag && (
                  <span className="rounded bg-secondary px-1 py-0.5 text-center text-[10px] text-tertiary">
                    {tag}
                  </span>
                )}
              </div>
            );
          },
        },
      ),
      columnHelper.accessor('wlOtl', {
        id: 'wlOtl',
        header: () => <TableHeader title="W-L-OTL">W-L-OTL</TableHeader>,
        enableSorting: false,
        cell: (props) => (
          <span className="text-sm text-primary">
            {props.getValue() ?? '–'}
          </span>
        ),
      }),
      columnHelper.accessor(
        (row) => {
          const [year, month, day] = row.date.split('-').map(Number);
          return new Date(year, month - 1, day).getTime();
        },
        {
          id: 'game-link',
          header: () => <TableHeader title="Link">Link</TableHeader>,
          enableSorting: false,
          cell: ({ row }) => {
            const { slug, season } = row.original;
            return (
              <Link
                href={{
                  pathname: '/[league]/[season]/game/[id]',
                  query: {
                    ...onlyIncludeSeasonAndTypeInQuery(router.query),
                    id: slug,
                    league,
                    season: season.toString(),
                  },
                }}
                className="flex items-center gap-1 text-sm text-blue600 hover:underline"
                target="_blank"
              >
                Game <ExternalLinkIcon boxSize={3} />
              </Link>
            );
          },
        },
      ),
    ],
    [league, router.query, teamsById, selectedTeamId],
  );

  const table = useReactTable({
    columns,
    data: rollingGames,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 66,
        pageIndex: 0,
      },
      sorting: [{ id: 'game-date', desc: false }],
    },
  });

  return <Table<Game> table={table} tableBehavioralFlags={GAMES_TABLE} />;
};
