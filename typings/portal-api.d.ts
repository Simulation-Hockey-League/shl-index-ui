export type InternalPlayerAchievement = {
  playerUpdateID: number | null;
  playerName: string;
  userID: number | null;
  fhmID: number;
  leagueID: number;
  seasonID: number;
  teamID: number;
  achievement: number;
  achievementName: string;
  achievementDescription: string;
  isAward: boolean;
  won: boolean;
};

export type IndexPortalInfo = {
  playerUpdateID: number;
  leagueID: number;
  indexID: number;
  startSeason: number;
  username: string;
  userID: number;
  handedness: string;
  season: number;
  jerseyNumber: number;
  selectedImage: string;
};

type PlayerCard = {
  indexID: number;
  leagueID: number;
  card_rarity: string;
  overall: number;
  image_url: string;
};
