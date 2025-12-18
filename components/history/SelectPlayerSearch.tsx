import { FormControl, FormLabel } from '@chakra-ui/react';
import fuzzysort from 'fuzzysort';
import { PlayerNames } from 'pages/api/v2/player/playerSearch';
import { useMemo, useState } from 'react';

interface PlayerSearchInputProps {
  players: PlayerNames[] | undefined;
  label: string;
  placeholder?: string;
  value: number | null;
  onChange: (playerId: number | null, playerName: string | null) => void;
  availableSeasons?: number[];
  selectedSeason?: number | null;
  onSeasonChange?: (season: number | null) => void;
}

export function PlayerSearchInput({
  players,
  label,
  placeholder = 'Search for a player...',
  value,
  onChange,
  availableSeasons = [],
  selectedSeason,
  onSeasonChange,
}: PlayerSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedPlayer = useMemo(() => {
    if (!value || !players) return null;
    return players.find((p) => p.PlayerID === value);
  }, [value, players]);

  const filteredPlayers = useMemo(() => {
    if (!players || !Array.isArray(players)) return [];
    if (!searchTerm.trim()) return players.slice(0, 25);

    return fuzzysort
      .go(searchTerm, players, {
        key: 'Name',
        threshold: -1000,
        limit: 25,
      })
      .map((result) => result.obj);
  }, [players, searchTerm]);

  const handleSelect = (player: PlayerNames) => {
    onChange(player.PlayerID, player.Name);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null, null);
    setSearchTerm('');
    onSeasonChange?.(null);
  };

  return (
    <div className="space-y-3">
      <FormControl>
        <FormLabel>{label}</FormLabel>
        <div className="relative">
          {selectedPlayer ? (
            <div className="flex justify-between rounded border border-primary px-3 py-2">
              <span className="text-base">{selectedPlayer.Name}</span>
              <button
                onClick={handleClear}
                className="ml-2 text-red200 hover:text-red200/20"
                aria-label="Clear selection"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                placeholder={placeholder}
                className="w-full rounded border border-secondary bg-primary px-3 py-2 text-sm focus:border-blue600 focus:outline-none"
              />
              {isOpen && filteredPlayers.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded">
                  {filteredPlayers.map((player) => (
                    <button
                      key={player.PlayerID}
                      onClick={() => handleSelect(player)}
                      className="w-full bg-primary px-3 py-2 text-left text-sm hover:bg-secondary"
                    >
                      {player.Name}
                    </button>
                  ))}
                </div>
              )}
              {isOpen && searchTerm && filteredPlayers.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded border bg-primary px-3 py-2 text-sm text-red200">
                  No players found
                </div>
              )}
            </>
          )}
        </div>
      </FormControl>
      {selectedPlayer && availableSeasons.length > 0 && onSeasonChange && (
        <div>
          <FormLabel>Season</FormLabel>
          <select
            value={selectedSeason || ''}
            onChange={(e) =>
              onSeasonChange(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full rounded border border-secondary bg-primary px-3 py-2 text-sm focus:border-blue600 focus:outline-none"
          >
            <option value="">Select a Season</option>
            {availableSeasons.map((season) => (
              <option key={season} value={season}>
                Season {season}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
