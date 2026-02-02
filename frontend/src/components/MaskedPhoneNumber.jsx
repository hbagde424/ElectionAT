import { useState } from 'react';
import {
    Typography, IconButton, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, TextField,
    Alert, CircularProgress, Stack
} from '@mui/material';
import { Eye } from 'iconsax-react';
import axiosServices from 'utils/axios';

/**
 * Component to display masked phone number with OTP verification to reveal
 * @param {string} maskedNumber - The masked phone number (e.g., "xxxxx89")
 * @param {string} blaId - The BLA ID for OTP verification
 */
export default function MaskedPhoneNumber({ maskedNumber, blaId }) {
    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [requestId, setRequestId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [revealedNumber, setRevealedNumber] = useState('');
    const [maskedDest, setMaskedDest] = useState('');

    const requestOtp = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axiosServices.post(`/blas/${blaId}/request-phone-otp`);
            if (response.data.success) {
                setRequestId(response.data.requestId);
                setMaskedDest(response.data.to);
                setOtpDialogOpen(true);
                setOtpCode(''); // Clear OTP field - user must enter manually
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to request OTP');
        }
        setLoading(false);
    };

    const verifyOtp = async () => {
        if (!otpCode.trim()) {
            setError('Please enter OTP');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await axiosServices.post(`/blas/${blaId}/verify-phone-otp`, {
                requestId,
                otp: otpCode
            });
            
            if (response.data.success) {
                setRevealedNumber(response.data.phoneNumber);
                setOtpDialogOpen(false);
                setOtpCode('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to verify OTP');
        }
        setLoading(false);
    };

    const closeDialog = () => {
        setOtpDialogOpen(false);
        setOtpCode('');
        setError('');
    };

    return (
        <>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2">
                    {revealedNumber || maskedNumber || 'N/A'}
                </Typography>
                {!revealedNumber && maskedNumber && (
                    <Tooltip title="Click to reveal phone number">
                        <IconButton
                            size="small"
                            onClick={requestOtp}
                            disabled={loading}
                            color="primary"
                        >
                            {loading ? <CircularProgress size={16} /> : <Eye size={16} />}
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>

            <Dialog open={otpDialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
                <DialogTitle>Enter OTP to Reveal Phone Number</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        OTP sent to: {maskedDest || 'your registered number'}
                    </Typography>
                    <TextField
                        label="OTP"
                        fullWidth
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        margin="dense"
                        autoFocus
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                verifyOtp();
                            }
                        }}
                    />
                    {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>Cancel</Button>
                    <Button onClick={verifyOtp} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={18} /> : 'Verify & Reveal'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
