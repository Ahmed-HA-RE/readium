'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { GoSearch } from 'react-icons/go';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

const SEARCH_DEBOUNCE_MS = 300;

type SearchInputProps = {
  defaultValue: string;
  onSearch: (value: string) => void;
  placeholder: string;
  className?: string;
};

const SearchInput = ({
  defaultValue,
  onSearch,
  placeholder,
  className,
}: SearchInputProps) => {
  const [value, setValue] = useState(defaultValue);
  const debouncedSearch = useDebouncedCallback(onSearch, SEARCH_DEBOUNCE_MS);

  return (
    <InputGroup className={className}>
      <InputGroupInput
        type='search'
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          debouncedSearch(event.target.value.trim());
        }}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <InputGroupAddon>
        <GoSearch />
      </InputGroupAddon>
    </InputGroup>
  );
};

export default SearchInput;
