import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

// material-ui
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ==============================|| TABLE PAGINATION ||============================== //

export default function TablePagination({ table, getPageCount, setPageIndex, setPageSize, getState, initialPageSize }) {
  const [open, setOpen] = useState(false);
  let options = [10, 25, 50, 100];

  if (initialPageSize) {
    options = [...options, initialPageSize]
      .filter((item, index) => [...options, initialPageSize].indexOf(item) === index)
      .sort(function (a, b) {
        return a - b;
      });
  }

  // Only set initial page size if it hasn't been set before
  // Support passing the full `table` object or individual handlers for backwards compatibility
  const _getState = table ? () => table.getState() : getState;
  const _setPageSize = table ? (size) => table.setPageSize(size) : setPageSize;
  const _setPageIndex = table ? (index) => table.setPageIndex(index) : setPageIndex;
  const _getPageCount = table ? () => table.getPageCount() : getPageCount;

  useEffect(() => {
    if (_getState && _getState().pagination?.pageSize === undefined) {
      _setPageSize && _setPageSize(initialPageSize || 10);
    }
  }, [initialPageSize, _setPageSize, _getState]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleChangePagination = (event, value) => {
    _setPageIndex && _setPageIndex(value - 1);
  };

  const handleChange = (event) => {
    const newSize = Number(event.target.value);
    _setPageSize && _setPageSize(newSize);
    _setPageIndex && _setPageIndex(0); // Reset to first page when changing page size
  };

  return (
    <Grid spacing={1} container alignItems="center" justifyContent="space-between" sx={{ width: 'auto' }}>
      <Grid item>
        <Stack direction="row" spacing={1} alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="secondary">
              Row per page
            </Typography>
            <FormControl sx={{ m: 1 }}>
              <Select
                id="demo-controlled-open-select"
                open={open}
                onClose={handleClose}
                onOpen={handleOpen}
                value={_getState ? _getState().pagination.pageSize : ''}
                onChange={handleChange}
                size="small"
                sx={{ '& .MuiSelect-select': { py: 0.75, px: 1.25 } }}
              >
                {options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Typography variant="caption" color="secondary">
            Go to
          </Typography>
            <TextField
            size="small"
            type="number"
              value={_getState ? _getState().pagination.pageIndex + 1 : 0}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
                _setPageIndex && _setPageIndex(page);
            }}
            sx={{ '& .MuiOutlinedInput-input': { py: 0.75, px: 1.25, width: 36 } }}
          />
        </Stack>
      </Grid>
      <Grid item sx={{ mt: { xs: 2, sm: 0 } }}>
        <Pagination
          sx={{ '& .MuiPaginationItem-root': { my: 0.5 } }}
          count={_getPageCount ? _getPageCount() : 0}
          page={_getState ? _getState().pagination.pageIndex + 1 : 1}
          onChange={handleChangePagination}
          color="primary"
          variant="combined"
          showFirstButton
          showLastButton
        />
      </Grid>
    </Grid>
  );
}

TablePagination.propTypes = {
  table: PropTypes.object,
  getPageCount: PropTypes.func,
  setPageIndex: PropTypes.func,
  setPageSize: PropTypes.func,
  getState: PropTypes.func,
  initialPageSize: PropTypes.number
};

