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
    Typography
} from '@mui/material';
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
        status: 'under_review'
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
                status: candidate.status || 'under_review'
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
                status: 'under_review'
            });
        }
    }, [candidate]);

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
    console.log('Election Years in Modal:', electionYears);
console.log('Current election_year_id:', formData.election_year_id);

    const handleSubmit = async () => {
        const method = candidate ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = candidate
            ? `http://localhost:5000/api/potential-candidates/${candidate._id}`
            : 'http://localhost:5000/api/potential-candidates';

        try {
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
                                    <InputLabel>Candidate Name</InputLabel>
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
                                    <InputLabel>Party</InputLabel>
                                    <FormControl fullWidth>
                                        <Select
                                            name="party_id"
                                            value={formData.party_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <MenuItem value="">Select Party</MenuItem>
                                            {parties.map((party) => (
                                                <MenuItem key={party._id} value={party._id}>
                                                    <Chip label={party.name} color="primary" size="small" />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Constituency</InputLabel>
                                    <FormControl fullWidth>
                                        <Select
                                            name="constituency_id"
                                            value={formData.constituency_id}
                                            onChange={handleChange}
                                            required
                                        >
                                            <MenuItem value="">Select Constituency</MenuItem>
                                            {assemblies.map((assembly) => (
                                                <MenuItem key={assembly._id} value={assembly._id}>
                                                    {assembly.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Election Year</InputLabel>
                                    <FormControl fullWidth>
                                        <InputLabel>Election Year</InputLabel>
                                        <Select
                                            name="election_year_id"
                                            value={formData.election_year_id}
                                            onChange={handleChange}
                                            required
                                            label="Election Year" // Add label prop
                                        >
                                            <MenuItem value="">Select Election Year</MenuItem>
                                            {electionYears.map((year) => (
                                                <MenuItem key={year._id} value={year._id}>
                                                    {year.year}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Status</InputLabel>
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

                        <Typography variant="h6">Previous Post Details</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Post Name</InputLabel>
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
                                    <InputLabel>Place</InputLabel>
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