import { Spinner } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import classnames from 'classnames';
import { useEffect, useRef, useState } from 'react';

import { useSeason } from '../../hooks/useSeason';
import { PlayoffsRound } from '../../pages/api/v1/standings/playoffs';
import { League, leagueNameToId } from '../../utils/leagueHelpers';
import { query } from '../../utils/query';

import { PlayoffBracketSeries } from './PlayoffBracketSeries';
import { hasMedalGames } from './shared';

export const SingleBracket = ({
  data,
  league,
  className,
}: {
  data: PlayoffsRound[];
  league: League;
  className?: string;
}) => {
  const { season } = useSeason();
  const { data: teamData, isLoading } = useQuery({
    queryKey: ['teamData', league, season],
    queryFn: () => {
      const seasonParam = season ? `&season=${season}` : '';
      return query(
        `api/v1/teams?league=${leagueNameToId(league)}${seasonParam}`,
      );
    },
  });

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isScaled, setIsScaled] = useState(false);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    const recalc = () => {
      if (!outerRef.current || !innerRef.current) return;
      const outerW = outerRef.current.offsetWidth;
      const innerW = innerRef.current.scrollWidth;
      const innerH = innerRef.current.scrollHeight * 1.25;
      const nextScale = innerW > outerW ? outerW / innerW : 1;
      setScale(nextScale);
      setScaledHeight(innerH * nextScale);
      setIsScaled(nextScale < 1);
    };

    const raf = requestAnimationFrame(recalc);
    const ro = new ResizeObserver(recalc);
    if (outerRef.current) ro.observe(outerRef.current);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [data, teamData]);

  if (isLoading || !teamData || !data) {
    return (
      <div className={className}>
        <Spinner size="xl" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className={classnames(
          'mt-6 flex h-full w-11/12 items-center justify-center text-center text-xl font-bold',
          className,
        )}
      >
        Playoffs bracket is not yet available
      </div>
    );
  }

  return (
    <div
      ref={outerRef}
      className={classnames(
        'w-full',
        isScaled ? 'overflow-hidden' : '',
        className,
      )}
      style={isScaled ? { height: scaledHeight ?? 'auto' } : undefined}
    >
      <div
        ref={innerRef}
        className="mt-6 flex min-w-max flex-row items-center justify-center text-center"
        style={
          isScaled
            ? { transform: `scale(${scale})`, transformOrigin: 'top left' }
            : undefined
        }
      >
        {data.map((round, i) => {
          const isLastRound = i === data.length - 1 && i >= 2;
          const isMedalLeague = hasMedalGames(league);

          return (
            <div className="flex w-[270px] flex-col items-center" key={i}>
              <h2 className="mb-2.5 text-2xl font-bold">
                {isMedalLeague && isLastRound
                  ? round.length === 2
                    ? 'Medal Games'
                    : 'Gold Medal Game'
                  : round.length === 1
                    ? 'Finals'
                    : `Round ${i + 1}`}
              </h2>
              {round.map((series, j) => (
                <PlayoffBracketSeries
                  key={`${series.team1.id}${series.team2.id}`}
                  series={series}
                  teamData={teamData}
                  league={league}
                  medalContext={
                    isMedalLeague && isLastRound
                      ? j === 0
                        ? 'gold'
                        : 'bronze'
                      : undefined
                  }
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
