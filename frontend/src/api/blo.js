import axios from '../utils/axios';

export async function getBLOs(params = {}) {
  const res = await axios.get('/blos', { params });
  return res.data;
}

export async function getBLOById(id) {
  const res = await axios.get(`/blos/${id}`);
  return res.data;
}

export async function createBLO(data) {
  const res = await axios.post('/blos', data);
  return res.data;
}

export async function updateBLO(id, data) {
  const res = await axios.put(`/blos/${id}`, data);
  return res.data;
}

export async function deleteBLO(id) {
  const res = await axios.delete(`/blos/${id}`);
  return res.data;
}
