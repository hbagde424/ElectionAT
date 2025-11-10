import axios from '../utils/axios';

export async function requestCsvOtp() {
  const res = await axios.post('/csv-export/request-otp');
  return res.data;
}

export async function verifyCsvOtp(payload) {
  const res = await axios.post('/csv-export/verify-otp', payload);
  return res.data;
}
