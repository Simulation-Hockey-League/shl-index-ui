import classnames from 'classnames';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import tinycolor from 'tinycolor2';

import { PlayoffsSeries } from '../../pages/api/v1/standings/playoffs';
import { TeamInfo } from '../../pages/api/v1/teams';
import { isMainLeague, League } from '../../utils/leagueHelpers';
import { onlyIncludeSeasonAndTypeInQuery } from '../../utils/routingHelpers';
import { Link } from '../common/Link';
import { TeamLogo } from '../TeamLogo';

import { LEAGUE_WIN_CONDITION } from './shared';

enum SeriesWinnerState {
  AWAY = 'away',
  HOME = 'home',
  NOWINNER = 'none',
}

const TeamLine = ({
  teamInfo,
  lostSeries,
  league,
  shouldUseTeamShortName,
  medal,
}: {
  teamInfo: {
    id: number;
    abbr: string;
    name: string;
    wins: number;
    color: {
      background: string;
      isDark: boolean;
    };
  };
  lostSeries: boolean;
  league: League;
  shouldUseTeamShortName?: boolean;
  medal?: string;
}) => {
  const router = useRouter();

  return (
    <Link
      href={{
        pathname: teamInfo.id !== -1 ? '/[league]/team/[id]' : router.pathname,
        query: {
          ...onlyIncludeSeasonAndTypeInQuery(router.query),
          ...(teamInfo.id !== -1 ? { id: teamInfo.id } : {}),
        },
      }}
      className={classnames(
        'flex h-[55px] w-full items-center text-lg font-semibold tracking-wider hover:opacity-80',
        lostSeries && 'opacity-50',
      )}
      style={{
        backgroundColor: teamInfo.color.background,
      }}
    >
      {teamInfo.abbr === '' ? (
        <div />
      ) : (
        <TeamLogo
          league={league}
          teamAbbreviation={teamInfo.abbr}
          className="aspect-square w-[55px] min-w-[55px] p-[5px]"
        />
      )}
      <span
        className={classnames(
          'pr-[5px]',
          !shouldUseTeamShortName && 'truncate',
          teamInfo.color.isDark ? 'text-grey100' : 'text-grey900',
        )}
      >
        {shouldUseTeamShortName ? teamInfo.abbr : teamInfo.name}
      </span>
      {medal && (
        <div
          className={classnames(
            'mx-1 ml-auto size-3 shrink-0 rounded-full',
            medal === 'gold' && 'bg-yellow500',
            medal === 'silver' && 'bg-grey400',
            medal === 'bronze' && 'bg-bronze500',
          )}
        />
      )}
      <div
        className={classnames(
          'flex h-full w-5 items-center justify-center bg-grey900/50 px-[15px] font-mont text-2xl font-bold text-grey100',
          !medal && 'ml-auto',
        )}
      >
        {teamInfo.wins !== -1 && teamInfo.wins}
      </div>
    </Link>
  );
};

export const PlayoffBracketSeries = ({
  series,
  league,
  teamData,
  shouldUseTeamShortName = false,
  medalContext,
}: {
  series: Omit<PlayoffsSeries, 'league' | 'season'>;
  league: League;
  teamData: TeamInfo[];
  shouldUseTeamShortName?: boolean;
  medalContext?: 'gold' | 'bronze';
}) => {
  const primaryColors = useMemo(
    () => ({
      away:
        teamData.find((team) => team.id === series.team1.id)?.colors.primary ||
        '#DDD',
      home:
        teamData.find((team) => team.id === series.team2.id)?.colors.primary ||
        '#BBB',
    }),
    [series, teamData],
  );

  const awayTeamInfo = useMemo(
    () => ({
      id: series.team1.id ?? -1,
      abbr: series.team1.abbr ?? '',
      name:
        (isMainLeague(league) ? series.team1.name : series.team1.nickname) ??
        'Away Team',
      wins: series.team1.wins ?? -1,
      color: {
        background: primaryColors.away,
        isDark: tinycolor(primaryColors.away).isDark(),
      },
    }),
    [league, primaryColors.away, series.team1],
  );

  const homeTeamInfo = useMemo(
    () => ({
      id: series.team2.id ?? -1,
      abbr: series.team2.abbr ?? '',
      name:
        (isMainLeague(league) ? series.team2.name : series.team2.nickname) ??
        'Home Team',
      wins: series.team2.wins ?? -1,
      color: {
        background: primaryColors.home,
        isDark: tinycolor(primaryColors.home).isDark(),
      },
    }),
    [league, primaryColors.home, series.team2],
  );

  const seriesWinner = useMemo(() => {
    if (awayTeamInfo.wins === LEAGUE_WIN_CONDITION[league])
      return SeriesWinnerState.AWAY;
    if (homeTeamInfo.wins === LEAGUE_WIN_CONDITION[league])
      return SeriesWinnerState.HOME;
    return SeriesWinnerState.NOWINNER;
  }, [awayTeamInfo.wins, homeTeamInfo.wins, league]);

  const [awayMedal, homeMedal] = useMemo(() => {
    if (!medalContext || seriesWinner === SeriesWinnerState.NOWINNER)
      return [undefined, undefined];

    if (medalContext === 'gold') {
      return seriesWinner === SeriesWinnerState.AWAY
        ? ['gold', 'silver']
        : ['silver', 'gold'];
    }

    return seriesWinner === SeriesWinnerState.AWAY
      ? ['bronze', undefined]
      : [undefined, 'bronze'];
  }, [seriesWinner, medalContext]);

  return (
    <div
      className={classnames(
        'mb-1.5 flex flex-col items-center',
        shouldUseTeamShortName ? 'w-[160px] p-2.5' : 'w-[230px] p-5',
      )}
    >
      {medalContext && (
        <span
          className={classnames(
            'mb-1 text-xs font-bold uppercase tracking-widest ',
            medalContext === 'gold' ? 'text-yellow500' : 'text-bronze500',
          )}
        >
          {medalContext === 'gold' ? 'Gold Medal Game' : 'Bronze Medal Game'}
        </span>
      )}
      <TeamLine
        league={league}
        lostSeries={seriesWinner === SeriesWinnerState.HOME}
        teamInfo={awayTeamInfo}
        shouldUseTeamShortName={shouldUseTeamShortName}
        medal={awayMedal}
      />
      <TeamLine
        league={league}
        lostSeries={seriesWinner === SeriesWinnerState.AWAY}
        teamInfo={homeTeamInfo}
        shouldUseTeamShortName={shouldUseTeamShortName}
        medal={homeMedal}
      />
    </div>
  );
};
