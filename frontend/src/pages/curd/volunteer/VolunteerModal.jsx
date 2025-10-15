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
  Box,
  Typography,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useEffect, useState } from 'react';
import { DocumentUpload, Trash, Eye } from 'iconsax-react';
import { usePermissions } from 'contexts/PermissionContext';

export default function BoothVolunteerModal({
  open,
  modalToggler,
  volunteer,
  states,
  divisions,
  parliaments,
  assemblies,
  blocks,
  booths,
  parties,
  users,
  refresh
}) {
  const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    post: '',
    area_responsibility: '',
    activity_level: 'Medium',
    remarks: '',
    booth_id: '',
    party_id: '',
    state_id: '',
    division_id: '',
    assembly_id: '',
    parliament_id: '',
    block_id: ''
  });

  // Document state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);

  // Filtered dropdown options
  const [filteredDivisions, setFilteredDivisions] = useState([]);
  const [filteredParliaments, setFilteredParliaments] = useState([]);
  const [filteredAssemblies, setFilteredAssemblies] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);

  // Filtered data based on user hierarchy permissions
  const [hierarchyFilteredStates, setHierarchyFilteredStates] = useState([]);
  const [hierarchyFilteredDivisions, setHierarchyFilteredDivisions] = useState([]);
  const [hierarchyFilteredParliaments, setHierarchyFilteredParliaments] = useState([]);
  const [hierarchyFilteredAssemblies, setHierarchyFilteredAssemblies] = useState([]);
  const [hierarchyFilteredBlocks, setHierarchyFilteredBlocks] = useState([]);
  const [hierarchyFilteredBooths, setHierarchyFilteredBooths] = useState([]);

  // Error and loading states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Filter data based on user hierarchy permissions
  useEffect(() => {
    if (!userHierarchy) {
      // No hierarchy restrictions - show all data
      setHierarchyFilteredStates(states);
      setHierarchyFilteredDivisions(divisions);
      setHierarchyFilteredParliaments(parliaments);
      setHierarchyFilteredAssemblies(assemblies);
      setHierarchyFilteredBlocks(blocks);
      setHierarchyFilteredBooths(booths);
      return;
    }

    const highestLevel = getUserHighestLevel();
    if (!highestLevel) {
      // No specific level - show all data
      setHierarchyFilteredStates(states);
      setHierarchyFilteredDivisions(divisions);
      setHierarchyFilteredParliaments(parliaments);
      setHierarchyFilteredAssemblies(assemblies);
      setHierarchyFilteredBlocks(blocks);
      setHierarchyFilteredBooths(booths);
      return;
    }

    // Filter based on user's highest access level
    switch (highestLevel.level) {
      case 'state':
        setHierarchyFilteredStates(states.filter(s => s._id === highestLevel.value));
        setHierarchyFilteredDivisions(divisions.filter(d => d.state_id?._id === highestLevel.value));
        setHierarchyFilteredParliaments(parliaments.filter(p => p.division_id?.state_id?._id === highestLevel.value));
        setHierarchyFilteredAssemblies(assemblies.filter(a => a.parliament_id?.division_id?.state_id?._id === highestLevel.value));
        setHierarchyFilteredBlocks(blocks.filter(b => b.assembly_id?.parliament_id?.division_id?.state_id?._id === highestLevel.value));
        setHierarchyFilteredBooths(booths.filter(booth => booth.block_id?.assembly_id?.parliament_id?.division_id?.state_id?._id === highestLevel.value));
        break;
      case 'division':
        setHierarchyFilteredStates(states.filter(s => s._id === highestLevel.state_id));
        setHierarchyFilteredDivisions(divisions.filter(d => d._id === highestLevel.value));
        setHierarchyFilteredParliaments(parliaments.filter(p => p.division_id?._id === highestLevel.value));
        setHierarchyFilteredAssemblies(assemblies.filter(a => a.parliament_id?.division_id?._id === highestLevel.value));
        setHierarchyFilteredBlocks(blocks.filter(b => b.assembly_id?.parliament_id?.division_id?._id === highestLevel.value));
        setHierarchyFilteredBooths(booths.filter(booth => booth.block_id?.assembly_id?.parliament_id?.division_id?._id === highestLevel.value));
        break;
      case 'parliament':
        setHierarchyFilteredStates(states.filter(s => s._id === highestLevel.state_id));
        setHierarchyFilteredDivisions(divisions.filter(d => d._id === highestLevel.division_id));
        setHierarchyFilteredParliaments(parliaments.filter(p => p._id === highestLevel.value));
        setHierarchyFilteredAssemblies(assemblies.filter(a => a.parliament_id?._id === highestLevel.value));
        setHierarchyFilteredBlocks(blocks.filter(b => b.assembly_id?.parliament_id?._id === highestLevel.value));
        setHierarchyFilteredBooths(booths.filter(booth => booth.block_id?.assembly_id?.parliament_id?._id === highestLevel.value));
        break;
      case 'assembly':
        setHierarchyFilteredStates(states.filter(s => s._id === highestLevel.state_id));
        setHierarchyFilteredDivisions(divisions.filter(d => d._id === highestLevel.division_id));
        setHierarchyFilteredParliaments(parliaments.filter(p => p._id === highestLevel.parliament_id));
        setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === highestLevel.value));
        setHierarchyFilteredBlocks(blocks.filter(b => b.assembly_id?._id === highestLevel.value));
        setHierarchyFilteredBooths(booths.filter(booth => booth.block_id?.assembly_id?._id === highestLevel.value));
        break;
      case 'block':
        setHierarchyFilteredStates(states.filter(s => s._id === highestLevel.state_id));
        setHierarchyFilteredDivisions(divisions.filter(d => d._id === highestLevel.division_id));
        setHierarchyFilteredParliaments(parliaments.filter(p => p._id === highestLevel.parliament_id));
        setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === highestLevel.assembly_id));
        setHierarchyFilteredBlocks(blocks.filter(b => b._id === highestLevel.value));
        setHierarchyFilteredBooths(booths.filter(booth => booth.block_id?._id === highestLevel.value));
        break;
      case 'booth':
        setHierarchyFilteredStates(states.filter(s => s._id === highestLevel.state_id));
        setHierarchyFilteredDivisions(divisions.filter(d => d._id === highestLevel.division_id));
        setHierarchyFilteredParliaments(parliaments.filter(p => p._id === highestLevel.parliament_id));
        setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === highestLevel.assembly_id));
        setHierarchyFilteredBlocks(blocks.filter(b => b._id === highestLevel.block_id));
        setHierarchyFilteredBooths(booths.filter(booth => booth._id === highestLevel.value));
        break;
      default:
        setHierarchyFilteredStates(states);
        setHierarchyFilteredDivisions(divisions);
        setHierarchyFilteredParliaments(parliaments);
        setHierarchyFilteredAssemblies(assemblies);
        setHierarchyFilteredBlocks(blocks);
        setHierarchyFilteredBooths(booths);
    }
  }, [userHierarchy, states, divisions, parliaments, assemblies, blocks, booths, getUserHighestLevel]);

  // Initialize form data when modal opens or volunteer changes
  useEffect(() => {
    if (!open) return;

    if (volunteer) {
      console.log('Volunteer data received:', volunteer);
      console.log('Available states:', states);
      console.log('Available divisions:', divisions);
      console.log('Available parties:', parties);

      const formValues = {
        name: volunteer.name || '',
        phone: volunteer.phone || '',
        email: volunteer.email || '',
        role: volunteer.role || '',
        post: volunteer.post || '',
        area_responsibility: volunteer.area_responsibility || '',
        activity_level: volunteer.activity_level || 'Medium',
        remarks: volunteer.remarks || '',
        booth_id: getID(volunteer.booth_id),
        party_id: getID(volunteer.party_id),
        state_id: getID(volunteer.state_id),
        division_id: getID(volunteer.division_id),
        assembly_id: getID(volunteer.assembly_id),
        parliament_id: getID(volunteer.parliament_id),
        block_id: getID(volunteer.block_id)
      };

      console.log('Form values being set:', formValues);
      setFormData(formValues);

      // Set up filtered arrays based on volunteer's hierarchy
      const stateId = getID(volunteer.state_id);
      const divisionId = getID(volunteer.division_id);
      const parliamentId = getID(volunteer.parliament_id);
      const assemblyId = getID(volunteer.assembly_id);
      const blockId = getID(volunteer.block_id);

      if (stateId) {
        const filtered = divisions.filter(div => getID(div.state_id) === stateId);
        setFilteredDivisions(filtered);
        console.log('Setting filtered divisions:', filtered);
      }

      if (divisionId) {
        const filtered = parliaments.filter(par => getID(par.division_id) === divisionId);
        setFilteredParliaments(filtered);
        console.log('Setting filtered parliaments:', filtered);
      }

      if (parliamentId) {
        const filtered = assemblies.filter(asm => getID(asm.parliament_id) === parliamentId);
        setFilteredAssemblies(filtered);
        console.log('Setting filtered assemblies:', filtered);
      }

      if (assemblyId) {
        const filtered = blocks.filter(blk => getID(blk.assembly_id) === assemblyId);
        setFilteredBlocks(filtered);
        console.log('Setting filtered blocks:', filtered);
      }

      if (blockId) {
        const filtered = booths.filter(booth => getID(booth.block_id) === blockId);
        setFilteredBooths(filtered);
        console.log('Setting filtered booths:', filtered);
      }

      // Set existing documents
      setExistingDocuments(volunteer.documents || []);
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        role: '',
        post: '',
        area_responsibility: '',
        activity_level: 'Medium',
        remarks: '',
        booth_id: '',
        party_id: '',
        state_id: '',
        division_id: '',
        assembly_id: '',
        parliament_id: '',
        block_id: ''
      });

      // Reset documents
      setExistingDocuments([]);
    }

    // Reset file selection
    setSelectedFiles([]);
    setFilteredDivisions([]);
    setFilteredParliaments([]);
    setFilteredAssemblies([]);
    setFilteredBlocks([]);
    setFilteredBooths([]);
  }, [open, volunteer]);

  // Helper function to get ID whether it's an object or string
  const getID = (item) => {
    if (!item) return '';
    return typeof item === 'object' ? item._id : item;
  };

  // Filter divisions when state changes
  useEffect(() => {
    if (!formData.state_id) {
      setFilteredDivisions([]);
      return;
    }

    const filtered = hierarchyFilteredDivisions.filter(div =>
      getID(div.state_id) === formData.state_id
    );
    setFilteredDivisions(filtered);
  }, [formData.state_id, hierarchyFilteredDivisions]);

  // Filter parliaments when division changes
  useEffect(() => {
    if (!formData.division_id) {
      setFilteredParliaments([]);
      return;
    }

    const filtered = hierarchyFilteredParliaments.filter(par =>
      getID(par.division_id) === formData.division_id
    );
    setFilteredParliaments(filtered);
  }, [formData.division_id, hierarchyFilteredParliaments]);

  // Filter assemblies when parliament changes
  useEffect(() => {
    if (!formData.parliament_id) {
      setFilteredAssemblies([]);
      return;
    }

    const filtered = hierarchyFilteredAssemblies.filter(asm =>
      getID(asm.parliament_id) === formData.parliament_id
    );
    setFilteredAssemblies(filtered);
  }, [formData.parliament_id, hierarchyFilteredAssemblies]);

  // Filter blocks when assembly changes
  useEffect(() => {
    if (!formData.assembly_id) {
      setFilteredBlocks([]);
      return;
    }

    const filtered = hierarchyFilteredBlocks.filter(blk =>
      getID(blk.assembly_id) === formData.assembly_id
    );
    setFilteredBlocks(filtered);
  }, [formData.assembly_id, hierarchyFilteredBlocks]);

  // Filter booths when block changes
  useEffect(() => {
    if (!formData.block_id) {
      setFilteredBooths([]);
      return;
    }

    const filtered = hierarchyFilteredBooths.filter(booth =>
      getID(booth.block_id) === formData.block_id
    );
    setFilteredBooths(filtered);
  }, [formData.block_id, hierarchyFilteredBooths]);

  // Validate individual field
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length === 0) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'phone':
        if (!value) return 'Phone is required';
        if (!/^[0-9]{10}$/.test(value)) return 'Invalid phone number (10 digits required)';
        break;
      case 'email':
        if (value && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value))
          return 'Invalid email format';
        break;
      case 'booth_id':
        if (!value) return 'Booth selection is required';
        break;
      case 'party_id':
        if (!value) return 'Party selection is required';
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
    const requiredFields = ['name', 'phone', 'booth_id', 'party_id', 'state_id'];

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
      }

      return { ...prev, ...updates };
    });
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  // Remove selected file
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Delete existing document
  const deleteExistingDocument = async (documentId) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/booth-volunteers/${volunteer._id}/documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('serviceToken')}`
          }
        }
      );

      if (response.ok) {
        setExistingDocuments(prev => prev.filter(doc => doc._id !== documentId));
      } else {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setSubmitError('Failed to delete document');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const method = volunteer ? 'PUT' : 'POST';
      const token = localStorage.getItem('serviceToken');
      const url = volunteer
        ? `${import.meta.env.VITE_APP_API_URL}/booth-volunteers/${volunteer._id}`
        : `${import.meta.env.VITE_APP_API_URL}/booth-volunteers`;

      const currentUser = JSON.parse(localStorage.getItem('user'));

      // Create FormData for file upload
      const formDataToSend = new FormData();

      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add user info
      if (volunteer) {
        formDataToSend.append('updated_by', currentUser?._id);
      } else {
        formDataToSend.append('created_by', currentUser?._id);
      }

      // Add files
      selectedFiles.forEach(file => {
        formDataToSend.append('documents', file);
      });

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
          // Don't set Content-Type, let browser set it with boundary for multipart/form-data
        },
        body: formDataToSend
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
          setSubmitError(errorData.message || 'Failed to save volunteer. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving volunteer:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
      <DialogTitle>{volunteer ? 'Edit Booth Volunteer' : 'Add Booth Volunteer'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={2}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          {/* Personal Info Fields */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="name"
                label="Name *"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="phone"
                label="Phone *"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                error={!!errors.phone}
                helperText={errors.phone}
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
          </Grid>


          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="role"
                label="Role"
                value={formData.role}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>



          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                name="area_responsibility"
                label="Area Responsibility"
                value={formData.area_responsibility}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Activity Level</InputLabel>
                <Select
                  name="activity_level"
                  value={formData.activity_level}
                  onChange={handleChange}
                  label="Activity Level"
                >
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TextField
            name="remarks"
            label="Remarks"
            value={formData.remarks}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.party_id}>
                <Autocomplete
                  options={parties || []}
                  getOptionLabel={(option) => option.name || ''}
                  isOptionEqualToValue={(option, value) => option._id === value || option._id === value._id}
                  value={parties.find(p => p._id === formData.party_id) || (formData.party_id ? { _id: formData.party_id, name: volunteer?.party_id?.name || '' } : null)}
                  onChange={(e, newValue) => {
                    const id = newValue ? newValue._id : '';
                    setFormData(prev => ({ ...prev, party_id: id }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Party *"
                      required
                      error={!!errors.party_id}
                      helperText={errors.party_id}
                    />
                  )}
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="post"
                label="Post"
                value={formData.post}
                onChange={handleChange}
                fullWidth
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
                  {/* Show temporary state object if in edit mode and state not found in options */}
                  {volunteer && volunteer.state_id && volunteer.state_id.name &&
                    !states.find(s => s._id === getID(volunteer.state_id)) && (
                      <MenuItem key={getID(volunteer.state_id)} value={getID(volunteer.state_id)}>
                        {volunteer.state_id.name}
                      </MenuItem>
                    )}
                  {hierarchyFilteredStates.map(state => (
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
                  {/* Show volunteer's division if not in filtered list */}
                  {volunteer && volunteer.division_id && volunteer.division_id.name &&
                    formData.division_id && !filteredDivisions.find(d => d._id === formData.division_id) && (
                      <MenuItem key={formData.division_id} value={formData.division_id}>
                        {volunteer.division_id.name}
                      </MenuItem>
                    )}
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
                  {/* Show volunteer's parliament if not in filtered list */}
                  {volunteer && volunteer.parliament_id && volunteer.parliament_id.name &&
                    formData.parliament_id && !filteredParliaments.find(p => p._id === formData.parliament_id) && (
                      <MenuItem key={formData.parliament_id} value={formData.parliament_id}>
                        {volunteer.parliament_id.name}
                      </MenuItem>
                    )}
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
                  {/* Show volunteer's assembly if not in filtered list */}
                  {volunteer && volunteer.assembly_id && volunteer.assembly_id.name &&
                    formData.assembly_id && !filteredAssemblies.find(a => a._id === formData.assembly_id) && (
                      <MenuItem key={formData.assembly_id} value={formData.assembly_id}>
                        {volunteer.assembly_id.name}
                      </MenuItem>
                    )}
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
                  {/* Show volunteer's block if not in filtered list */}
                  {volunteer && volunteer.block_id && volunteer.block_id.name &&
                    formData.block_id && !filteredBlocks.find(b => b._id === formData.block_id) && (
                      <MenuItem key={formData.block_id} value={formData.block_id}>
                        {volunteer.block_id.name}
                      </MenuItem>
                    )}
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
                  {/* Show volunteer's booth if not in filtered list */}
                  {volunteer && volunteer.booth_id && volunteer.booth_id.name &&
                    formData.booth_id && !filteredBooths.find(b => b._id === formData.booth_id) && (
                      <MenuItem key={formData.booth_id} value={formData.booth_id}>
                        {volunteer.booth_id.name} {volunteer.booth_id.booth_number ? `(No: ${volunteer.booth_id.booth_number})` : ''}
                      </MenuItem>
                    )}
                  {filteredBooths.map(booth => (
                    <MenuItem key={booth._id} value={booth._id}>
                      {booth.name} (No: {booth.booth_number})
                    </MenuItem>
                  ))}
                </Select>
                {errors.booth_id && <FormHelperText>{errors.booth_id}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Documents Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Documents
              </Typography>

              {/* File Upload */}
              <Box sx={{ mb: 2 }}>
                <input
                  accept="*/*"
                  style={{ display: 'none' }}
                  id="document-upload"
                  multiple
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="document-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<DocumentUpload />}
                    sx={{ mb: 2 }}
                  >
                    Upload Documents
                  </Button>
                </label>
              </Box>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Selected Files:
                  </Typography>
                  <List dense>
                    {selectedFiles.map((file, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => removeSelectedFile(index)}
                            size="small"
                          >
                            <Trash size={16} />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Existing Documents */}
              {existingDocuments.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Existing Documents:
                  </Typography>
                  <List dense>
                    {existingDocuments.map((doc) => (
                      <ListItem key={doc._id}>
                        <ListItemText
                          primary={doc.originalname || doc.filename}
                          secondary={`${(doc.size / 1024 / 1024).toFixed(2)} MB - Uploaded: ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                        />
                        <ListItemSecondaryAction>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              onClick={() => window.open(`${import.meta.env.VITE_APP_API_URL.replace('/api', '')}/uploads/volunteer-docs/${doc.filename}`, '_blank')}
                            >
                              <Eye size={16} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => deleteExistingDocument(doc._id)}
                            >
                              <Trash size={16} />
                            </IconButton>
                          </Stack>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
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
          {isSubmitting ? 'Saving...' : (volunteer ? 'Update' : 'Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
