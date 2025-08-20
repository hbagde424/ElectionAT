import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Box, Chip, Autocomplete
} from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

const electionTypes = ['General', 'Bye', 'Midterm', 'Special'];

export default function WinningCandidateModal({
    open,
    modalToggler,
    candidateEntry,
    states,
    divisions,
    parliaments,
    assemblies,
    parties,
    candidates,
    years,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        candidate_id: '',
        party_id: '',
        year_id: '',
        type: ['General'],
        poll_percentage: '',
        total_electors: '',
        total_votes: 0,
        voting_percentage: '',
        margin: 0,
        margin_percentage: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        description: ''
    });
    const [submitted, setSubmitted] = useState(false);

    // Add error message state
    const [errorMessage, setErrorMessage] = useState('');

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredCandidates, setFilteredCandidates] = useState([]);

    useEffect(() => {
        if (candidateEntry) {
            setFormData({
                candidate_id: candidateEntry.candidate_id?._id?.toString() || candidateEntry.candidate_id?.toString() || '',
                party_id: candidateEntry.party_id?._id?.toString() || candidateEntry.party_id?.toString() || '',
                year_id: candidateEntry.year_id?._id?.toString() || candidateEntry.year_id?.toString() || '',
                type: candidateEntry.type || ['General'],
                poll_percentage: candidateEntry.poll_percentage || '',
                total_electors: candidateEntry.total_electors || '',
                total_votes: candidateEntry.total_votes || 0,
                voting_percentage: candidateEntry.voting_percentage || '',
                margin: candidateEntry.margin || 0,
                margin_percentage: candidateEntry.margin_percentage || '',
                state_id: candidateEntry.state_id?._id?.toString() || candidateEntry.state_id?.toString() || '',
                division_id: candidateEntry.division_id?._id?.toString() || candidateEntry.division_id?.toString() || '',
                parliament_id: candidateEntry.parliament_id?._id?.toString() || candidateEntry.parliament_id?.toString() || '',
                assembly_id: candidateEntry.assembly_id?._id?.toString() || candidateEntry.assembly_id?.toString() || '',
                description: candidateEntry.description || ''
            });
        } else {
            setFormData({
                candidate_id: '',
                party_id: '',
                year_id: '',
                type: ['General'],
                poll_percentage: '',
                total_electors: '',
                total_votes: 0,
                voting_percentage: '',
                margin: 0,
                margin_percentage: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                description: ''
            });
        }
    }, [candidateEntry]);
    // For ReactQuill editor
    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
        }));
    };

    // State -> Division
    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions?.filter(division => {
                const divisionStateId = division.state_id?._id || division.state_id;
                return divisionStateId === formData.state_id;
            }) || [];
            setFilteredDivisions(filtered);

            if (formData.division_id && !filtered.find(d => d._id === formData.division_id)) {
                setFormData(prev => ({
                    ...prev,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: ''
                }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                parliament_id: '',
                assembly_id: ''
            }));
        }
    }, [formData.state_id, divisions]);

    // Division -> Parliament
    useEffect(() => {
        if (formData.division_id) {
            const filtered = parliaments?.filter(parliament => {
                const parliamentDivisionId = parliament.division_id?._id || parliament.division_id;
                return parliamentDivisionId === formData.division_id;
            }) || [];
            setFilteredParliaments(filtered);

            if (formData.parliament_id && !filtered.find(p => p._id === formData.parliament_id)) {
                setFormData(prev => ({
                    ...prev,
                    parliament_id: '',
                    assembly_id: ''
                }));
            }
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({
                ...prev,
                parliament_id: '',
                assembly_id: ''
            }));
        }
    }, [formData.division_id, parliaments]);

    // Parliament -> Assembly
    useEffect(() => {
        if (formData.parliament_id) {
            const filtered = assemblies?.filter(assembly => {
                const assemblyParliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                return assemblyParliamentId === formData.parliament_id;
            }) || [];
            setFilteredAssemblies(filtered);

            if (formData.assembly_id && !filtered.find(a => a._id === formData.assembly_id)) {
                setFormData(prev => ({
                    ...prev,
                    assembly_id: ''
                }));
            }
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({
                ...prev,
                assembly_id: ''
            }));
        }
    }, [formData.parliament_id, assemblies]);

    // Show all candidates in dropdown, not filtered by party
    useEffect(() => {
        setFilteredCandidates(candidates || []);
        if (formData.candidate_id && !(candidates || []).find(c => c._id === formData.candidate_id)) {
            setFormData(prev => ({
                ...prev,
                candidate_id: ''
            }));
        }
    }, [candidates]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        const numValue = parseInt(value) || 0;
        setFormData((prev) => ({
            ...prev,
            [name]: numValue < 0 ? 0 : numValue
        }));
    };

    const handleElectionTypeChange = (event, newValue) => {
        setFormData(prev => ({
            ...prev,
            type: newValue
        }));
    };

    // Helper to format poll_percentage as 'xx.xx%'
    function formatPollPercentage(value) {
        if (typeof value === 'number') {
            return value.toFixed(2) + '%';
        }
        if (typeof value === 'string') {
            let v = value.trim();
            if (v.endsWith('%')) v = v.slice(0, -1);
            const num = parseFloat(v);
            if (!isNaN(num)) return num.toFixed(2) + '%';
        }
        return value;
    }

    const allowedElectionTypes = ['General', 'Bye', 'Midterm', 'Special'];
    const handleSubmit = async () => {
        setSubmitted(true);
        setErrorMessage(''); // Clear previous error
        // Validation
        const requiredFields = [
            'candidate_id', 'party_id', 'year_id', 'type', 'poll_percentage',
            'total_electors', 'voting_percentage', 'margin', 'margin_percentage',
            'state_id', 'division_id', 'parliament_id', 'assembly_id'
        ];

        for (const field of requiredFields) {
            if (!formData[field] && formData[field] !== 0) {
                setErrorMessage(`Missing required field: ${field}`);
                return;
            }
        }

        const method = candidateEntry ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = candidateEntry
            ? `${import.meta.env.VITE_APP_API_URL}/winning-candidates/${candidateEntry._id}`
            : `${import.meta.env.VITE_APP_API_URL}/winning-candidates`;

        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                // ...existing code...
            }
        }

        const userTracking = candidateEntry ? { updated_by: userId } : { created_by: userId };

        // Filter type to only allowed values
        const filteredType = Array.isArray(formData.type)
            ? formData.type.filter(t => allowedElectionTypes.includes(t))
            : ['General'];

        const submitData = {
            ...formData,
            ...userTracking,
            type: filteredType.length > 0 ? filteredType : ['General'],
            description: typeof formData.description === 'string' ? formData.description : ''
        };
        // Always format poll_percentage before sending
        submitData.poll_percentage = formatPollPercentage(formData.poll_percentage);

        try {
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
                setErrorMessage(errorData.message || 'Failed to save winning candidate entry. Please check the form data.');
            }
        } catch (error) {
            setErrorMessage('An error occurred while saving the winning candidate entry.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{candidateEntry ? 'Edit Winning Candidate Entry' : 'Add Winning Candidate Entry'}</DialogTitle>
            <DialogContent>
                {errorMessage && (
                    <Box sx={{ color: 'error.main', mb: 2, fontWeight: 500 }}>
                        {errorMessage}
                    </Box>
                )}
                <Grid container spacing={4} mt={1}>
                    {/* Row 1: Party and Candidate */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Party</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.party_id}>
                                <Select
                                    name="party_id"
                                    value={formData.party_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select Party</MenuItem>
                                    {parties?.map((party) => (
                                        <MenuItem key={party._id} value={party._id}>
                                            {party.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.party_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Party is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Candidate</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.candidate_id}>
                                <Select
                                    name="candidate_id"
                                    value={formData.candidate_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.party_id}
                                >
                                    <MenuItem value="">Select Candidate</MenuItem>
                                    {filteredCandidates.map((candidate) => (
                                        <MenuItem key={candidate._id} value={candidate._id}>
                                            {candidate.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.candidate_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Candidate is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 2: Year and Assembly No */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Election Year</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.year_id}>
                                <Select
                                    name="year_id"
                                    value={formData.year_id || ''}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="" disabled>Select Year</MenuItem>
                                    {years?.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>
                                            {year.year}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.year_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Election year is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 3: Election Type and Poll Percentage */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Election Type</InputLabel>
                            <Autocomplete
                                multiple
                                options={electionTypes}
                                value={formData.type}
                                onChange={handleElectionTypeChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        error={submitted && (!formData.type || formData.type.length === 0)}
                                        helperText={submitted && (!formData.type || formData.type.length === 0) ? 'At least one election type is required' : ''}
                                    />
                                )}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            label={option}
                                            size="small"
                                            {...getTagProps({ index })}
                                        />
                                    ))
                                }
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Poll Percentage</InputLabel>
                            <TextField
                                name="poll_percentage"
                                value={formData.poll_percentage}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.poll_percentage}
                                helperText={submitted && !formData.poll_percentage ? 'Poll percentage is required' : ''}
                                placeholder="e.g. 75.25%"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 4: Total Electors and Total Votes */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Total Electors</InputLabel>
                            <TextField
                                name="total_electors"
                                value={formData.total_electors}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.total_electors}
                                helperText={submitted && !formData.total_electors ? 'Total electors is required' : ''}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Total Votes</InputLabel>
                            <TextField
                                name="total_votes"
                                type="number"
                                value={formData.total_votes}
                                onChange={handleNumberChange}
                                fullWidth
                                required
                                error={submitted && formData.total_votes === undefined}
                                helperText={submitted && formData.total_votes === undefined ? 'Total votes is required' : ''}
                                inputProps={{ min: 0 }}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 5: Voting Percentage and Margin */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Voting Percentage</InputLabel>
                            <TextField
                                name="voting_percentage"
                                value={formData.voting_percentage}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.voting_percentage}
                                helperText={submitted && !formData.voting_percentage ? 'Voting percentage is required' : ''}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Margin</InputLabel>
                            <TextField
                                name="margin"
                                type="number"
                                value={formData.margin}
                                onChange={handleNumberChange}
                                fullWidth
                                required
                                error={submitted && formData.margin === undefined}
                                helperText={submitted && formData.margin === undefined ? 'Margin is required' : ''}
                                inputProps={{ min: 0 }}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 6: Margin Percentage */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Margin Percentage</InputLabel>
                            <TextField
                                name="margin_percentage"
                                value={formData.margin_percentage}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.margin_percentage}
                                helperText={submitted && !formData.margin_percentage ? 'Margin percentage is required' : ''}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 7: State and Division */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>State</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.state_id}>
                                <Select
                                    name="state_id"
                                    value={formData.state_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select State</MenuItem>
                                    {states?.map((state) => (
                                        <MenuItem key={state._id} value={state._id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.state_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>State is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Division</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.division_id}>
                                <Select
                                    name="division_id"
                                    value={formData.division_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.state_id}
                                >
                                    <MenuItem value="">Select Division</MenuItem>
                                    {filteredDivisions.map((division) => (
                                        <MenuItem key={division._id} value={division._id}>
                                            {division.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.division_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Division is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 8: Parliament and Assembly */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Parliament</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.parliament_id}>
                                <Select
                                    name="parliament_id"
                                    value={formData.parliament_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.division_id}
                                >
                                    <MenuItem value="">Select Parliament</MenuItem>
                                    {filteredParliaments.map((parliament) => (
                                        <MenuItem key={parliament._id} value={parliament._id}>
                                            {parliament.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.parliament_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Parliament is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Assembly</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.assembly_id}>
                                <Select
                                    name="assembly_id"
                                    value={formData.assembly_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.parliament_id}
                                >
                                    <MenuItem value="">Select Assembly</MenuItem>
                                    {filteredAssemblies.map((assembly) => (
                                        <MenuItem key={assembly._id} value={assembly._id}>
                                            {assembly.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.assembly_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Assembly is required</Box>
                            )}
                        </Stack>
                    </Grid>
                    {/* Row: Description (Rich Text) */}
                    <Grid item xs={12}>
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
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {candidateEntry ? 'Update' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
