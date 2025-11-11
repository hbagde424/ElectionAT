import { useState, useCallback } from 'react';
import { requestCsvOtp, verifyCsvOtp } from '../api/otp';

export const useCsvOtp = () => {
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [requestId, setRequestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maskedDest, setMaskedDest] = useState('');
  const [error, setError] = useState('');
  const [onSuccessCallback, setOnSuccessCallback] = useState(null);

  const requestOtp = useCallback(async (successCallback) => {
    setLoading(true);
    setError('');
    setOtpCode('');
    try {
      const res = await requestCsvOtp();
      if (res.success) {
        setRequestId(res.requestId);
        setMaskedDest(res.to);
        setOtpDialogOpen(true);
        setOnSuccessCallback(() => successCallback);
      } else {
        setError(res.message || 'Failed to request OTP');
        alert(res.message || 'Failed to request OTP');
      }
    } catch (err) {
      const msg = err?.message || 'Failed to request OTP';
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = async () => {
    if (!otpCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await verifyCsvOtp({ requestId, otp: otpCode.trim() });
      if (res.success) {
        setOtpDialogOpen(false);
        setOtpCode('');
        // Call success callback
        if (onSuccessCallback) {
          onSuccessCallback();
        }
      } else {
        setError(res.message || 'OTP verification failed');
      }
    } catch (err) {
      setError(err?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    if (!loading) {
      setOtpDialogOpen(false);
      setOtpCode('');
      setError('');
    }
  };

  return {
    otpDialogOpen,
    otpCode,
    setOtpCode,
    loading,
    maskedDest,
    error,
    requestOtp,
    verifyOtp,
    closeDialog
  };
};
