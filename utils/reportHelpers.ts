export type selectTeamReport = 'base' | 'playoff' | 'stats';

export const TEAM_REPORT_LABELS = new Map<selectTeamReport, string>([
  ['base', 'Base'],
  ['playoff', 'Playoffs'],
  ['stats', 'Stats'],
]);
