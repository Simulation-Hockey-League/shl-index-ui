import { createColumnHelper } from '@tanstack/react-table';
import { Link } from 'components/common/Link';
import { TeamHistory } from 'typings/api';
import { leagueIDToName } from 'utils/leagueHelpers';
import { onlyIncludeSeasonAndTypeInQuery } from 'utils/routingHelpers';
import { intToOrdinalNumberString } from 'utils/tableHelpers';

import { TableHeader } from '../TableHeader';

const columnHelper = createColumnHelper<TeamHistory>();

export const getTeamColumn = (league: number, router: any) =>
  columnHelper.accessor(({ name, nickname, id }) => [name, nickname, id], {
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
  });

export const getSeasonColumn = () =>
  columnHelper.accessor((row) => row.seasons ?? row.season, {
    id: 'team-table-main-season',
    header: () => <TableHeader title="season">Season</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  });

export const getBaseStandingsColumns = () => [
  columnHelper.accessor('leagueRank', {
    header: () => <TableHeader title="League Rank">League Finish</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
    cell: (props) => intToOrdinalNumberString(props.getValue()),
  }),
  columnHelper.accessor('conferenceRank', {
    header: () => (
      <TableHeader title="Conference Rank">Conf Finish</TableHeader>
    ),
    enableGlobalFilter: false,
    sortDescFirst: true,
    cell: (props) => intToOrdinalNumberString(props.getValue()),
  }),
  columnHelper.accessor('divisionRank', {
    header: () => <TableHeader title="Division Rank">Div. Finish</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
    cell: (props) => intToOrdinalNumberString(props.getValue()),
  }),
  columnHelper.accessor(
    ({ playoffResult, league, season }) => [playoffResult, league, season],
    {
      header: () => (
        <TableHeader title="Playoff Result">Playoff Result</TableHeader>
      ),
      id: 'team-table-playoff-result',
      enableGlobalFilter: false,
      sortDescFirst: true,
      cell: (props) => {
        const cellValue = props.getValue();
        const result = cellValue[0];
        const league = cellValue[1];
        const season = cellValue[2];

        if (!season || league === undefined) return result;

        return (
          <Link
            href={{
              pathname: `/[league]/standings`,
              query: {
                league: leagueIDToName(Number(league)),
                type: 'playoffs',
                season,
              },
            }}
            className="inline-block truncate text-left leading-none text-blue600"
            target="_blank"
          >
            {result}
          </Link>
        );
      },
    },
  ),
];

export const getBaseRecordColumns = () => [
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
];

export const getPlayoffGroupedColumns = (league: number) => [
  columnHelper.accessor('finalsWon', {
    header: () => (
      <TableHeader title="finalsWon">
        {league === 0 ? 'Challenge Cup' : '4 Star Cup'}
      </TableHeader>
    ),
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('finalsLost', {
    header: () => (
      <TableHeader title="finalsLost">
        {league === 0 ? 'Challenge Cup Loss' : '4 Star Loss'}
      </TableHeader>
    ),
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('round3', {
    header: () => <TableHeader title="round3">R3 Loss</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('round2', {
    header: () => <TableHeader title="round2">R2 Loss</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('round1', {
    header: () => <TableHeader title="round1">R1 Loss</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('missed', {
    header: () => <TableHeader title="missed">Missed PLF</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('playoffWins', {
    header: () => <TableHeader title="playoffWins">PLF Wins</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('playoffLosses', {
    header: () => <TableHeader title="playoffLosses">PLF Losses</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
];

export const getPlayoffInternationalColumns = () => [
  columnHelper.accessor('gold', {
    header: () => <TableHeader title="gold">Gold</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('silver', {
    header: () => <TableHeader title="silver">Silver</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('bronze', {
    header: () => <TableHeader title="bronze">Bronze</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('bronzeLosers', {
    header: () => <TableHeader title="bronzeLosers">4th Place</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('round1', {
    header: () => <TableHeader title="round1">R1 Loss</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
];

export const getPlayoffUngroupedColumns = () => [
  columnHelper.accessor('playoffResult', {
    header: () => <TableHeader title="playoffResult">Playoffs</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('playoffWins', {
    header: () => <TableHeader title="playoffWins">PLF Wins</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('playoffLosses', {
    header: () => <TableHeader title="playoffLosses">PLF Losses</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
];

export const getStatsColumns = () => [
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
  columnHelper.accessor('S', {
    header: () => <TableHeader title="shots">Shots</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('SA', {
    header: () => <TableHeader title="shotsAgainst">Shots Against</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('FOPct', {
    header: () => <TableHeader title="faceoffPercentage">FO%</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('SB', {
    header: () => <TableHeader title="shotsBlocked">SB</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('H', {
    header: () => <TableHeader title="hits">Hits</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('TkA', {
    header: () => <TableHeader title="takeaways">TkA</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('GvA', {
    header: () => <TableHeader title="giveaways">GvA</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('PIMPerG', {
    header: () => <TableHeader title="pimPerGame">PIM/G</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('PPO', {
    header: () => <TableHeader title="powerPlayOpportunities">PPO</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('PPG', {
    header: () => <TableHeader title="powerPlayGoals">PPG</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('PPPercent', {
    header: () => <TableHeader title="powerPlayPercentage">PP%</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('SHGA', {
    header: () => (
      <TableHeader title="shortHandedGoalsAgainst">SHGA</TableHeader>
    ),
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('SHO', {
    header: () => (
      <TableHeader title="shortHandedOpportunities">SHO</TableHeader>
    ),
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('PPGA', {
    header: () => <TableHeader title="powerPlayGoalsAgainst">PPGA</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
  columnHelper.accessor('PKPercent', {
    header: () => <TableHeader title="penaltyKillPercentage">PK%</TableHeader>,
    enableGlobalFilter: false,
    sortDescFirst: true,
  }),
];
