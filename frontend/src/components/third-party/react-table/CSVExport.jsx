import PropTypes from 'prop-types';
// material-ui
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';

// third-party
import { CSVLink } from 'react-csv';
import { useState, useCallback } from 'react';
import { requestCsvOtp, verifyCsvOtp } from '../../../api/otp';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Typography } from '@mui/material';

import { DocumentDownload } from 'iconsax-react';

// ==============================|| CSV EXPORT ||============================== //

export default function CSVExport({ data, filename, headers }) {
  const theme = useTheme();
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maskedDest, setMaskedDest] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const startOtpFlow = useCallback(async (e) => {
    e.preventDefault();
    if (verified) return; // Already verified, allow natural link click
    setLoading(true);
    setError('');
    try {
      const res = await requestCsvOtp();
      if (res.success) {
        setRequestId(res.requestId);
        setMaskedDest(res.to);
        setOtpDialogOpen(true);
      } else {
        setError(res.message || 'Failed to request OTP');
      }
    } catch (err) {
      setError(err?.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  }, [verified]);

  const verifyAndDownload = async () => {
    if (!otpCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await verifyCsvOtp({ requestId, otp: otpCode.trim() });
      if (res.success) {
        setVerified(true);
        setOtpDialogOpen(false);
        // Programmatically trigger download now that verified
        setTimeout(() => {
          const linkEl = document.getElementById(`csv-link-${requestId}`);
          if (linkEl) linkEl.click();
        }, 100);
      } else {
        setError(res.message || 'OTP verification failed');
      }
    } catch (err) {
      setError(err?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hidden / gated CSV link - only works once verified */}
      <CSVLink
        id={`csv-link-${requestId || 'pending'}`}
        data={verified ? data : []}
        filename={filename}
        headers={headers}
        onClick={(e) => {
          if (!verified) {
            startOtpFlow(e);
          }
        }}
      >
        <Tooltip title={verified ? 'Download CSV' : 'CSV Export (OTP Required)'}>
          <DocumentDownload
            size={28}
            variant="Outline"
            style={{ color: theme.palette.text.secondary, marginTop: 4, marginRight: 4, marginLeft: 4, cursor: 'pointer' }}
          />
        </Tooltip>
      </CSVLink>

      <Dialog open={otpDialogOpen} onClose={() => !loading && setOtpDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Enter OTP to Download CSV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            OTP sent to Super Admin mobile: <strong>{maskedDest || '**********'}</strong>
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="OTP"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            disabled={loading}
            inputProps={{ maxLength: 6 }}
            sx={{ mt: 1 }}
          />
          {error && (
            <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOtpDialogOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={verifyAndDownload} variant="contained" disabled={loading || !otpCode.trim()}>
            {loading ? <CircularProgress size={20} /> : 'Verify & Download'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

CSVExport.propTypes = { data: PropTypes.array, filename: PropTypes.string, headers: PropTypes.any };

