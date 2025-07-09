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
  FormControl,
  Grid,
  FormHelperText,
  Alert,
  CircularProgress
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function BoothVotesModal({
  open,
  modalToggler,
  voteData,
  states,
  divisions,
  parliaments,
  assemblies,
  blocks,
  booths,
  candidates,
  electionYears,
  refresh
}) {
  // Form state
  const [formData, setFormData] = useState({
    candidate_id: '',
    total_votes: '',
    election_year_id: '',
    state_id: '',
    division_id: '',
    parliament_id: '',
    assembly_id: '',
    block_id: '',
    booth_id: ''
  });

  // Filtered dropdown options
  const [filteredDivisions, setFilteredDivisions] = useState([]);
  const [filteredParliaments, setFilteredParliaments] = useState([]);
  const [filteredAssemblies, setFilteredAssemblies] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);

  // Error and loading states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Initialize form data when modal opens or voteData changes
  useEffect(() => {
    if (!open) return;

    if (voteData) {
      setFormData({
        candidate_id: getID(voteData.candidate_id),
        total_votes: voteData.total_votes,
        election_year_id: getID(voteData.election_year_id),
        state_id: getID(voteData.state_id),
        division_id: getID(voteData.division_id),
        parliament_id: getID(voteData.parliament_id),
        assembly_id: getID(voteData.assembly_id),
        block_id: getID(voteData.block_id),
        booth_id: getID(voteData.booth_id)
      });
    } else {
      setFormData({
        candidate_id: '',
        total_votes: '',
        election_year_id: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: ''
      });
    }

    setFilteredDivisions([]);
    setFilteredParliaments([]);
    setFilteredAssemblies([]);
    setFilteredBlocks([]);
    setFilteredBooths([]);
    setFilteredCandidates([]);
  }, [open, voteData]);

  // Helper function to get ID whether it's an object or string
  const getID = (item) => {
    if (!item) return '';
    return typeof item === 'object' ? item._id : item;
  };

  // Filter divisions when state changes
  useEffect(() => {
    if (!formData.state_id) {
      setFilteredDivisions([]);
      setFormData(prev => ({
        ...prev,
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: ''
      }));
      return;
    }

    const filtered = divisions.filter(div => 
      getID(div.state_id) === formData.state_id
    );
    setFilteredDivisions(filtered);
  }, [formData.state_id, divisions]);

  // Filter parliaments when division changes
  useEffect(() => {
    if (!formData.division_id) {
      setFilteredParliaments([]);
      setFormData(prev => ({
        ...prev,
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: ''
      }));
      return;
    }

    const filtered = parliaments.filter(par => 
      getID(par.division_id) === formData.division_id
    );
    setFilteredParliaments(filtered);
  }, [formData.division_id, parliaments]);

  // Filter assemblies when parliament changes
  useEffect(() => {
    if (!formData.parliament_id) {
      setFilteredAssemblies([]);
      setFormData(prev => ({
        ...prev,
        assembly_id: '',
        block_id: '',
        booth_id: ''
      }));
      return;
    }

    const filtered = assemblies.filter(asm => 
      getID(asm.parliament_id) === formData.parliament_id
    );
    setFilteredAssemblies(filtered);
  }, [formData.parliament_id, assemblies]);

  // Filter blocks when assembly changes
  useEffect(() => {
    if (!formData.assembly_id) {
      setFilteredBlocks([]);
      setFormData(prev => ({
        ...prev,
        block_id: '',
        booth_id: ''
      }));
      return;
    }

    const filtered = blocks.filter(blk => 
      getID(blk.assembly_id) === formData.assembly_id
    );
    setFilteredBlocks(filtered);
  }, [formData.assembly_id, blocks]);

  // Filter booths when block changes
  useEffect(() => {
    if (!formData.block_id) {
      setFilteredBooths([]);
      setFormData(prev => ({
        ...prev,
        booth_id: ''
      }));
      return;
    }

    const filtered = booths.filter(booth => 
      getID(booth.block_id) === formData.block_id
    );
    setFilteredBooths(filtered);
  }, [formData.block_id, booths]);

  // Filter candidates when election year changes
  useEffect(() => {
    if (!formData.election_year_id) {
      setFilteredCandidates([]);
      setFormData(prev => ({
        ...prev,
        candidate_id: ''
      }));
      return;
    }

    const filtered = candidates.filter(candidate => 
      candidate.election_years?.includes(formData.election_year_id)
    );
    setFilteredCandidates(filtered);
  }, [formData.election_year_id, candidates]);

  // Validate individual field
  const validateField = (name, value) => {
    switch (name) {
      case 'candidate_id':
        if (!value) return 'Candidate selection is required';
        break;
      case 'total_votes':
        if (!value) return 'Vote count is required';
        if (isNaN(value)) return 'Must be a number';
        if (value < 0) return 'Cannot be negative';
        break;
      case 'election_year_id':
        if (!value) return 'Election year is required';
        break;
      case 'booth_id':
        if (!value) return 'Booth selection is required';
        break;
      case 'state_id':
        if (!value) return 'State selection is required';
        break;
      default:
        break;
    }
    return '';
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['candidate_id', 'total_votes', 'election_year_id', 'booth_id', 'state_id'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError('');

    setFormData(prev => {
      const updates = { [name]: value };
      
      if (name === 'state_id') {
        updates.division_id = '';
        updates.parliament_id = '';
        updates.assembly_id = '';
        updates.block_id = '';
        updates.booth_id = '';
      } else if (name === 'division_id') {
        updates.parliament_id = '';
        updates.assembly_id = '';
        updates.block_id = '';
        updates.booth_id = '';
      } else if (name === 'parliament_id') {
        updates.assembly_id = '';
        updates.block_id = '';
        updates.booth_id = '';
      } else if (name === 'assembly_id') {
        updates.block_id = '';
        updates.booth_id = '';
      } else if (name === 'block_id') {
        updates.booth_id = '';
      } else if (name === 'election_year_id') {
        updates.candidate_id = '';
      }
      
      return { ...prev, ...updates };
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const method = voteData ? 'PUT' : 'POST';
      const token = localStorage.getItem('serviceToken');
      const url = voteData
        ? `http://localhost:5000/api/booth-votes/${voteData._id}`
        : 'http://localhost:5000/api/booth-votes';

      const currentUser = JSON.parse(localStorage.getItem('user'));
      const submitData = {
        ...formData,
        total_votes: parseInt(formData.total_votes),
        ...(voteData ? { updated_by: currentUser?._id } : { created_by: currentUser?._id })
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
      } else {
        const errorData = await res.json();
        if (res.status === 400 && errorData.errors) {
          const serverErrors = {};
          errorData.errors.forEach(error => {
            if (error.path) serverErrors[error.path] = error.msg;
          });
          setErrors(serverErrors);
        } else {
          setSubmitError(errorData.message || 'Failed to save booth votes. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving booth votes:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
      <DialogTitle>{voteData ? 'Edit Booth Votes' : 'Add Booth Votes'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={2}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.election_year_id}>
                <InputLabel>Election Year *</InputLabel>
                <Select
                  name="election_year_id"
                  value={formData.election_year_id}
                  onChange={handleChange}
                  label="Election Year *"
                  required
                >
                  <MenuItem value="">Select Election Year</MenuItem>
                  {electionYears.map(year => (
                    <MenuItem key={year._id} value={year._id}>
                      {year.year}
                    </MenuItem>
                  ))}
                </Select>
                {errors.election_year_id && <FormHelperText>{errors.election_year_id}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.candidate_id}>
                <InputLabel>Candidate *</InputLabel>
                <Select
                  name="candidate_id"
                  value={formData.candidate_id}
                  onChange={handleChange}
                  label="Candidate *"
                  required
                  disabled={!formData.election_year_id}
                >
                  <MenuItem value="">Select Candidate</MenuItem>
                  {filteredCandidates.map(candidate => (
                    <MenuItem key={candidate._id} value={candidate._id}>
                      {candidate.name} ({candidate.party?.name || 'No Party'})
                    </MenuItem>
                  ))}
                </Select>
                {errors.candidate_id && <FormHelperText>{errors.candidate_id}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="total_votes"
                label="Total Votes *"
                value={formData.total_votes}
                onChange={handleChange}
                fullWidth
                type="number"
                error={!!errors.total_votes}
                helperText={errors.total_votes}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.state_id}>
                <InputLabel>State *</InputLabel>
                <Select
                  name="state_id"
                  value={formData.state_id}
                  onChange={handleChange}
                  label="State *"
                  required
                >
                  <MenuItem value="">Select State</MenuItem>
                  {states.map(state => (
                    <MenuItem key={state._id} value={state._id}>
                      {state.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.state_id && <FormHelperText>{errors.state_id}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.division_id}>
                <InputLabel>Division</InputLabel>
                <Select
                  name="division_id"
                  value={formData.division_id}
                  onChange={handleChange}
                  label="Division"
                  disabled={!formData.state_id}
                >
                  <MenuItem value="">Select Division</MenuItem>
                  {filteredDivisions.map(division => (
                    <MenuItem key={division._id} value={division._id}>
                      {division.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.parliament_id}>
                <InputLabel>Parliament</InputLabel>
                <Select
                  name="parliament_id"
                  value={formData.parliament_id}
                  onChange={handleChange}
                  label="Parliament"
                  disabled={!formData.division_id}
                >
                  <MenuItem value="">Select Parliament</MenuItem>
                  {filteredParliaments.map(parliament => (
                    <MenuItem key={parliament._id} value={parliament._id}>
                      {parliament.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.assembly_id}>
                <InputLabel>Assembly</InputLabel>
                <Select
                  name="assembly_id"
                  value={formData.assembly_id}
                  onChange={handleChange}
                  label="Assembly"
                  disabled={!formData.parliament_id}
                >
                  <MenuItem value="">Select Assembly</MenuItem>
                  {filteredAssemblies.map(assembly => (
                    <MenuItem key={assembly._id} value={assembly._id}>
                      {assembly.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.block_id}>
                <InputLabel>Block</InputLabel>
                <Select
                  name="block_id"
                  value={formData.block_id}
                  onChange={handleChange}
                  label="Block"
                  disabled={!formData.assembly_id}
                >
                  <MenuItem value="">Select Block</MenuItem>
                  {filteredBlocks.map(block => (
                    <MenuItem key={block._id} value={block._id}>
                      {block.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.booth_id}>
                <InputLabel>Booth *</InputLabel>
                <Select
                  name="booth_id"
                  value={formData.booth_id}
                  onChange={handleChange}
                  label="Booth *"
                  required
                  disabled={!formData.block_id}
                >
                  <MenuItem value="">Select Booth</MenuItem>
                  {filteredBooths.map(booth => (
                    <MenuItem key={booth._id} value={booth._id}>
                      {booth.name} (No: {booth.booth_number})
                    </MenuItem>
                  ))}
                </Select>
                {errors.booth_id && <FormHelperText>{errors.booth_id}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => modalToggler(false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          endIcon={isSubmitting && <CircularProgress size={20} />}
        >
          {isSubmitting ? 'Saving...' : (voteData ? 'Update' : 'Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}