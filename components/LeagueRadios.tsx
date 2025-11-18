import {
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';

type League = 'shl' | 'smjhl' | 'iihf' | 'wjc';

interface LeagueRadiosProps {
  value: League;
  onChange: (league: League) => void;
}

export function LeagueRadios({ value, onChange }: LeagueRadiosProps) {
  return (
    <FormControl>
      <FormLabel className="mb-2 text-sm md:text-lg">League</FormLabel>
      <RadioGroup onChange={(val) => onChange(val as League)} value={value}>
        <Stack direction="row" spacing={5} flexWrap="wrap">
          <Radio value="shl">
            <span className="text-sm">SHL</span>
          </Radio>
          <Radio value="smjhl">
            <span className="text-sm">SMJHL</span>
          </Radio>
          <Radio value="iihf">
            <span className="text-sm">IIHF</span>
          </Radio>
          <Radio value="wjc">
            <span className="text-sm">WJC</span>
          </Radio>
        </Stack>
      </RadioGroup>
    </FormControl>
  );
}
