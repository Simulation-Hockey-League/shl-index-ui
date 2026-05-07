import { PlayerCard } from 'typings/portal-api';

import { CardPreview } from './CardPreview';

export const PlayerCards = ({ cards }: { cards: PlayerCard[] }) => (
  <div className="flex flex-col items-start gap-3">
    {cards.length > 0 && (
      <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-6">
        {cards.map((card, i) => (
          <CardPreview key={i} src={card.image_url} />
        ))}
      </div>
    )}
  </div>
);
