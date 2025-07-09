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
  CircularProgress,
  Autocomplete,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function UserModal({
  open,
  modalToggler,
  user,
  states,
  divisions,
  parliaments,
  assemblies,
  blocks,
  booths,
  refresh
}) {
  const [formData, setFormData] = useState({
    username: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    state_ids: [],
    division_ids: [],
    parliament_ids: [],
    assembly_ids: [],
    block_ids: [],
    booth_ids: [],
    isActive: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [filteredDivisions, setFilteredDivisions] = useState([]);
  const [filteredParliaments, setFilteredParliaments] = useState([]);
  const [filteredAssemblies, setFilteredAssemblies] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (user) {
      setFormData({
        username: user.username || '',
        mobile: user.mobile || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        role: user.role || '',
        state_ids: user.state_ids || [],
        division_ids: user.division_ids || [],
        parliament_ids: user.parliament_ids || [],
        assembly_ids: user.assembly_ids || [],
        block_ids: user.block_ids || [],
        booth_ids: user.booth_ids || [],
        isActive: user.isActive
      });
    } else {
      setFormData({
        username: '',
        mobile: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        state_ids: [],
        division_ids: [],
        parliament_ids: [],
        assembly_ids: [],
        block_ids: [],
        booth_ids: [],
        isActive: true
      });
    }

    setFilteredDivisions([]);
    setFilteredParliaments([]);
    setFilteredAssemblies([]);
    setFilteredBlocks([]);
    setFilteredBooths([]);
  }, [open, user]);

  const getID = (item) => {
    if (!item) return '';
    return typeof item === 'object' ? item._id : item;
  };

  useEffect(() => {
    if (formData.state_ids.length > 0) {
      const filtered = divisions.filter(div => 
        formData.state_ids.includes(getID(div.state_id))
      );
      setFilteredDivisions(filtered);
    } else {
      setFilteredDivisions([]);
      setFormData(prev => ({
        ...prev,
        division_ids: [],
        parliament_ids: [],
        assembly_ids: [],
        block_ids: [],
        booth_ids: []
      }));
    }
  }, [formData.state_ids, divisions]);

  useEffect(() => {
    if (formData.division_ids.length > 0) {
      const filtered = parliaments.filter(par => 
        formData.division_ids.includes(getID(par.division_id))
      );
      setFilteredParliaments(filtered);
    } else {
      setFilteredParliaments([]);
      setFormData(prev => ({
        ...prev,
        parliament_ids: [],
        assembly_ids: [],
        block_ids: [],
        booth_ids: []
      }));
    }
  }, [formData.division_ids, parliaments]);

  useEffect(() => {
    if (formData.parliament_ids.length > 0) {
      const filtered = assemblies.filter(asm => 
        formData.parliament_ids.includes(getID(asm.parliament_id))
      );
      setFilteredAssemblies(filtered);
    } else {
      setFilteredAssemblies([]);
      setFormData(prev => ({
        ...prev,
        assembly_ids: [],
        block_ids: [],
        booth_ids: []
      }));
    }
  }, [formData.parliament_ids, assemblies]);

  useEffect(() => {
    if (formData.assembly_ids.length > 0) {
      const filtered = blocks.filter(blk => 
        formData.assembly_ids.includes(getID(blk.assembly_id))
      );
      setFilteredBlocks(filtered);
    } else {
      setFilteredBlocks([]);
      setFormData(prev => ({
        ...prev,
        block_ids: [],
        booth_ids: []
      }));
    }
  }, [formData.assembly_ids, blocks]);

  useEffect(() => {
    if (formData.block_ids.length > 0) {
      const filtered = booths.filter(booth => 
        formData.block_ids.includes(getID(booth.block_id))
      );
      setFilteredBooths(filtered);
    } else {
      setFilteredBooths([]);
      setFormData(prev => ({
        ...prev,
        booth_ids: []
      }));
    }
  }, [formData.block_ids, booths]);

  const validateField = (name, value) => {
    switch (name) {
      case 'username':
        if (!value || value.trim().length === 0) return 'Username is required';
        if (value.trim().length < 3) return 'Username must be at least 3 characters';
        break;
      case 'mobile':
        if (!value) return 'Mobile is required';
        if (!/^[0-9]{10}$/.test(value)) return 'Invalid mobile number (10 digits required)';
        break;
      case 'email':
        if (!value) return 'Email is required';
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)) 
          return 'Invalid email format';
        break;
      case 'password':
        if (!user && !value) return 'Password is required';
        if (value && value.length < 6) return 'Password must be at least 6 characters';
        break;
      case 'confirmPassword':
        if (formData.password && value !== formData.password) return 'Passwords do not match';
        break;
      case 'role':
        if (!value) return 'Role is required';
        break;
      case 'state_ids':
        if (['State', 'Division', 'Parliament', 'Assembly', 'Block', 'Booth'].includes(formData.role) && value.length === 0)
          return 'At least one state must be selected';
        break;
      case 'division_ids':
        if (['Division', 'Parliament', 'Assembly', 'Block', 'Booth'].includes(formData.role) && value.length === 0)
          return 'At least one division must be selected';
        break;
      case 'parliament_ids':
        if (['Parliament', 'Assembly', 'Block', 'Booth'].includes(formData.role) && value.length === 0)
          return 'At least one parliament must be selected';
        break;
      case 'assembly_ids':
        if (['Assembly', 'Block', 'Booth'].includes(formData.role) && value.length === 0)
          return 'At least one assembly must be selected';
        break;
      case 'block_ids':
        if (['Block', 'Booth'].includes(formData.role) && value.length === 0)
          return 'At least one block must be selected';
        break;
      case 'booth_ids':
        if (formData.role === 'Booth' && value.length === 0)
          return 'At least one booth must be selected';
        break;
      default:
        break;
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = [
      'username', 'mobile', 'email', 'role', 
      'state_ids', 'division_ids', 'parliament_ids', 
      'assembly_ids', 'block_ids', 'booth_ids'
    ];

    if (!user) {
      fieldsToValidate.push('password', 'confirmPassword');
    }

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError('');

    setFormData(prev => {
      const updates = { [name]: value };
      
      // Clear dependent fields when role changes
      if (name === 'role') {
        updates.state_ids = [];
        updates.division_ids = [];
        updates.parliament_ids = [];
        updates.assembly_ids = [];
        updates.block_ids = [];
        updates.booth_ids = [];
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleMultiSelectChange = (name, value) => {
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError('');

    setFormData(prev => {
      const updates = { [name]: value };
      
      // Clear dependent fields when parent selection changes
      if (name === 'state_ids') {
        updates.division_ids = [];
        updates.parliament_ids = [];
        updates.assembly_ids = [];
        updates.block_ids = [];
        updates.booth_ids = [];
      } else if (name === 'division_ids') {
        updates.parliament_ids = [];
        updates.assembly_ids = [];
        updates.block_ids = [];
        updates.booth_ids = [];
      } else if (name === 'parliament_ids') {
        updates.assembly_ids = [];
        updates.block_ids = [];
        updates.booth_ids = [];
      } else if (name === 'assembly_ids') {
        updates.block_ids = [];
        updates.booth_ids = [];
      } else if (name === 'block_ids') {
        updates.booth_ids = [];
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const method = user ? 'PUT' : 'POST';
      const token = localStorage.getItem('serviceToken');
      const url = user
        ? `http://localhost:5000/api/users/${user._id}`
        : 'http://localhost:5000/api/users/register';

      const currentUser = JSON.parse(localStorage.getItem('user'));
      const submitData = {
        ...formData,
        ...(user ? { updated_by: currentUser?._id } : { created_by: currentUser?._id })
      };

      // Don't send password fields if they're empty (for updates)
      if (user && !submitData.password) {
        delete submitData.password;
        delete submitData.confirmPassword;
      }

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
          setSubmitError(errorData.message || 'Failed to save user. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
      <DialogTitle>{user ? 'Edit User' : 'Add User'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={2}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="username"
                label="Username *"
                value={formData.username}
                onChange={handleChange}
                fullWidth
                error={!!errors.username}
                helperText={errors.username}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="mobile"
                label="Mobile *"
                value={formData.mobile}
                onChange={handleChange}
                fullWidth
                error={!!errors.mobile}
                helperText={errors.mobile}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email *"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.role}>
                <InputLabel>Role *</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role *"
                >
                  <MenuItem value="">Select Role</MenuItem>
                  <MenuItem value="superAdmin">Super Admin</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="State">State</MenuItem>
                  <MenuItem value="Division">Division</MenuItem>
                  <MenuItem value="Parliament">Parliament</MenuItem>
                  <MenuItem value="Assembly">Assembly</MenuItem>
                  <MenuItem value="Block">Block</MenuItem>
                  <MenuItem value="Booth">Booth</MenuItem>
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>

          {!user && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  name="password"
                  label="Password *"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.password}
                  helperText={errors.password}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="confirmPassword"
                  label="Confirm Password *"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  fullWidth
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                />
              </Grid>
            </Grid>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                name="isActive"
                color="primary"
              />
            }
            label="Active User"
          />

          {['State', 'Division', 'Parliament', 'Assembly', 'Block', 'Booth'].includes(formData.role) && (
            <Autocomplete
              multiple
              options={states}
              getOptionLabel={(option) => option.name}
              value={states.filter(state => formData.state_ids.includes(state._id))}
              onChange={(e, newValue) => handleMultiSelectChange('state_ids', newValue.map(v => v._id))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="States *"
                  error={!!errors.state_ids}
                  helperText={errors.state_ids}
                />
              )}
              disabled={!['State', 'Division', 'Parliament', 'Assembly', 'Block', 'Booth'].includes(formData.role)}
            />
          )}

          {['Division', 'Parliament', 'Assembly', 'Block', 'Booth'].includes(formData.role) && (
            <Autocomplete
              multiple
              options={filteredDivisions}
              getOptionLabel={(option) => option.name}
              value={filteredDivisions.filter(div => formData.division_ids.includes(div._id))}
              onChange={(e, newValue) => handleMultiSelectChange('division_ids', newValue.map(v => v._id))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Divisions *"
                  error={!!errors.division_ids}
                  helperText={errors.division_ids}
                />
              )}
              disabled={formData.state_ids.length === 0}
            />
          )}

          {['Parliament', 'Assembly', 'Block', 'Booth'].includes(formData.role) && (
            <Autocomplete
              multiple
              options={filteredParliaments}
              getOptionLabel={(option) => option.name}
              value={filteredParliaments.filter(par => formData.parliament_ids.includes(par._id))}
              onChange={(e, newValue) => handleMultiSelectChange('parliament_ids', newValue.map(v => v._id))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Parliaments *"
                  error={!!errors.parliament_ids}
                  helperText={errors.parliament_ids}
                />
              )}
              disabled={formData.division_ids.length === 0}
            />
          )}

          {['Assembly', 'Block', 'Booth'].includes(formData.role) && (
            <Autocomplete
              multiple
              options={filteredAssemblies}
              getOptionLabel={(option) => option.name}
              value={filteredAssemblies.filter(asm => formData.assembly_ids.includes(asm._id))}
              onChange={(e, newValue) => handleMultiSelectChange('assembly_ids', newValue.map(v => v._id))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Assemblies *"
                  error={!!errors.assembly_ids}
                  helperText={errors.assembly_ids}
                />
              )}
              disabled={formData.parliament_ids.length === 0}
            />
          )}

          {['Block', 'Booth'].includes(formData.role) && (
            <Autocomplete
              multiple
              options={filteredBlocks}
              getOptionLabel={(option) => option.name}
              value={filteredBlocks.filter(blk => formData.block_ids.includes(blk._id))}
              onChange={(e, newValue) => handleMultiSelectChange('block_ids', newValue.map(v => v._id))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Blocks *"
                  error={!!errors.block_ids}
                  helperText={errors.block_ids}
                />
              )}
              disabled={formData.assembly_ids.length === 0}
            />
          )}

          {formData.role === 'Booth' && (
            <Autocomplete
              multiple
              options={filteredBooths}
              getOptionLabel={(option) => `${option.name} (No: ${option.booth_number})`}
              value={filteredBooths.filter(booth => formData.booth_ids.includes(booth._id))}
              onChange={(e, newValue) => handleMultiSelectChange('booth_ids', newValue.map(v => v._id))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Booths *"
                  error={!!errors.booth_ids}
                  helperText={errors.booth_ids}
                />
              )}
              disabled={formData.block_ids.length === 0}
            />
          )}
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
          {isSubmitting ? 'Saving...' : (user ? 'Update' : 'Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}