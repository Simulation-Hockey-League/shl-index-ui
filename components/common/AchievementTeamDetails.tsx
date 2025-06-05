import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Team } from 'typings/api';
import { InternalPlayerAchievement } from 'typings/portal-api';
import { query } from 'utils/query';

export const AchievementTeamDetail = ({
  achievement,
}: {
  achievement?: InternalPlayerAchievement;
  className?: string;
}) => {
  const validSeasonValue = useMemo(() => {
    if (!achievement?.seasonID) return 53;

    switch (achievement?.leagueID) {
      case 0:
        return achievement.seasonID;

      case 1:
        if (achievement.seasonID < 10) {
          return 10;
        }
        return achievement.seasonID;

      case 2:
      case 3:
        return (achievement.seasonID ?? 0) > 52 ? achievement.seasonID : 53;

      default:
        return 53;
    }
  }, [achievement?.seasonID, achievement?.leagueID]);
  const { data, isLoading: teamLoading } = useQuery<Team>({
    queryKey: [
      'achievementTeamQuery',
      achievement?.teamID,
      achievement?.leagueID,
      validSeasonValue,
    ],
    queryFn: async (): Promise<Team> =>
      await query(
        `api/v1/teams/${achievement?.teamID}?league=${achievement?.leagueID}&season=${validSeasonValue}`,
      ),
  });

  if (!data) return null;
  return (
    <div className="flex flex-nowrap items-center align-middle">
      {!teamLoading ? data.abbreviation : null}
    </div>
  );
};
