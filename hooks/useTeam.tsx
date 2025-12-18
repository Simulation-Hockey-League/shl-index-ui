import { useQuery } from '@tanstack/react-query';
import { TeamInfo } from 'pages/api/v2/teams';

import { query } from '../utils/query';

export const useTeam = (leagueID: number) => {
  const { data: teamData, isLoading } = useQuery<TeamInfo[]>({
    queryKey: ['teamData', leagueID],
    queryFn: () => {
      return query(`api/v2/teams?league=${leagueID}`);
    },
    refetchOnWindowFocus: false,
  });

  return {
    teamData,
    teamLoading: isLoading,
  };
};
