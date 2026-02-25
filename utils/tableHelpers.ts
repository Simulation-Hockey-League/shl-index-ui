import { Table } from '@tanstack/react-table';
import { stringify } from 'csv-stringify/sync';
import { saveAs } from 'file-saver';

export const downloadTableAsCSV = <T extends Record<string, unknown>>(
  table: Table<T>,
  label?: string,
): void => {
  const tableRowData = table
    .getFilteredRowModel()
    .rows.map(({ original }) => original);

  const tableRowHeaders = Object.keys(tableRowData[0] ?? {});

  const contents = stringify([
    tableRowHeaders,
    ...tableRowData.map((row) => Object.values(row ?? {})),
  ]);

  saveAs(
    new Blob([contents], {
      type: 'text/csv;charset=utf-8',
    }),
    `${label ?? 'shl-data'}.csv`,
  );
};

export const intToOrdinalNumberString = (num: number | undefined): string => {
  if (num === null || num === undefined) return '-';
  num = Math.round(num);
  let numString = num.toString();

  if (Math.floor(num / 10) % 10 === 1) {
    return numString + 'th';
  }

  switch (num % 10) {
    case 1:
      return numString + 'st';
    case 2:
      return numString + 'nd';
    case 3:
      return numString + 'rd';
    default:
      return numString + 'th';
  }
};
