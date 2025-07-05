// BlockVotesModal.js
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

export default function BlockVotesModal({
  open,
  modalToggler,
  vote,
  states,
  divisions,
  parliaments,
  assemblies,
  blocks,
  booths,
  candidates,
  electionYears,
  users,
  refresh
}) {
  const [formData, setFormData] = useState({
    candidate_id: '',
    block_id: '',
    booth_id: '',
    election_year_id: '',
    state_id: '',
    division_id: '',
    parliament_id: '',
    assembly_id: '',
    total_votes: 0
  });

  // Filtered data based on selections
  const [filteredDivisions, setFilteredDivisions] = useState([]);
  const [filteredParliaments, setFilteredParliaments] = useState([]);
  const [filteredAssemblies, setFilteredAssemblies] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);

  useEffect(() => {
    if (vote) {
      setFormData({
        candidate_id: vote.candidate_id?._id || '',
        block_id: vote.block_id?._id || '',
        booth_id: vote.booth_id?._id || '',
        election_year_id: vote.election_year_id?._id || '',
        state_id: vote.state_id?._id || '',
        division_id: vote.division_id?._id || '',
        parliament_id: vote.parliament_id?._id || '',
        assembly_id: vote.assembly_id?._id || '',
        total_votes: vote.total_votes || 0
      });
    } else {
      setFormData({
        candidate_id: '',
        block_id: '',
        booth_id: '',
        election_year_id: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        total_votes: 0
      });
    }
  }, [vote]);

  // Cascading dropdown effects
  useEffect(() => {
    if (formData.state_id) {
      const filtered = divisions?.filter(division => division.state_id?._id === formData.state_id) || [];
      setFilteredDivisions(filtered);
    } else {
      setFilteredDivisions([]);
    }
    setFormData(prev => ({ ...prev, division_id: '', parliament_id: '', assembly_id: '', block_id: '', booth_id: '' }));
  }, [formData.state_id, divisions]);

  useEffect(() => {
    if (formData.division_id) {
      const filtered = parliaments?.filter(parliament => parliament.division_id?._id === formData.division_id) || [];
      setFilteredParliaments(filtered);
    } else {
      setFilteredParliaments([]);
    }
    setFormData(prev => ({ ...prev, parliament_id: '', assembly_id: '', block_id: '', booth_id: '' }));
  }, [formData.division_id, parliaments]);

  useEffect(() => {
    if (formData.parliament_id) {
      const filtered = assemblies?.filter(assembly => assembly.parliament_id?._id === formData.parliament_id) || [];
      setFilteredAssemblies(filtered);
    } else {
      setFilteredAssemblies([]);
    }
    setFormData(prev => ({ ...prev, assembly_id: '', block_id: '', booth_id: '' }));
  }, [formData.parliament_id, assemblies]);

  useEffect(() => {
    if (formData.assembly_id) {
      const filtered = blocks?.filter(block => block.assembly_id?._id === formData.assembly_id) || [];
      setFilteredBlocks(filtered);
    } else {
      setFilteredBlocks([]);
    }
    setFormData(prev => ({ ...prev, block_id: '', booth_id: '' }));
  }, [formData.assembly_id, blocks]);

  useEffect(() => {
    if (formData.block_id) {
      const filtered = booths?.filter(booth => booth.block_id?._id === formData.block_id) || [];
      setFilteredBooths(filtered);
    } else {
      setFilteredBooths([]);
    }
    setFormData(prev => ({ ...prev, booth_id: '' }));
  }, [formData.block_id, booths]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const method = vote ? 'PUT' : 'POST';
    const token = localStorage.getItem('serviceToken');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const url = vote
      ? `http://localhost:5000/api/block-votes/${vote._id}`
      : 'http://localhost:5000/api/block-votes';

    const submitData = {
      ...formData,
      ...(vote ? { updated_by: currentUser?._id } : { created_by: currentUser?._id })
    };

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(submitData)
    });

    if (res.ok) {
      modalToggler(false);
      refresh();
    }
  };

  return (
    <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="sm">
      <DialogTitle>{vote ? 'Edit Block Vote' : 'Add Block Vote'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={2}>
          <FormControl fullWidth>
            <InputLabel>State</InputLabel>
            <Select
              name="state_id"
              value={formData.state_id}
              onChange={handleChange}
              label="State"
              required
            >
              {states?.map((state) => (
                <MenuItem key={state._id} value={state._id}>
                  {state.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Division</InputLabel>
            <Select
              name="division_id"
              value={formData.division_id}
              onChange={handleChange}
              label="Division"
              required
              disabled={!formData.state_id}
            >
              {filteredDivisions?.map((division) => (
                <MenuItem key={division._id} value={division._id}>
                  {division.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Parliament</InputLabel>
            <Select
              name="parliament_id"
              value={formData.parliament_id}
              onChange={handleChange}
              label="Parliament"
              required
              disabled={!formData.division_id}
            >
              {filteredParliaments?.map((parliament) => (
                <MenuItem key={parliament._id} value={parliament._id}>
                  {parliament.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Assembly</InputLabel>
            <Select
              name="assembly_id"
              value={formData.assembly_id}
              onChange={handleChange}
              label="Assembly"
              required
              disabled={!formData.parliament_id}
            >
              {filteredAssemblies?.map((assembly) => (
                <MenuItem key={assembly._id} value={assembly._id}>
                  {assembly.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Block</InputLabel>
            <Select
              name="block_id"
              value={formData.block_id}
              onChange={handleChange}
              label="Block"
              required
              disabled={!formData.assembly_id}
            >
              {filteredBlocks?.map((block) => (
                <MenuItem key={block._id} value={block._id}>
                  {block.name}
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
              disabled={!formData.block_id}
            >
              {filteredBooths?.map((booth) => (
                <MenuItem key={booth._id} value={booth._id}>
                  {booth.name} (No: {booth.booth_number})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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