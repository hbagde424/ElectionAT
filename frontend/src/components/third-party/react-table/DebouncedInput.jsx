import PropTypes from 'prop-types';
import { useEffect, useState, useRef } from 'react';

// material-ui
import OutlinedInput from '@mui/material/OutlinedInput';

// assets
import { SearchNormal } from 'iconsax-react';

// ==============================|| FILTER - INPUT ||============================== //

export default function DebouncedInput({
  value: initialValue,
  onFilterChange,
  debounce = 500,
  size,
  startAdornment = <SearchNormal size="18" />,
  ...props
}) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  const handleInputChange = (event) => setValue(event.target.value);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFilterChange(value);
    }, debounce);

    // Maintain focus after the debounce
    if (inputRef.current && document.activeElement === inputRef.current) {
      const position = inputRef.current.selectionStart;
      setTimeout(() => {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(position, position);
      }, 0);
    }

    return () => clearTimeout(timeout);
    // eslint-disable-next-line
  }, [value]);

  return (
    <OutlinedInput
      {...props}
      inputRef={inputRef}
      value={value}
      onChange={handleInputChange}
      autoFocus
      sx={{ minWidth: 100 }}
      {...(startAdornment && { startAdornment })}
      {...(size && { size })}
    />
  );
}

DebouncedInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onFilterChange: PropTypes.func,
  debounce: PropTypes.number,
  startAdornment: PropTypes.any,
  SearchNormal: PropTypes.any,
  size: PropTypes.string,
  props: PropTypes.any
};

