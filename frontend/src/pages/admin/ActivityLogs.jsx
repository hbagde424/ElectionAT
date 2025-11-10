import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography, Pagination, TableContainer, IconButton, Tooltip } from '@mui/material';
import { getLogs, getLogMeta } from '../../api/logs';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';

const pageSizeDefault = 20;

export default function ActivityLogs() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ actions: [], entities: [], roles: [], emails: [] });
  const [filters, setFilters] = useState({ page: 1, limit: pageSizeDefault, email: '', action: '', entity: '', success: '', from: '', to: '' });
  const [rows, setRows] = useState([]); 
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const metaRes = await getLogMeta();
        if (metaRes.success) {
          setMeta({ actions: metaRes.actions || [], entities: metaRes.entities || [], roles: metaRes.roles || [], emails: metaRes.emails || [] });
        }
      } catch {}
    })();
  }, []);

  const fetchData = async (page = filters.page) => {
    setLoading(true);
    try {
      const params = { ...filters, page };
      if (params.success === '') delete params.success;
      const res = await getLogs(params);
      if (res.success) {
        setRows(res.data || []);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.email, filters.action, filters.entity, filters.success, filters.from, filters.to]);

  const onPageChange = (_, page) => {
    setFilters((f) => ({ ...f, page }));
    fetchData(page);
  };

  const changeFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <MainCard content={false}>
      <Stack spacing={2} sx={{ p: 2 }}>
        <Typography variant="h4">Activity Logs</Typography>
        <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField label="User Email" fullWidth value={filters.email} onChange={(e) => changeFilter('email', e.target.value)} />
        </Grid>
        {/* Role filter removed as requested */}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Action</InputLabel>
            <Select label="Action" value={filters.action} onChange={(e) => changeFilter('action', e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {meta.actions.map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth>
            <InputLabel>Entity</InputLabel>
            <Select label="Entity" value={filters.entity} onChange={(e) => changeFilter('entity', e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {meta.entities.map((e) => (
                <MenuItem key={e} value={e}>{e}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={1.5}>
          <FormControl fullWidth>
            <InputLabel>Success</InputLabel>
            <Select label="Success" value={filters.success} onChange={(e) => changeFilter('success', e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value={'true'}>Success</MenuItem>
              <MenuItem value={'false'}>Failed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={1.5}>
          <TextField type="date" fullWidth label="From" InputLabelProps={{ shrink: true }} value={filters.from} onChange={(e) => changeFilter('from', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6} md={1.5}>
          <TextField type="date" fullWidth label="To" InputLabelProps={{ shrink: true }} value={filters.to} onChange={(e) => changeFilter('to', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6} md={1}>
          <Button fullWidth variant="outlined" onClick={() => { setFilters({ page: 1, limit: pageSizeDefault, email: '', action: '', entity: '', success: '', from: '', to: '' }); }}>Reset</Button>
        </Grid>
      </Grid>

        <Box sx={{ overflow: 'auto' }}>
          <ScrollX>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ backgroundColor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 150 }}>Time</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 150 }}>User</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Action</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 100 }}>Entity</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 150 }}>Entity ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 200 }}>Endpoint</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>IP Address</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 200 }}>User Agent</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 80 }}>Success</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 200 }}>Remark</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 100 }}>Changes</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 80 }}>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/activity-logs/${r._id}`)}>
                        <TableCell>{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</TableCell>
                        <TableCell>
                          <Tooltip title={r.userEmail || r.userId || ''}>
                            <span>{r.userName || r.userEmail || r.userId || '-'}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={r.action} color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>{r.entity || '-'}</TableCell>
                        <TableCell>
                          <Tooltip title={r.entityId || ''}>
                            <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              {r.entityId || '-'}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`${r.method || ''} ${r.endpoint || ''}`}>
                            <span>
                              <Chip size="small" label={r.method || 'GET'} sx={{ mr: 0.5, minWidth: 45 }} />
                              <span style={{ fontSize: '0.875rem' }}>{r.endpoint || '-'}</span>
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={r.ip || 'No IP'}>
                            <span>{r.ip || '-'}</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={r.userAgent || 'No User Agent'}>
                            <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }}>
                              {r.userAgent ? (r.userAgent.includes('Chrome') ? '🌐 Chrome' : r.userAgent.includes('Firefox') ? '🦊 Firefox' : r.userAgent.includes('Safari') ? '🧭 Safari' : r.userAgent.includes('Edge') ? '⚡ Edge' : '🖥️ Browser') : '-'}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {r.success ? <Chip size="small" color="success" label="✓ OK" /> : <Chip size="small" color="error" label="✗ FAIL" />}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={r.remark || r.message || 'No remark'}>
                            <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', whiteSpace: 'nowrap' }}>
                              {r.remark || r.message || '-'}
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {Array.isArray(r.changes) && r.changes.length > 0 ? (
                            <Chip size="small" color="info" label={`${r.changes.length} changes`} />
                          ) : r.meta ? (
                            <Chip size="small" color="secondary" label="Has Meta" variant="outlined" />
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); navigate(`/admin/activity-logs/${r._id}`); }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!rows.length && (
                      <TableRow>
                        <TableCell colSpan={12} align="center">{loading ? 'Loading…' : 'No logs found'}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
              </Table>
            </TableContainer>
          </ScrollX>
        </Box>

        {pages > 1 && (
          <Stack direction="row" justifyContent="center">
            <Pagination page={filters.page} onChange={onPageChange} count={pages} color="primary" />
          </Stack>
        )}
      </Stack>
    </MainCard>
  );
}
