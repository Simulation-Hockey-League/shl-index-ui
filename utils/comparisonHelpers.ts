const BASE_SKATER_STATS = [
  { label: 'GP', key: 'gamesPlayed', tooltip: 'Games Played' },
  { label: 'G', key: 'goals', tooltip: 'Goals' },
  { label: 'A', key: 'assists', tooltip: 'Assists' },
  { label: 'PTS', key: 'points', tooltip: 'Points' },
  { label: '+/-', key: 'plusMinus', tooltip: 'Plus / Minus' },
  { label: 'PIM', key: 'pim', tooltip: 'Penalty Minutes' },
  { label: 'PPG', key: 'ppGoals', tooltip: 'Powerplay Goals' },
  { label: 'PPP', key: 'ppPoints', tooltip: 'Powerplay Points' },
  { label: 'SHG', key: 'shGoals', tooltip: 'Shorthanded Goals' },
  { label: 'SHP', key: 'shPoints', tooltip: 'Shorthanded Points' },
  { label: 'SOG', key: 'shotsOnGoal', tooltip: 'Shots on Goal' },
  { label: 'Hits', key: 'hits', tooltip: 'Hits' },
  { label: 'BLK', key: 'shotsBlocked', tooltip: 'Shots Blocked' },
  {
    label: 'timeOnIce',
    key: 'timeOnIce',
    tooltip: 'Time on Ice (minutes)',
    cumulative: false,
  },
];

const BASE_GOALIE_STATS = [
  { label: 'GP', key: 'gamesPlayed', tooltip: 'Games Played' },
  { label: 'W', key: 'wins', tooltip: 'Wins' },
  { label: 'L', key: 'losses', tooltip: 'Losses' },
  { label: 'OT', key: 'ot', tooltip: 'Overtime Losses' },
  { label: 'MIN', key: 'minutes', tooltip: 'Minutes Played' },
  { label: 'SA', key: 'shotsAgainst', tooltip: 'Shots Against' },
  { label: 'SV', key: 'saves', tooltip: 'Saves' },
  { label: 'GA', key: 'goalsAgainst', tooltip: 'Goals Against' },
  {
    label: 'GAA',
    key: 'gaa',
    tooltip: 'Goals Against Average',
    cumulative: false,
  },
  {
    label: 'SV%',
    key: 'savePct',
    tooltip: 'Save Percentage',
    cumulative: false,
  },
  { label: 'SO', key: 'shutouts', tooltip: 'Shutouts' },
];

export const CAREER_STAT_CONFIGS = {
  skater: [
    { label: 'Seasons', key: 'seasons', tooltip: 'Season(s)' },
    ...BASE_SKATER_STATS,
    { label: 'Fights', key: 'fights', tooltip: 'Fights' },
  ],
  goalie: [
    { label: 'Seasons', key: 'seasons', tooltip: 'Season(s)' },
    ...BASE_GOALIE_STATS,
  ],
};

export const COMPARISON_CONFIG = {
  skater: [
    ...BASE_SKATER_STATS,
    { label: 'PPA', key: 'ppAssists', tooltip: 'Powerplay Assists' },
    { label: 'SHA', key: 'shAssists', tooltip: 'Shorthanded Assists' },
    { label: 'GWG', key: 'gwg', tooltip: 'Game Winning Goals' },
  ],
  goalie: [...BASE_GOALIE_STATS],
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
