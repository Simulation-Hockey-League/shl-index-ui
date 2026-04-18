import classnames from 'classnames';
import { useRouter } from 'next/router';

import { TeamInfo } from '../../pages/api/v1/teams';
import { getPlayerShortname } from '../../utils/playerHelpers';
import { onlyIncludeSeasonAndTypeInQuery } from '../../utils/routingHelpers';
import { Link } from '../common/Link';

export const LinePlayer = ({
  player,
  teamColors,

  className,
}: {
  player: { id: number; name: string } | undefined;
  teamColors: TeamInfo['colors'];
  className?: string;
}) => {
  const router = useRouter();

  if (!player) return null;

  return (
    <Link
      href={{
        pathname: '/[league]/player/[id]',
        query: {
          ...onlyIncludeSeasonAndTypeInQuery(router.query),
          id: player.id,
        },
      }}
      style={{
        backgroundColor: teamColors.primary,
        borderColor: teamColors.secondary,
        color: teamColors.text,
      }}
      className={classnames(
        'flex min-h-[44px] h-full items-center justify-center gap-2 overflow-hidden rounded-md border px-3 py-3 transition-opacity hover:opacity-80',
        className,
      )}
    >
      <span
        className="text-center leading-tight text-xs sm:text-base font-bold"
        style={{ color: teamColors.text }}
      >
        {getPlayerShortname(player.name)}
      </span>
    </Link>
  );
};
