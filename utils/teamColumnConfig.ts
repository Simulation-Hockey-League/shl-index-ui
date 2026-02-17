import * as cols from 'components/tables/history/TeamHistoryColumns';

type ColumnConfig = {
  getColumns: (params: {
    league: number;
    router: any;
    grouped: boolean;
    isInternational: boolean;
  }) => any[];
};

export const REPORT_CONFIGURATIONS: Record<string, ColumnConfig> = {
  base: {
    getColumns: ({ league, router, grouped }) => {
      const teamInfoGroup = {
        header: '',
        id: 'team-table-info',
        columns: [cols.getTeamColumn(league, router)],
      };

      const mainColumns = [
        cols.getSeasonColumn(),
        ...cols.getBaseRecordColumns(),
        ...(grouped ? [] : cols.getBaseStandingsColumns()),
      ];

      return [
        teamInfoGroup,
        {
          header: '',
          id: 'team-table-main',
          columns: mainColumns,
        },
      ];
    },
  },

  playoff: {
    getColumns: ({ league, router, grouped, isInternational }) => {
      const teamInfoGroup = {
        header: '',
        id: 'team-table-info',
        columns: [cols.getTeamColumn(league, router)],
      };

      const playoffColumns = grouped
        ? isInternational
          ? cols.getPlayoffInternationalColumns()
          : cols.getPlayoffGroupedColumns(league)
        : cols.getPlayoffUngroupedColumns();

      const mainColumns = [cols.getSeasonColumn(), ...playoffColumns];

      return [
        teamInfoGroup,
        {
          header: '',
          id: 'team-table-main',
          columns: mainColumns,
        },
      ];
    },
  },

  stats: {
    getColumns: ({ league, router }) => {
      const teamInfoGroup = {
        header: '',
        id: 'team-table-info',
        columns: [cols.getTeamColumn(league, router)],
      };

      const teamSeasonGroup = {
        header: '',
        id: 'team-table-season',
        columns: [cols.getSeasonColumn()],
      };

      const statsGroup = {
        header: '',
        id: 'team-table-stats',
        columns: cols.getStatsColumns(),
      };

      return [
        teamInfoGroup,
        teamSeasonGroup,
        {
          header: '',
          id: 'team-table-main',
        },
        statsGroup,
      ];
    },
  },
};
