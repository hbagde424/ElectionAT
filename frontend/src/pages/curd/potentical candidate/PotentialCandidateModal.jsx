import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    InputLabel,
    Select,
    MenuItem,
    FormControl,
    Grid,
    Chip,
    Avatar,
    Box,
    Typography,
    Autocomplete
} from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEffect, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function PotentialCandidateModal({
    open,
    modalToggler,
    candidate,
    parties = [],    // Provide default empty array
    assemblies = [], // Provide default empty array
    electionYears = [], // Provide default empty array
    refresh
}) {
    const [formData, setFormData] = useState({
        name: '',
        party_id: '',
        constituency_id: '',
        history: '',
        post_details: {
            postname: '',
            from_date: null,
            to_date: null,
            place: ''
        },
        pros: '',
        cons: '',
        election_year_id: '',
        image: '',
        status: 'under_review',
        description: ''
    });

    useEffect(() => {
        if (candidate) {
            setFormData({
                name: candidate.name || '',
                party_id: candidate.party_id?._id || '',
                constituency_id: candidate.constituency_id?._id || '',
                history: candidate.history || '',
                post_details: {
                    postname: candidate.post_details?.postname || '',
                    from_date: candidate.post_details?.from_date ? new Date(candidate.post_details.from_date) : null,
                    to_date: candidate.post_details?.to_date ? new Date(candidate.post_details.to_date) : null,
                    place: candidate.post_details?.place || ''
                },
                pros: candidate.pros || '',
                cons: candidate.cons || '',
                election_year_id: candidate.election_year_id?._id || '',
                image: candidate.image || '',
                status: candidate.status || 'under_review',
                description: candidate.description || ''
            });
        } else {
            setFormData({
                name: '',
                party_id: '',
                constituency_id: '',
                history: '',
                post_details: {
                    postname: '',
                    from_date: null,
                    to_date: null,
                    place: ''
                },
                pros: '',
                cons: '',
                election_year_id: '',
                image: '',
                status: 'under_review',
                description: ''
            });
        }
    }, [candidate]);
    // For ReactQuill editor
    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('post_details.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                post_details: {
                    ...prev.post_details,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDateChange = (name, date) => {
        if (name.includes('post_details.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                post_details: {
                    ...prev.post_details,
                    [field]: date
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: date }));
        }
    };

    const handleSubmit = async () => {
        const method = candidate ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = candidate
            ? `${import.meta.env.VITE_APP_API_URL}/potential-candidates/${candidate._id}`
            : `${import.meta.env.VITE_APP_API_URL}/potential-candidates`;

        try {
            const submitData = {
                ...formData,
                description: typeof formData.description === 'string' ? formData.description : ''
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
                const data = await res.json();
                console.error('Submission failed:', data);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
                <DialogTitle>{candidate ? 'Edit Potential Candidate' : 'Add Potential Candidate'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={2}>
                        {formData.image && (
                            <Box display="flex" justifyContent="center">
                                <Avatar src={formData.image} alt={formData.name} sx={{ width: 100, height: 100 }} />
                            </Box>
                        )}

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Candidate Name <span style={{ color: 'red' }}>*</span></InputLabel>
                                    <TextField
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Image URL</InputLabel>
                                    <TextField
                                        name="image"
                                        value={formData.image}
                                        onChange={handleChange}
                                        fullWidth
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </Stack>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Party <span style={{ color: 'red' }}>*</span></InputLabel>
                                    <Autocomplete
                                        options={parties}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={parties.find(party => party._id === formData.party_id) || 
                                               (formData.party_id && candidate?.party_id ? 
                                                { _id: formData.party_id, name: candidate.party_id.name || 'Loading...' } : 
                                                null)}
                                        onChange={(event, newValue) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                party_id: newValue ? newValue._id : ''
                                            }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Search and select party"
                                                required
                                            />
                                        )}
                                        renderOption={(props, option) => (
                                            <Box component="li" {...props}>
                                                <Chip label={option.name} color="primary" size="small" />
                                            </Box>
                                        )}
                                        isOptionEqualToValue={(option, value) => option._id === value._id}
                                        filterOptions={(options, { inputValue }) =>
                                            options.filter(option =>
                                                option.name.toLowerCase().includes(inputValue.toLowerCase())
                                            )
                                        }
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Constituency <span style={{ color: 'red' }}>*</span></InputLabel>
                                    <Autocomplete
                                        options={assemblies}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={assemblies.find(assembly => assembly._id === formData.constituency_id) || 
                                               (formData.constituency_id && candidate?.constituency_id ? 
                                                { _id: formData.constituency_id, name: candidate.constituency_id.name || 'Loading...' } : 
                                                null)}
                                        onChange={(event, newValue) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                constituency_id: newValue ? newValue._id : ''
                                            }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Search and select constituency"
                                                required
                                            />
                                        )}
                                        isOptionEqualToValue={(option, value) => option._id === value._id}
                                        filterOptions={(options, { inputValue }) =>
                                            options.filter(option =>
                                                option.name.toLowerCase().includes(inputValue.toLowerCase())
                                            )
                                        }
                                    />
                                </Stack>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Election Year <span style={{ color: 'red' }}>*</span></InputLabel>
                                    <Autocomplete
                                        options={electionYears}
                                        getOptionLabel={(option) => option.year?.toString() || ''}
                                        value={electionYears.find(year => year._id === formData.election_year_id) || 
                                               (formData.election_year_id && candidate?.election_year_id ? 
                                                { _id: formData.election_year_id, year: candidate.election_year_id.year || 'Loading...' } : 
                                                null)}
                                        onChange={(event, newValue) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                election_year_id: newValue ? newValue._id : ''
                                            }));
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder="Search and select election year"
                                                required
                                            />
                                        )}
                                        isOptionEqualToValue={(option, value) => option._id === value._id}
                                        filterOptions={(options, { inputValue }) =>
                                            options.filter(option =>
                                                option.year?.toString().includes(inputValue)
                                            )
                                        }
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Status <span style={{ color: 'red' }}>*</span></InputLabel>
                                    <FormControl fullWidth>
                                        <Select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            required
                                        >
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="inactive">Inactive</MenuItem>
                                            <MenuItem value="under_review">Under Review</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Grid>
                        </Grid>

                        <Stack spacing={1}>
                            <InputLabel>Political History</InputLabel>
                            <TextField
                                name="history"
                                value={formData.history}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </Stack>
                        {/* Row: Description (Rich Text) */}
                        <Stack spacing={1}>
                            <InputLabel>Description</InputLabel>
                            <ReactQuill
                                theme="snow"
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                placeholder="Enter description (optional)"
                                style={{ minHeight: 100 }}
                            />
                        </Stack>

                        <Typography variant="h6">Previous Post Details</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Post Name <span style={{ color: 'red' }}>*</span></InputLabel>
                                    <TextField
                                        name="post_details.postname"
                                        value={formData.post_details.postname}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Place <span style={{ color: 'red' }}>*</span></InputLabel>
                                    <TextField
                                        name="post_details.place"
                                        value={formData.post_details.place}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>From Date</InputLabel>
                                    <DatePicker
                                        value={formData.post_details.from_date}
                                        onChange={(date) => handleDateChange('post_details.from_date', date)}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>To Date</InputLabel>
                                    <DatePicker
                                        value={formData.post_details.to_date}
                                        onChange={(date) => handleDateChange('post_details.to_date', date)}
                                        minDate={formData.post_details.from_date}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Pros</InputLabel>
                                    <TextField
                                        name="pros"
                                        value={formData.pros}
                                        onChange={handleChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Cons</InputLabel>
                                    <TextField
                                        name="cons"
                                        value={formData.cons}
                                        onChange={handleChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => modalToggler(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {candidate ? 'Update' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}
