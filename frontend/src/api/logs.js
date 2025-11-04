import axios from '../utils/axios';

export async function getLogs(params = {}) {
  const res = await axios.get('/logs', { params });
  return res.data;
}

export async function getLogMeta() {
  const res = await axios.get('/logs/meta');
  return res.data;
}

export async function getLogById(id) {
  const res = await axios.get(`/logs/${id}`);
  return res.data;
}
