import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Box, Autocomplete
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function WinningPartyModal({
    open,
    modalToggler,
    winningParty,
    candidates,
    assemblies,
    parliaments,
    parties,
    years,
    states,
    divisions,
    blocks,
    booths,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        candidate_id: '',
        assembly_id: '',
        parliament_id: '',
        state_id: '',
        division_id: '',
        block_id: '',
        booth_id: '',
        party_id: '',
        year_id: '',
        votes: '',
        margin: '',
        is_active: true
    });
    const [submitted, setSubmitted] = useState(false);

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);
    const [filteredCandidates, setFilteredCandidates] = useState([]);

    useEffect(() => {
        if (winningParty) {
            setFormData({
                candidate_id: winningParty.candidate_id?._id || winningParty.candidate_id || '',
                assembly_id: winningParty.assembly_id?._id || winningParty.assembly_id || '',
                parliament_id: winningParty.parliament_id?._id || winningParty.parliament_id || '',
                state_id: winningParty.state_id?._id || winningParty.state_id || '',
                division_id: winningParty.division_id?._id || winningParty.division_id || '',
                block_id: winningParty.block_id?._id || winningParty.block_id || '',
                booth_id: winningParty.booth_id?._id || winningParty.booth_id || '',
                party_id: winningParty.party_id?._id || winningParty.party_id || '',
                year_id: winningParty.year_id?._id || winningParty.year_id || '',
                votes: winningParty.votes || '',
                margin: winningParty.margin || '',
                is_active: winningParty.is_active !== undefined ? winningParty.is_active : true
            });
        } else {
            setFormData({
                candidate_id: '',
                assembly_id: '',
                parliament_id: '',
                state_id: '',
                division_id: '',
                block_id: '',
                booth_id: '',
                party_id: '',
                year_id: '',
                votes: '',
                margin: '',
                is_active: true
            });
        }
    }, [winningParty]);

    // State -> Division
    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions?.filter(division => {
                const divisionStateId = division.state_id?._id || division.state_id;
                return divisionStateId === formData.state_id;
            }) || [];
            setFilteredDivisions(filtered);
        } else {
            setFilteredDivisions([]);
        }
    }, [formData.state_id, divisions]);

    // Division -> Parliament/Assembly
    useEffect(() => {
        if (formData.division_id) {
            const filteredAssemblies = assemblies?.filter(assembly => {
                const assemblyDivisionId = assembly.division_id?._id || assembly.division_id;
                return assemblyDivisionId === formData.division_id;
            }) || [];
            setFilteredAssemblies(filteredAssemblies);

            const filteredParliaments = parliaments?.filter(parliament => {
                const parliamentDivisionId = parliament.division_id?._id || parliament.division_id;
                return parliamentDivisionId === formData.division_id;
            }) || [];
            setFilteredParliaments(filteredParliaments);
        } else {
            setFilteredAssemblies([]);
            setFilteredParliaments([]);
        }
    }, [formData.division_id, assemblies, parliaments]);

    // Block -> Booths
    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths?.filter(booth => {
                const boothBlockId = booth.block_id?._id || booth.block_id;
                return boothBlockId === formData.block_id;
            }) || [];
            setFilteredBooths(filtered);
        } else {
            setFilteredBooths([]);
        }
    }, [formData.block_id, booths]);

    // Party -> Candidates
    useEffect(() => {
        if (formData.party_id) {
            const filtered = candidates?.filter(candidate => {
                const candidatePartyId = candidate.party_id?._id || candidate.party_id;
                return candidatePartyId === formData.party_id;
            }) || [];
            setFilteredCandidates(filtered);
        } else {
            setFilteredCandidates([]);
        }
    }, [formData.party_id, candidates]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        
        // Validation
        const requiredFields = [
            'candidate_id', 'assembly_id', 'state_id', 'division_id', 
            'block_id', 'booth_id', 'party_id', 'year_id', 'votes', 'margin'
        ];
        
        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return;
            }
        }

        const method = winningParty ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = winningParty
            ? `http://localhost:5000/api/winning-parties/${winningParty._id}`
            : 'http://localhost:5000/api/winning-parties';

        // Get user ID from context or localStorage
        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = winningParty 
            ? { updated_by: userId } 
            : { created_by: userId, updated_by: userId };

        const submitData = {
            ...formData,
            ...userTracking
        };

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
                console.error('Failed to submit winning party:', errorData);
                alert(errorData.message || 'Failed to save winning party. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting winning party:', error);
            alert('An error occurred while saving the winning party.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{winningParty ? 'Edit Winning Party Record' : 'Add Winning Party Record'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {/* Row 1: Candidate and Party */}
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
                                    {parties?.map(party => (
                                        <MenuItem key={party._id} value={party._id}>
                                            {party.name} ({party.abbreviation})
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
                                    {filteredCandidates.map(candidate => (
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

                    {/* Row 2: State and Division */}
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
                                    {states?.map(state => (
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
                                    {filteredDivisions.map(division => (
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

                    {/* Row 3: Parliament and Assembly */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Parliament</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="parliament_id"
                                    value={formData.parliament_id}
                                    onChange={handleChange}
                                    disabled={!formData.division_id}
                                >
                                    <MenuItem value="">Select Parliament (Optional)</MenuItem>
                                    {filteredParliaments.map(parliament => (
                                        <MenuItem key={parliament._id} value={parliament._id}>
                                            {parliament.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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
                                    disabled={!formData.division_id}
                                >
                                    <MenuItem value="">Select Assembly</MenuItem>
                                    {filteredAssemblies.map(assembly => (
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

                    {/* Row 4: Block and Booth */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Block</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.block_id}>
                                <Select
                                    name="block_id"
                                    value={formData.block_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select Block</MenuItem>
                                    {blocks?.map(block => (
                                        <MenuItem key={block._id} value={block._id}>
                                            {block.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.block_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Block is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Booth</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.booth_id}>
                                <Select
                                    name="booth_id"
                                    value={formData.booth_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.block_id}
                                >
                                    <MenuItem value="">Select Booth</MenuItem>
                                    {filteredBooths.map(booth => (
                                        <MenuItem key={booth._id} value={booth._id}>
                                            {booth.booth_number} - {booth.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.booth_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Booth is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 5: Year, Votes, Margin */}
                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel required>Election Year</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.year_id}>
                                <Select
                                    name="year_id"
                                    value={formData.year_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select Year</MenuItem>
                                    {years?.map(year => (
                                        <MenuItem key={year._id} value={year._id}>
                                            {year.year}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.year_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Year is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel required>Votes</InputLabel>
                            <TextField
                                name="votes"
                                type="number"
                                value={formData.votes}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.votes}
                                helperText={submitted && !formData.votes ? 'Votes count is required' : ''}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel required>Margin</InputLabel>
                            <TextField
                                name="margin"
                                type="number"
                                value={formData.margin}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.margin}
                                helperText={submitted && !formData.margin ? 'Victory margin is required' : ''}
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {winningParty ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}