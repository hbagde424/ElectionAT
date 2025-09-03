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
  Chip,
  Box
} from '@mui/material';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, getAvailableEntities } from '../../../utils/rolePermissions';
import { useEffect, useState } from 'react';
import RolePermissionsView from '../../../components/RolePermissionsView';

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
    permissions: {},
    isActive: true
  });

  // Get available entities based on selected role
  const availableEntities = formData.role ? getAvailableEntities(formData.role) : [];

  // Cascading filter functions
  const getFilteredDivisions = () => {
    if (!formData.state_ids.length) return divisions || [];
    return (divisions || []).filter(division => {
      // Handle populated state_id field
      const stateId = division.state_id && typeof division.state_id === 'object'
        ? division.state_id._id
        : division.state_id;
      return formData.state_ids.includes(stateId);
    });
  };

  const getFilteredParliaments = () => {
    const filteredDivisions = getFilteredDivisions();
    if (!formData.division_ids.length) {
      // If no divisions selected, filter by states
      if (!formData.state_ids.length) return parliaments || [];
      return (parliaments || []).filter(parliament => {
        const stateId = parliament.state_id && typeof parliament.state_id === 'object'
          ? parliament.state_id._id
          : parliament.state_id;
        return formData.state_ids.includes(stateId);
      });
    }
    return (parliaments || []).filter(parliament => {
      const divisionId = parliament.division_id && typeof parliament.division_id === 'object'
        ? parliament.division_id._id
        : parliament.division_id;
      return formData.division_ids.includes(divisionId);
    });
  };

  const getFilteredAssemblies = () => {
    if (!formData.parliament_ids.length) {
      // Filter by divisions or states
      const filteredDivisions = getFilteredDivisions();
      if (!formData.division_ids.length) {
        if (!formData.state_ids.length) return assemblies || [];
        return (assemblies || []).filter(assembly => {
          const stateId = assembly.state_id && typeof assembly.state_id === 'object'
            ? assembly.state_id._id
            : assembly.state_id;
          return formData.state_ids.includes(stateId);
        });
      }
      return (assemblies || []).filter(assembly => {
        const divisionId = assembly.division_id && typeof assembly.division_id === 'object'
          ? assembly.division_id._id
          : assembly.division_id;
        return formData.division_ids.includes(divisionId);
      });
    }
    return (assemblies || []).filter(assembly => {
      const parliamentId = assembly.parliament_id && typeof assembly.parliament_id === 'object'
        ? assembly.parliament_id._id
        : assembly.parliament_id;
      return formData.parliament_ids.includes(parliamentId);
    });
  };

  const getFilteredBlocks = () => {
    if (!formData.assembly_ids.length) {
      // Filter by higher levels
      const filteredParliaments = getFilteredParliaments();
      if (!formData.parliament_ids.length) {
        const filteredDivisions = getFilteredDivisions();
        if (!formData.division_ids.length) {
          if (!formData.state_ids.length) return blocks || [];
          return (blocks || []).filter(block => {
            const stateId = block.state_id && typeof block.state_id === 'object'
              ? block.state_id._id
              : block.state_id;
            return formData.state_ids.includes(stateId);
          });
        }
        return (blocks || []).filter(block => {
          const divisionId = block.division_id && typeof block.division_id === 'object'
            ? block.division_id._id
            : block.division_id;
          return formData.division_ids.includes(divisionId);
        });
      }
      return (blocks || []).filter(block => {
        const parliamentId = block.parliament_id && typeof block.parliament_id === 'object'
          ? block.parliament_id._id
          : block.parliament_id;
        return formData.parliament_ids.includes(parliamentId);
      });
    }
    return (blocks || []).filter(block => {
      const assemblyId = block.assembly_id && typeof block.assembly_id === 'object'
        ? block.assembly_id._id
        : block.assembly_id;
      return formData.assembly_ids.includes(assemblyId);
    });
  };

  const getFilteredBooths = () => {
    if (!formData.block_ids.length) {
      // Filter by higher levels
      const filteredAssemblies = getFilteredAssemblies();
      if (!formData.assembly_ids.length) {
        const filteredParliaments = getFilteredParliaments();
        if (!formData.parliament_ids.length) {
          const filteredDivisions = getFilteredDivisions();
          if (!formData.division_ids.length) {
            if (!formData.state_ids.length) return booths || [];
            return (booths || []).filter(booth => {
              const stateId = booth.state_id && typeof booth.state_id === 'object'
                ? booth.state_id._id
                : booth.state_id;
              return formData.state_ids.includes(stateId);
            });
          }
          return (booths || []).filter(booth => {
            const divisionId = booth.division_id && typeof booth.division_id === 'object'
              ? booth.division_id._id
              : booth.division_id;
            return formData.division_ids.includes(divisionId);
          });
        }
        return (booths || []).filter(booth => {
          const parliamentId = booth.parliament_id && typeof booth.parliament_id === 'object'
            ? booth.parliament_id._id
            : booth.parliament_id;
          return formData.parliament_ids.includes(parliamentId);
        });
      }
      return (booths || []).filter(booth => {
        const assemblyId = booth.assembly_id && typeof booth.assembly_id === 'object'
          ? booth.assembly_id._id
          : booth.assembly_id;
        return formData.assembly_ids.includes(assemblyId);
      });
    }
    return (booths || []).filter(booth => {
      const blockId = booth.block_id && typeof booth.block_id === 'object'
        ? booth.block_id._id
        : booth.block_id;
      return formData.block_ids.includes(blockId);
    });
  };

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
        permissions: user.permissions || ROLE_PERMISSIONS[user.role] || {},
        state_ids: (user.state_ids || []).map(item => typeof item === 'object' ? item._id : item),
        division_ids: (user.division_ids || []).map(item => typeof item === 'object' ? item._id : item),
        parliament_ids: (user.parliament_ids || []).map(item => typeof item === 'object' ? item._id : item),
        assembly_ids: (user.assembly_ids || []).map(item => typeof item === 'object' ? item._id : item),
        block_ids: (user.block_ids || []).map(item => typeof item === 'object' ? item._id : item),
        booth_ids: (user.booth_ids || []).map(item => typeof item === 'object' ? item._id : item),
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
  }, [open, user]);

  const getID = (item) => {
    if (!item) return '';
    return typeof item === 'object' ? item._id : item;
  };

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

    // Validate that appropriate IDs are selected based on role (backend expects role values like 'Division', 'State', etc.)
    const role = formData.role;
    if (role) {
      if (role === 'State' && formData.state_ids.length === 0) {
        newErrors.state_ids = 'State selection is required for State Admin';
      }
      if (role === 'Division' && formData.division_ids.length === 0) {
        newErrors.division_ids = 'Division selection is required for Division Admin';
      }
      if (role === 'Parliament' && formData.parliament_ids.length === 0) {
        newErrors.parliament_ids = 'Parliament selection is required for Parliament Admin';
      }
      if (role === 'Assembly' && formData.assembly_ids.length === 0) {
        newErrors.assembly_ids = 'Assembly selection is required for Assembly Admin';
      }
      if (role === 'Block' && formData.block_ids.length === 0) {
        newErrors.block_ids = 'Block selection is required for Block Admin';
      }
      if (role === 'Booth' && formData.booth_ids.length === 0) {
        newErrors.booth_ids = 'Booth selection is required for Booth Admin';
      }
    }

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

    setFormData(prev => {
      const newData = { ...prev, [name]: value };

      // Clear dependent selections when parent changes
      if (name === 'state_ids') {
        newData.division_ids = [];
        newData.parliament_ids = [];
        newData.assembly_ids = [];
        newData.block_ids = [];
        newData.booth_ids = [];
      } else if (name === 'division_ids') {
        newData.parliament_ids = [];
        newData.assembly_ids = [];
        newData.block_ids = [];
        newData.booth_ids = [];
      } else if (name === 'parliament_ids') {
        newData.assembly_ids = [];
        newData.block_ids = [];
        newData.booth_ids = [];
      } else if (name === 'assembly_ids') {
        newData.block_ids = [];
        newData.booth_ids = [];
      } else if (name === 'block_ids') {
        newData.booth_ids = [];
      }

      return newData;
    });
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
        ? `${import.meta.env.VITE_APP_API_URL}/users/${user._id}`
        : `${import.meta.env.VITE_APP_API_URL}/users/register`;

      const currentUser = JSON.parse(localStorage.getItem('user'));
      // Get permissions based on role
      const permissions = ROLE_PERMISSIONS[formData.role] || {};

      const submitData = {
        ...formData,
        permissions,
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
    // Ensure options is an array and selectedIds is an array
    const safeOptions = Array.isArray(options) ? options : [];
    const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];
    const selectedOptions = safeOptions.filter(option => safeSelectedIds.includes(option._id));

    return (
      <Stack direction="column" spacing={1}>
        <Autocomplete
          multiple
          options={safeOptions}
          getOptionLabel={(option) => option.name || ''}
          value={selectedOptions}
          onChange={(e, newValue) => {
            const newIds = newValue.map(v => v._id);
            handleMultiSelectChange(name, newIds);
          }}
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
            disabled={selectedOptions.length === options.length}
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
                  {/* Only use backend-compatible role values */}
                  <MenuItem value="superAdmin">Super Admin</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="State">State Admin</MenuItem>
                  <MenuItem value="Division">Division Admin</MenuItem>
                  <MenuItem value="Parliament">Parliament Admin</MenuItem>
                  <MenuItem value="Assembly">Assembly Admin</MenuItem>
                  <MenuItem value="Block">Block Admin</MenuItem>
                  <MenuItem value="Booth">Booth Admin</MenuItem>
                </Select>
                {formData.role && (
                  <Box sx={{ mt: 2 }}>
                    <RolePermissionsView role={formData.role} />
                  </Box>
                )}
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

          {/* Geographical selectors with cascading filtering */}
          {renderAutocomplete('state_ids', 'States', states, formData.state_ids, 'All States')}
          {renderAutocomplete('division_ids', 'Divisions', getFilteredDivisions(), formData.division_ids, 'All Divisions')}
          {renderAutocomplete('parliament_ids', 'Parliaments', getFilteredParliaments(), formData.parliament_ids, 'All Parliaments')}
          {renderAutocomplete('assembly_ids', 'Assemblies', getFilteredAssemblies(), formData.assembly_ids, 'All Assemblies')}
          {renderAutocomplete('block_ids', 'Blocks', getFilteredBlocks(), formData.block_ids, 'All Blocks')}
          {renderAutocomplete('booth_ids', 'Booths', getFilteredBooths(), formData.booth_ids, 'All Booths')}
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
