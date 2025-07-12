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
  FormControlLabel,
  Chip
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

  // Always show all divisions, parliaments, assemblies, blocks, and booths
  useEffect(() => {
    setFilteredDivisions(divisions);
    setFilteredParliaments(parliaments);
    setFilteredAssemblies(assemblies);
    setFilteredBlocks(blocks);
    setFilteredBooths(booths);
  }, [divisions, parliaments, assemblies, blocks, booths]);

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
      default:
        break;
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = [
      'username', 'mobile', 'email', 'role'
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

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name, value) => {
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitError) setSubmitError('');

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectAll = (name, options) => {
    const allIds = options.map(option => option._id);
    setFormData(prev => ({ ...prev, [name]: allIds }));
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

  const renderAutocomplete = (name, label, options, selectedIds, allLabel) => {
    const selectedOptions = options.filter(option => selectedIds.includes(option._id));
    
    return (
      <Stack direction="column" spacing={1}>
        <Autocomplete
          multiple
          options={options}
          getOptionLabel={(option) => option.name}
          value={selectedOptions}
          onChange={(e, newValue) => handleMultiSelectChange(name, newValue.map(v => v._id))}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              error={!!errors[name]}
              helperText={errors[name]}
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option._id}
                label={option.name}
                size="small"
              />
            ))
          }
        />
        {options.length > 0 && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleSelectAll(name, options)}
            disabled={selectedIds.length === options.length}
          >
            Select {allLabel || 'All'}
          </Button>
        )}
      </Stack>
    );
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

          {/* Always show all geographical selectors */}
          {renderAutocomplete('state_ids', 'States', states, formData.state_ids, 'All States')}
          {renderAutocomplete('division_ids', 'Divisions', filteredDivisions, formData.division_ids, 'All Divisions')}
          {renderAutocomplete('parliament_ids', 'Parliaments', filteredParliaments, formData.parliament_ids, 'All Parliaments')}
          {renderAutocomplete('assembly_ids', 'Assemblies', filteredAssemblies, formData.assembly_ids, 'All Assemblies')}
          {renderAutocomplete('block_ids', 'Blocks', filteredBlocks, formData.block_ids, 'All Blocks')}
          {renderAutocomplete('booth_ids', 'Booths', filteredBooths, formData.booth_ids, 'All Booths')}
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