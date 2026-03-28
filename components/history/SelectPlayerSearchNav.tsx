import fuzzysort from 'fuzzysort';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PlayerNames } from 'typings/api';

interface PlayerSearchNavigateProps {
  players: PlayerNames[] | undefined;
  league: string;
  placeholder?: string;
}

export function PlayerSearchNavigate({
  players,
  league,
  placeholder = 'Search for a player...',
}: PlayerSearchNavigateProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPlayers = useMemo(() => {
    if (!players || !Array.isArray(players)) return [];
    if (!searchTerm.trim()) return players.slice(0, 25);
    return fuzzysort
      .go(searchTerm, players, { key: 'Name', threshold: -1000, limit: 25 })
      .map((result) => result.obj);
  }, [players, searchTerm]);

  const handleSelect = (player: PlayerNames) => {
    setSearchTerm('');
    setIsOpen(false);
    router.push(`/${league}/player/${player.PlayerID}`);
  };

  const rect = inputRef.current?.getBoundingClientRect();

  return (
    <>
      <h2 className="pb-4 text-3xl font-bold">Find a player</h2>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          placeholder={placeholder}
          className="w-full rounded border border-secondary bg-primary px-3 py-2 text-sm focus:border-blue600 focus:outline-none"
        />
      </div>
      {isOpen &&
        rect &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: rect.bottom + 4,
              left: rect.left,
              width: rect.width,
              zIndex: 9999,
            }}
            className="max-h-60 overflow-y-auto rounded shadow-lg"
          >
            {filteredPlayers.length > 0
              ? filteredPlayers.map((player) => (
                  <button
                    key={player.PlayerID}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(player)}
                    className="w-full bg-primary px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    {player.Name}
                  </button>
                ))
              : searchTerm && (
                  <div className="rounded border bg-primary px-3 py-2 text-sm text-red200">
                    No players found
                  </div>
                )}
          </div>,
          document.body,
        )}
    </>
  );
}
