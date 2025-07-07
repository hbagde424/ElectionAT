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

export default function BoothVotesModal({
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
    booth_id: '',
    election_year_id: '',
    state_id: '',
    division_id: '',
    parliament_id: '',
    assembly_id: '',
    block_id: '',
    total_votes: 0
  });

  const [filteredDivisions, setFilteredDivisions] = useState([]);
  const [filteredParliaments, setFilteredParliaments] = useState([]);
  const [filteredAssemblies, setFilteredAssemblies] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);
  const [isPrefilling, setIsPrefilling] = useState(false);
  useEffect(() => {
    if (vote) {
      const updatedFormData = {
        candidate_id: vote.candidate?._id || vote.candidate_id || '',
        booth_id: vote.booth?._id || vote.booth_id || '',
        election_year_id: vote.election_year?._id || vote.election_year_id || '',
        state_id: vote.state?._id || vote.state_id || '',
        division_id: vote.division?._id || vote.division_id || '',
        parliament_id: vote.parliament?._id || vote.parliament_id || '',
        assembly_id: vote.assembly?._id || vote.assembly_id || '',
        block_id: vote.block?._id || vote.block_id || '',
        total_votes: vote.total_votes || 0
      };

      setFormData(updatedFormData);

      // Manually set dropdown options
      setFilteredDivisions(divisions?.filter(d => d.state_id?._id === updatedFormData.state_id) || []);
      setFilteredParliaments(parliaments?.filter(p => p.division_id?._id === updatedFormData.division_id) || []);
      setFilteredAssemblies(assemblies?.filter(a => a.parliament_id?._id === updatedFormData.parliament_id) || []);
      setFilteredBlocks(blocks?.filter(b => b.assembly_id?._id === updatedFormData.assembly_id) || []);
      setFilteredBooths(booths?.filter(b => b.block_id?._id === updatedFormData.block_id) || []);

      setIsPrefilling(true); // Skip auto-reset for initial load
    } else {
      setFormData({
        candidate_id: '',
        booth_id: '',
        election_year_id: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        total_votes: 0
      });
    }
  }, [vote]);


  // Cascade dropdowns
  useEffect(() => {
    const filtered = divisions?.filter(division => division.state_id?._id === formData.state_id) || [];
    setFilteredDivisions(filtered);
    if (!isPrefilling) {
      setFormData(prev => ({
        ...prev,
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: ''
      }));
    }
  }, [formData.state_id]);

  useEffect(() => {
    const filtered = parliaments?.filter(parliament => parliament.division_id?._id === formData.division_id) || [];
    setFilteredParliaments(filtered);
    if (!isPrefilling) {
      setFormData(prev => ({
        ...prev,
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: ''
      }));
    }
  }, [formData.division_id]);

  useEffect(() => {
    const filtered = assemblies?.filter(assembly => assembly.parliament_id?._id === formData.parliament_id) || [];
    setFilteredAssemblies(filtered);
    if (!isPrefilling) {
      setFormData(prev => ({
        ...prev,
        assembly_id: '',
        block_id: '',
        booth_id: ''
      }));
    }
  }, [formData.parliament_id]);

  useEffect(() => {
    const filtered = blocks?.filter(block => block.assembly_id?._id === formData.assembly_id) || [];
    setFilteredBlocks(filtered);
    if (!isPrefilling) {
      setFormData(prev => ({
        ...prev,
        block_id: '',
        booth_id: ''
      }));
    }
  }, [formData.assembly_id]);

  useEffect(() => {
    const filtered = booths?.filter(booth => booth.block_id?._id === formData.block_id) || [];
    setFilteredBooths(filtered);
    if (!isPrefilling) {
      setFormData(prev => ({
        ...prev,
        booth_id: ''
      }));
    }
  }, [formData.block_id]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const method = vote ? 'PUT' : 'POST';
    const token = localStorage.getItem('serviceToken');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const url = vote
      ? `http://localhost:5000/api/booth-votes/${vote._id}`
      : 'http://localhost:5000/api/booth-votes';

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
      <DialogTitle>{vote ? 'Edit Booth Vote' : 'Add Booth Vote'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={2}>
          {[
            { name: 'state_id', label: 'State', options: states, disabled: false },
            { name: 'division_id', label: 'Division', options: filteredDivisions, disabled: !formData.state_id },
            { name: 'parliament_id', label: 'Parliament', options: filteredParliaments, disabled: !formData.division_id },
            { name: 'assembly_id', label: 'Assembly', options: filteredAssemblies, disabled: !formData.parliament_id },
            { name: 'block_id', label: 'Block', options: filteredBlocks, disabled: !formData.assembly_id },
            { name: 'booth_id', label: 'Booth', options: filteredBooths, disabled: !formData.block_id, extra: true }
          ].map(({ name, label, options, disabled, extra }) => (
            <FormControl fullWidth key={name}>
              <InputLabel>{label}</InputLabel>
              <Select
                name={name}
                value={formData[name]}
                onChange={handleChange}
                label={label}
                required
                disabled={disabled}
              >
                {options?.map((item) => (
                  <MenuItem key={item._id} value={item._id}>
                    {item.name} {extra ? `(No: ${item.booth_number})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}

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
