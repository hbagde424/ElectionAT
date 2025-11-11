import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Typography } from '@mui/material';

export default function OtpDialog({ open, loading, maskedDest, otpCode, error, onOtpChange, onVerify, onClose }) {
  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="xs" fullWidth>
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
          onChange={(e) => onOtpChange(e.target.value)}
          disabled={loading}
          inputProps={{ maxLength: 6 }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && otpCode.trim()) {
              onVerify();
            }
          }}
          sx={{ mt: 1 }}
        />
        {error && (
          <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onVerify} variant="contained" disabled={loading || !otpCode.trim()}>
          {loading ? <CircularProgress size={20} /> : 'Verify & Download'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

OtpDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired,
  maskedDest: PropTypes.string,
  otpCode: PropTypes.string.isRequired,
  error: PropTypes.string,
  onOtpChange: PropTypes.func.isRequired,
  onVerify: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};
