// BoothVotesModal.js
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  InputLabel,
  MenuItem,
  Select,
  FormControl
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useFetch } from 'hooks/useFetch';

export default function BoothVotesModal({ open, modalToggler, vote, refresh }) {
  const [formData, setFormData] = useState({
    candidate_id: '',
    booth_id: '',
    election_year_id: '',
    total_votes: 0
  });

  // Fetch reference data
  const { data: candidates } = useFetch('http://localhost:5000/api/candidates');
  const { data: booths } = useFetch('http://localhost:5000/api/booths');
  const { data: electionYears } = useFetch('http://localhost:5000/api/election-years');

  useEffect(() => {
    if (vote) {
      setFormData({
        candidate_id: vote.candidate_id._id,
        booth_id: vote.booth_id._id,
        election_year_id: vote.election_year_id._id,
        total_votes: vote.total_votes
      });
    } else {
      setFormData({
        candidate_id: '',
        booth_id: '',
        election_year_id: '',
        total_votes: 0
      });
    }
  }, [vote]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const method = vote ? 'PUT' : 'POST';
    const token = localStorage.getItem('serviceToken');
    const url = vote
      ? `http://localhost:5000/api/booth-votes/${vote._id}`
      : 'http://localhost:5000/api/booth-votes';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      modalToggler(false);
      refresh();
    }
  };

  return (
    <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="sm">
      <DialogTitle>{vote ? 'Edit Booth Vote' : 'Add Booth Vote'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={2}>
          <FormControl fullWidth>
            <InputLabel>Candidate</InputLabel>
            <Select
              name="candidate_id"
              value={formData.candidate_id}
              onChange={handleChange}
              label="Candidate"
              required
            >
              {candidates?.map((candidate) => (
                <MenuItem key={candidate._id} value={candidate._id}>
                  {candidate.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Booth</InputLabel>
            <Select
              name="booth_id"
              value={formData.booth_id}
              onChange={handleChange}
              label="Booth"
              required
            >
              {booths?.map((booth) => (
                <MenuItem key={booth._id} value={booth._id}>
                  {booth.name} (No: {booth.booth_number})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Election Year</InputLabel>
            <Select
              name="election_year_id"
              value={formData.election_year_id}
              onChange={handleChange}
              label="Election Year"
              required
            >
              {electionYears?.map((year) => (
                <MenuItem key={year._id} value={year._id}>
                  {year.year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            name="total_votes"
            label="Total Votes"
            type="number"
            value={formData.total_votes}
            onChange={handleChange}
            fullWidth
            required
            inputProps={{ min: 0 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => modalToggler(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {vote ? 'Update' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}