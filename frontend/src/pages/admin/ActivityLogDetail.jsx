import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLogById, getLogs } from '../../api/logs';
import { Box, Chip, Divider, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, Paper, Button, Alert, IconButton, Tooltip, Accordion, AccordionSummary, AccordionDetails, Avatar, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';

export default function ActivityLogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rawOpen, setRawOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getLogById(id);
        if (res.success) setLog(res.data);
        else setError(res.message || 'Failed to load log');
      } catch (e) {
        setError((e && e.message) || 'Failed to load log');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!log) return;
      const params = {};
      if (log.userId) params.userId = log.userId;
      else if (log.userEmail) params.email = log.userEmail;
      params.limit = 50;
      const res = await getLogs(params);
      if (res.success) setUserLogs(res.data || []);
    })();
  }, [log]);

  if (loading) return <Typography sx={{ p: 2 }}>Loading…</Typography>;
  if (error) return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Alert severity="error">{String(error)}</Alert>
      <Button variant="outlined" onClick={() => window.location.reload()}>Retry</Button>
    </Stack>
  );
  if (!log) return <Typography sx={{ p: 2 }}>No data found.</Typography>;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // ignore
    }
  };

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <IconButton onClick={() => navigate(-1)} size="small" title="Back">
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h4">Activity Log Detail</Typography>
          <Typography variant="body2" color="text.secondary">{log.action} • {log.entity || '-'} • {log.entityId || ''}</Typography>
        </Box>
        <Box sx={{ marginLeft: 'auto' }}>
          <Tooltip title="View raw JSON">
            <Button size="small" startIcon={<OpenInNewIcon />} sx={{ mr: 1 }} onClick={() => setRawOpen(true)}>View Raw</Button>
          </Tooltip>
          <Tooltip title="Copy entire log as JSON">
            <IconButton size="small" onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item>
            <Avatar sx={{ bgcolor: 'primary.main' }}>{(log.userName && log.userName[0]) || (log.userEmail && log.userEmail[0]) || '?'} </Avatar>
          </Grid>
          <Grid item xs>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6">{log.userName || log.userEmail || log.userId || 'Unknown User'}</Typography>
                <Typography variant="caption" color="text.secondary">{log.role || '—'} • {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</Typography>
              </Box>
              <Box>
                <Chip label={log.success ? 'Success' : 'Failed'} color={log.success ? 'success' : 'error'} sx={{ mr: 1 }} />
                <Chip label={log.action} variant="outlined" />
              </Box>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={1}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Summary</Typography>
                <DetailRow label="Remark" value={log.remark || log.message || '-'} multiline copyText={log.remark || log.message || ''} />
                <DetailRow label="Endpoint" value={`${log.method || ''} ${log.endpoint || ''}`} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Context</Typography>
                <DetailRow label="Entity" value={log.entity || '-'} />
                <DetailRow label="Entity ID" value={log.entityId || '-'} />
                <DetailRow label="IP" value={log.ip || '-'} />
                <DetailRow label="User-Agent" value={log.userAgent || '-'} multiline />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {Array.isArray(log.changes) && log.changes.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Field Changes ({log.changes.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {log.changes.map((c, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{c.field}</TableCell>
                      <TableCell><Box component="span" sx={{ display: 'block', bgcolor: '#fff5f5', color: '#b71c1c', p: 1, borderRadius: 1 }}><Code value={c.from} /></Box></TableCell>
                      <TableCell><Box component="span" sx={{ display: 'block', bgcolor: '#f1fff4', color: '#1b5e20', p: 1, borderRadius: 1 }}><Code value={c.to} /></Box></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {log.meta && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6">Additional Details (Meta)</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Box sx={{ width: '100%' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#fafafa', padding: 12, borderRadius: 6 }}>{JSON.stringify(log.meta, null, 2)}</pre>
              </Box>
              <Box>
                <Tooltip title="Copy meta JSON">
                  <IconButton size="small" onClick={() => copyToClipboard(JSON.stringify(log.meta, null, 2))}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}

      <Dialog open={rawOpen} onClose={() => setRawOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          Raw Log JSON
          <IconButton aria-label="close" onClick={() => setRawOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0 }}>{JSON.stringify(log, null, 2)}</Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => copyToClipboard(JSON.stringify(log, null, 2))} startIcon={<ContentCopyIcon />}>Copy</Button>
          <Button onClick={() => setRawOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>All Activity by this User</Typography>
        <Box sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Entity ID</TableCell>
                <TableCell>Endpoint</TableCell>
                <TableCell>Success</TableCell>
                <TableCell>Remark</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userLogs.map((r) => (
                <TableRow key={r._id} hover onClick={() => navigate(`/admin/activity-logs/${r._id}`)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</TableCell>
                  <TableCell>{r.action}</TableCell>
                  <TableCell>{r.entity || '-'}</TableCell>
                  <TableCell>{r.entityId || '-'}</TableCell>
                  <TableCell>{r.method} {r.endpoint}</TableCell>
                  <TableCell>{r.success ? <Chip size="small" color="success" label="OK" /> : <Chip size="small" color="error" label="FAIL" />}</TableCell>
                  <TableCell sx={{ maxWidth: 480, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.remark || r.message || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Stack>
  );
}

function DetailRow({ label, value, multiline }) {
  return (
    <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
      <Typography sx={{ fontWeight: 600, minWidth: 120 }}>{label}:</Typography>
      {multiline ? (
        <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</Typography>
      ) : (
        <Typography>{value}</Typography>
      )}
    </Stack>
  );
}

function Code({ value }) {
  let text;
  try {
    text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  } catch (e) {
    text = String(value);
  }
  return <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</pre>;
}
