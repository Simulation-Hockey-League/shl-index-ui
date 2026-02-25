import { FormLabel } from '@chakra-ui/react';
import { Select as CommonSelect } from 'components/common/Select';

type ReportSelectorProps<T extends string> = {
  options: ReadonlyArray<T>;
  value: T;
  onChange: (value: T) => void;
  labels?: Map<T, string>;
  label?: string;
  className?: string;
};

export const ReportSelector = <T extends string>({
  options,
  value,
  onChange,
  labels,
  label = 'Report',
  className,
}: ReportSelectorProps<T>) => {
  return (
    <div className={className}>
      <FormLabel>{label}</FormLabel>
      <CommonSelect<T>
        options={options}
        selectedOption={value}
        onSelection={onChange}
        optionsMap={labels}
        className="w-full"
      />
    </div>
  );
};
