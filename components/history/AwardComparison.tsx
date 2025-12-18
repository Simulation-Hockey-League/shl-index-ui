import { useMemo } from 'react';
import { InternalPlayerAchievement } from 'typings/portal-api';

interface AwardsComparisonProps {
  players: Array<{
    name: string;
    awards: InternalPlayerAchievement[] | undefined;
  }>;
}

export function AwardsComparison({ players }: AwardsComparisonProps) {
  return (
    <div className="rounded border border-primary p-4">
      <h3 className="mb-4 text-center text-lg font-bold">Awards</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {players.map((player, idx) => (
          <PlayerAwardsList
            key={idx}
            playerName={player.name}
            awards={player.awards}
          />
        ))}
      </div>
    </div>
  );
}

interface PlayerAwardsListProps {
  playerName: string;
  awards: InternalPlayerAchievement[] | undefined;
}

function PlayerAwardsList({ playerName, awards }: PlayerAwardsListProps) {
  const { wonAwards, nomAwards } = useMemo(() => {
    const won: typeof awards = [];
    const nom: typeof awards = [];

    awards?.forEach((award) => {
      if (award.won) won.push(award);
      else nom.push(award);
    });

    return { wonAwards: won, nomAwards: nom };
  }, [awards]);

  return (
    <div>
      <h4 className="mb-2 font-semibold">{playerName}</h4>
      {wonAwards.length > 0 || nomAwards.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {wonAwards.map((award) => (
            <li
              key={`${award.achievementName}-${award.seasonID}`}
              className="flex items-start gap-2"
            >
              <span className="text-green500">○</span>
              <div>
                <div>{award.achievementName}</div>
                <div className="text-xs text-grey600">
                  Season {award.seasonID}
                </div>
              </div>
            </li>
          ))}
          {nomAwards.map((award) => (
            <li
              key={`${award.achievementName}-${award.seasonID}`}
              className="flex items-start gap-2"
            >
              <span className="text-blue600">○</span>
              <div>
                <div>Nom - {award.achievementName}</div>
                <div className="text-xs text-grey600">
                  Season {award.seasonID}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-primary">No awards</p>
      )}
    </div>
  );
}
