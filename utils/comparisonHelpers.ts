const BASE_SKATER_STATS = [
  { label: 'GP', key: 'gamesPlayed' },
  { label: 'G', key: 'goals' },
  { label: 'A', key: 'assists' },
  { label: 'PTS', key: 'points' },
  { label: '+/-', key: 'plusMinus' },
  { label: 'PIM', key: 'pim' },
  { label: 'PPG', key: 'ppGoals' },
  { label: 'PPP', key: 'ppPoints' },
  { label: 'SHG', key: 'shGoals' },
  { label: 'SOG', key: 'shotsOnGoal' },
  { label: 'Hits', key: 'hits' },
  { label: 'BLK', key: 'shotsBlocked' },
];

const BASE_GOALIE_STATS = [
  { label: 'GP', key: 'gamesPlayed' },
  { label: 'W', key: 'wins' },
  { label: 'L', key: 'losses' },
  { label: 'OT', key: 'ot' },
  { label: 'MIN', key: 'minutes' },
  { label: 'SA', key: 'shotsAgainst' },
  { label: 'SV', key: 'saves' },
  { label: 'GA', key: 'goalsAgainst' },
  { label: 'GAA', key: 'gaa' },
  { label: 'SV%', key: 'savePct' },
  { label: 'SO', key: 'shutouts' },
];

export const CAREER_STAT_CONFIGS = {
  skater: [
    { label: 'Seasons', key: 'seasons' },
    ...BASE_SKATER_STATS,
    { label: 'Fights', key: 'fights' },
  ],
  goalie: [{ label: 'Seasons', key: 'seasons' }, ...BASE_GOALIE_STATS],
};

export const STAT_CONFIGS = {
  skater: BASE_SKATER_STATS,
  goalie: BASE_GOALIE_STATS,
  advanced: [
    { label: 'PDO', key: 'PDO' },
    { label: 'GF/60', key: 'GF60' },
    { label: 'GA/60', key: 'GA60' },
    { label: 'SF/60', key: 'SF60' },
    { label: 'SA/60', key: 'SA60' },
    { label: 'CF%', key: 'CFPct' },
    { label: 'FF%', key: 'FFPct' },
  ],
};

export const LOWER_IS_BETTER = new Set([
  'pim',
  'giveaways',
  'fightLosses',
  'GA60',
  'SA60',
  'CA',
  'gaa',
  'goalsAgainst',
  'losses',
  'ot',
]);

export const higherIsBetter = (statKey: string): boolean =>
  !LOWER_IS_BETTER.has(statKey);

export const getBestValue = (values: number[], statKey: string): number => {
  const higher = higherIsBetter(statKey);
  return higher ? Math.max(...values) : Math.min(...values);
};
