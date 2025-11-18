import { getBestValue } from 'utils/comparisonHelpers';

interface ComparisonTableProps {
  players: Array<{
    name: string;
    data: any;
  }>;
  stats: Array<{ label: string; key: string }>;
  getValueFn?: (data: any, key: string) => any;
}

export function ComparisonTable({
  players,
  stats,
  getValueFn = (data, key) => data[key],
}: ComparisonTableProps) {
  const comparisonRow = (label: string, key: string) => {
    const values = players.map((player) => {
      const val = getValueFn(player.data, key);
      return typeof val === 'string' ? parseFloat(val) : val;
    });

    if (values.some((val) => val === undefined || isNaN(val))) return null;

    const bestValue = getBestValue(values, key);

    return (
      <tr key={key} className="border-b border-primary/40 text-center">
        {players.flatMap((player, idx) => {
          const val = getValueFn(player.data, key);
          const numVal = typeof val === 'string' ? parseFloat(val) : val;

          return [
            <td
              key={idx}
              className={`px-3 py-2 ${
                numVal === bestValue
                  ? 'font-bold text-green500'
                  : 'text-primary'
              }`}
            >
              {val}
            </td>,
            idx < players.length - 1 && (
              <td key={`stat-${idx}`} className="px-3 py-2 font-semibold">
                {label}
              </td>
            ),
          ];
        })}
      </tr>
    );
  };

  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr className="border-b-2 border-primary text-center">
          {players.flatMap((player, idx) => [
            <th key={idx} className="p-3 font-bold" style={{ width: '30%' }}>
              {player.name}
              {player.data.teamAbbr && (
                <div className="mx-auto mt-1 max-w-[140px] break-words text-xs text-primary">
                  ({player.data.teamAbbr})
                </div>
              )}
            </th>,
            idx < players.length - 1 && (
              <th key={`stat-${idx}`} className="p-3 font-bold">
                Stat
              </th>
            ),
          ])}
        </tr>
      </thead>
      <tbody>{stats.map((stat) => comparisonRow(stat.label, stat.key))}</tbody>
    </table>
  );
}
