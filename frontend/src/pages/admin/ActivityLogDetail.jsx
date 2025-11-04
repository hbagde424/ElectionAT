import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getLogById, getLogs } from '../../api/logs';
import { Box, Chip, Divider, Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, Paper, Button, Alert } from '@mui/material';

export default function ActivityLogDetail() {
  const { id } = useParams();
  const [log, setLog] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <Typography variant="h4">Activity Log Detail</Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Summary</Typography>
            <Box sx={{ mt: 1 }}>
              <DetailRow label="Time" value={log.timestamp ? new Date(log.timestamp).toLocaleString() : ''} />
              <DetailRow label="User" value={log.userName || log.userEmail || log.userId || '-'} />
              <DetailRow label="Role" value={log.role || '-'} />
              <DetailRow label="Action" value={log.action} />
              <DetailRow label="Success" value={log.success ? 'Yes' : 'No'} />
              <DetailRow label="Remark" value={log.remark || log.message || '-'} multiline />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Context</Typography>
            <Box sx={{ mt: 1 }}>
              <DetailRow label="Entity" value={log.entity || '-'} />
              <DetailRow label="Entity ID" value={log.entityId || '-'} />
              <DetailRow label="Endpoint" value={`${log.method || ''} ${log.endpoint || ''}`} />
              <DetailRow label="IP" value={log.ip || '-'} />
              <DetailRow label="User-Agent" value={log.userAgent || '-'} multiline />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {Array.isArray(log.changes) && log.changes.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Field Changes</Typography>
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
                    <TableCell>{c.field}</TableCell>
                    <TableCell><Code value={c.from} /></TableCell>
                    <TableCell><Code value={c.to} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}

      {log.meta && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Additional Details (Meta)</Typography>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(log.meta, null, 2)}</pre>
        </Paper>
      )}

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
                <TableRow key={r._id} hover>
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
