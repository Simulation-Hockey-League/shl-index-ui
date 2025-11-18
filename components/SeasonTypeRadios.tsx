import {
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';

type Props = {
  value: 'pre' | 'regular' | 'playoffs';
  onChange: (value: 'pre' | 'regular' | 'playoffs') => void;
};

export function SeasonTypeRadios({ value, onChange }: Props) {
  return (
    <FormControl>
      <FormLabel>Season Type</FormLabel>
      <RadioGroup
        onChange={(next) => onChange(next as Props['value'])}
        value={value}
      >
        <Stack direction="row" spacing={3} flexWrap="wrap">
          <Radio value="regular" size="sm">
            <span className="text-sm">Regular Season</span>
          </Radio>
          <Radio value="pre" size="sm">
            <span className="text-sm">Pre-Season</span>
          </Radio>
          <Radio value="playoffs" size="sm">
            <span className="text-sm">Playoffs</span>
          </Radio>
        </Stack>
      </RadioGroup>
    </FormControl>
  );
}
