import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl, Box,
    FormHelperText, Typography, Divider
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function ParliamentCandidateModal({
    open,
    modalToggler,
    candidate,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        candidate_id: '',
        parliament_id: '',
        election_year_id: '',
        party_id: '',
        position_result: 'win',
        total_votes_parliament: '',
        candidate_votes: '',
        margin: '',
        margin_percentage: '' // stored/displayed as percent string (e.g., '3.00' for 3%)
    });
    
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Dropdown options
    const [candidates, setCandidates] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [electionYears, setElectionYears] = useState([]);
    const [parties, setParties] = useState([]);

    // Fetch dropdown options
    useEffect(() => {
        const fetchOptions = async () => {
            const token = localStorage.getItem('serviceToken');
            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            };

            try {
                // Fetch candidates
                const candidatesRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/candidates`, { headers });
                if (candidatesRes.ok) {
                    const candidatesData = await candidatesRes.json();
                    setCandidates(candidatesData.data || []);
                }

                // Fetch parliaments
                const parliamentsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers });
                if (parliamentsRes.ok) {
                    const parliamentsData = await parliamentsRes.json();
                    setParliaments(parliamentsData.data || []);
                }

                // Fetch election years
                const yearsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`, { headers });
                if (yearsRes.ok) {
                    const yearsData = await yearsRes.json();
                    setElectionYears(yearsData.data || []);
                }

                // Fetch parties
                const partiesRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/parties`, { headers });
                if (partiesRes.ok) {
                    const partiesData = await partiesRes.json();
                    setParties(partiesData.data || []);
                }
            } catch (error) {
                console.error('Error fetching options:', error);
            }
        };

        if (open) {
            fetchOptions();
        }
    }, [open]);

    useEffect(() => {
        if (candidate) {
            setFormData({
                candidate_id: candidate.candidate_id?._id || '',
                parliament_id: candidate.parliament_id?._id || '',
                election_year_id: candidate.election_year_id?._id || '',
                party_id: candidate.party_id?._id || '',
                position_result: candidate.position_result || 'win',
                total_votes_parliament: candidate.total_votes_parliament || '',
                candidate_votes: candidate.candidate_votes || '',
                margin: candidate.margin || '',
                margin_percentage: candidate.margin_percentage ? ((Number(candidate.margin_percentage) * 100).toFixed(2)) : ''
            });
        } else {
            setFormData({
                candidate_id: '',
                parliament_id: '',
                election_year_id: '',
                party_id: '',
                position_result: 'win',
                total_votes_parliament: '',
                candidate_votes: '',
                margin: '',
                margin_percentage: ''
            });
        }
    }, [candidate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const requiredFields = [
            'candidate_id', 'parliament_id', 'election_year_id', 
            'party_id', 'total_votes_parliament', 'candidate_votes'
        ];
        
        for (const field of requiredFields) {
            if (!formData[field]) {
                return false;
            }
        }

        // Validate numbers
        if (isNaN(formData.total_votes_parliament) || parseInt(formData.total_votes_parliament) < 0) {
            return false;
        }
        if (isNaN(formData.candidate_votes) || parseInt(formData.candidate_votes) < 0) {
            return false;
        }

        // Candidate votes cannot exceed total votes
        if (parseInt(formData.candidate_votes) > parseInt(formData.total_votes_parliament)) {
            return false;
        }

        return true;
    };

    const calculateMargin = () => {
        const totalVotes = parseInt(formData.total_votes_parliament) || 0;
        const candidateVotes = parseInt(formData.candidate_votes) || 0;
        const otherVotes = totalVotes - candidateVotes;
        
        if (formData.position_result === 'win') {
            return candidateVotes - otherVotes;
        } else {
            return candidateVotes - otherVotes; // Will be negative for loss
        }
    };

    const calculateMarginPercentageString = (marginValue, totalVotes) => {
        const total = Number(totalVotes) || 0;
        const marginNum = Number(marginValue) || 0;
        if (total > 0) {
            return ((Math.abs(marginNum) / total) * 100).toFixed(2);
        }
        return '0.00';
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        const method = candidate ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = candidate
            ? `${import.meta.env.VITE_APP_API_URL}/parliament-candidates/${candidate._id}`
            : `${import.meta.env.VITE_APP_API_URL}/parliament-candidates`;

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

        const userTracking = candidate ? { updated_by: userId } : { created_by: userId };
        
        // Calculate margin if not provided
        let marginValue = formData.margin;
        if (!marginValue) {
            marginValue = calculateMargin();
        }

        // Calculate margin percentage string (for display) and decimal (for API)
        const marginPercentStr = calculateMarginPercentageString(marginValue, formData.total_votes_parliament);
        const marginPercentDecimal = parseFloat((Number(marginPercentStr) / 100).toFixed(6));

        const submitData = {
            ...formData,
            ...userTracking,
            total_votes_parliament: parseInt(formData.total_votes_parliament),
            candidate_votes: parseInt(formData.candidate_votes),
            margin: parseInt(marginValue) || 0,
            margin_percentage: marginPercentDecimal
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
                console.error('Failed to submit Parliament Candidate:', errorData);
                alert(`Failed to save Parliament Candidate: ${errorData.message || 'Please check the form data.'}`);
            }
        } catch (error) {
            console.error('Error submitting Parliament Candidate:', error);
            alert('An error occurred while saving the Parliament Candidate.');
        } finally {
            setLoading(false);
        }
    };

    const getVotePercentage = () => {
        const totalVotes = parseInt(formData.total_votes_parliament) || 0;
        const candidateVotes = parseInt(formData.candidate_votes) || 0;
        
        if (totalVotes > 0) {
            return ((candidateVotes / totalVotes) * 100).toFixed(2);
        }
        return '0';
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{candidate ? 'Edit Parliament Candidate' : 'Add Parliament Candidate'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>

                    {/* Candidate Selection */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Candidate <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth error={submitted && !formData.candidate_id}>
                                <Select
                                    name="candidate_id"
                                    value={formData.candidate_id}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">
                                        <em>Select Candidate</em>
                                    </MenuItem>
                                    {candidates.map((item) => (
                                        <MenuItem key={item._id} value={item._id}>
                                            {item.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {submitted && !formData.candidate_id && (
                                    <FormHelperText>Candidate is required</FormHelperText>
                                )}
                            </FormControl>
                        </Stack>
                    </Grid>

                    {/* Parliament Selection */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Parliament Constituency <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth error={submitted && !formData.parliament_id}>
                                <Select
                                    name="parliament_id"
                                    value={formData.parliament_id}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">
                                        <em>Select Parliament</em>
                                    </MenuItem>
                                    {parliaments.map((item) => (
                                        <MenuItem key={item._id} value={item._id}>
                                            {item.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {submitted && !formData.parliament_id && (
                                    <FormHelperText>Parliament is required</FormHelperText>
                                )}
                            </FormControl>
                        </Stack>
                    </Grid>

                    {/* Election Year */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Election Year <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth error={submitted && !formData.election_year_id}>
                                <Select
                                    name="election_year_id"
                                    value={formData.election_year_id}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">
                                        <em>Select Year</em>
                                    </MenuItem>
                                    {electionYears.map((item) => (
                                        <MenuItem key={item._id} value={item._id}>
                                            {item.year}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {submitted && !formData.election_year_id && (
                                    <FormHelperText>Election Year is required</FormHelperText>
                                )}
                            </FormControl>
                        </Stack>
                    </Grid>

                    {/* Party */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Party <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth error={submitted && !formData.party_id}>
                                <Select
                                    name="party_id"
                                    value={formData.party_id}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">
                                        <em>Select Party</em>
                                    </MenuItem>
                                    {parties.map((item) => (
                                        <MenuItem key={item._id} value={item._id}>
                                            {item.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {submitted && !formData.party_id && (
                                    <FormHelperText>Party is required</FormHelperText>
                                )}
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider>
                            <Typography variant="h6" color="text.secondary">Election Results</Typography>
                        </Divider>
                    </Grid>

                    {/* Position Result */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Position Result <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="position_result"
                                    value={formData.position_result}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="win">WIN</MenuItem>
                                    <MenuItem value="loss">LOSS</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    {/* Total Votes in Parliament */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Total Votes in Parliament <span style={{ color: 'red' }}>*</span></InputLabel>
                            <TextField
                                name="total_votes_parliament"
                                value={formData.total_votes_parliament}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                error={submitted && (!formData.total_votes_parliament || isNaN(formData.total_votes_parliament))}
                                helperText={submitted && (!formData.total_votes_parliament || isNaN(formData.total_votes_parliament)) ? 'Valid total votes required' : ''}
                                placeholder="Enter total votes"
                            />
                        </Stack>
                    </Grid>

                    {/* Candidate Votes */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Candidate Votes <span style={{ color: 'red' }}>*</span></InputLabel>
                            <TextField
                                name="candidate_votes"
                                value={formData.candidate_votes}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                error={
                                    submitted && (
                                        !formData.candidate_votes || 
                                        isNaN(formData.candidate_votes) ||
                                        parseInt(formData.candidate_votes) > parseInt(formData.total_votes_parliament)
                                    )
                                }
                                helperText={
                                    submitted && !formData.candidate_votes ? 'Candidate votes required' :
                                    submitted && parseInt(formData.candidate_votes) > parseInt(formData.total_votes_parliament) ? 'Cannot exceed total votes' :
                                    ''
                                }
                                placeholder="Enter candidate votes"
                            />
                        </Stack>
                    </Grid>

                    {/* Margin */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Margin</InputLabel>
                            <TextField
                                name="margin"
                                value={formData.margin}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                placeholder="Auto-calculated if empty"
                                helperText="Leave empty to auto-calculate based on votes"
                            />
                        </Stack>
                    </Grid>

                    {/* Margin Percentage (read-only) */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Margin %</InputLabel>
                            <TextField
                                name="margin_percentage"
                                value={formData.margin_percentage || (formData.margin ? calculateMarginPercentageString(formData.margin, formData.total_votes_parliament) : '')}
                                onChange={handleChange}
                                fullWidth
                                type="text"
                                placeholder="Auto-calculated"
                                InputProps={{ readOnly: true }}
                                helperText="Displayed as percentage (e.g., 3.00 for 3%)"
                            />
                        </Stack>
                    </Grid>

                    {/* Vote Percentage Display */}
                    {formData.total_votes_parliament && formData.candidate_votes && (
                        <Grid item xs={12}>
                            <Box sx={{ 
                                p: 2, 
                                bgcolor: 'background.default', 
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Vote Percentage: <strong>{getVotePercentage()}%</strong>
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Calculated Margin: <strong>{calculateMargin().toLocaleString()}</strong>
                                </Typography>
                            </Box>
                        </Grid>
                    )}

                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : candidate ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}