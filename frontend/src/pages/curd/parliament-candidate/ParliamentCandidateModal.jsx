import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl, Box,
    FormHelperText, Typography, Divider, Autocomplete
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
        margin_percentage: '', // stored/displayed as percent string (e.g., '3.00' for 3%)
        electors: '',
        turnout: '',
        male_electors: '',
        female_electors: '',
        total_votes_polled: '',
        valid_votes: '',
        total_male_voters: '',
        female_voters: '',
        nota_votes: ''
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
                // Fetch candidates - get all candidates with higher limit
                const candidatesRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/candidates?limit=1000`, { headers });
                if (candidatesRes.ok) {
                    const candidatesData = await candidatesRes.json();
                    setCandidates(candidatesData.data || []);
                }

                // Fetch parliaments - get all parliaments with higher limit  
                const parliamentsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?limit=1000`, { headers });
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

                // Fetch parties - get all parties with higher limit and search support
                const partiesRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/parties?limit=1000`, { headers });
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
            // Helper to parse formatted numbers
            const parseToNum = (v) => {
                if (v === undefined || v === null || v === '') return '';
                if (typeof v === 'number') return v;
                const s = String(v);
                const match = s.match(/([0-9,.-]+)/);
                if (!match) return '';
                const cleaned = match[0].replace(/,/g, '');
                const n = Number(cleaned);
                return isNaN(n) ? '' : n;
            };

            const mp = candidate.margin_percentage ?? candidate.Margin_percentage ?? candidate.Margin_percentage ?? candidate['Margin_percentage'];

            setFormData({
                // Accept either nested object or plain id string
                candidate_id: candidate.candidate_id?._id || candidate.candidate_id || candidate.candidate?._id || candidate.candidate || '',
                candidate_name: candidate.candidate_id?.name || candidate.candidate?.name || candidate.candidate_name || '',
                parliament_id: candidate.parliament_id?._id || candidate.parliament_id || '',
                parliament_name: candidate.parliament_id?.name || candidate.parliament?.name || candidate.parliament_name || '',
                election_year_id: candidate.election_year_id?._id || candidate.election_year_id || '',
                election_year_label: candidate.election_year_id?.year || candidate.election_year?.year || candidate.election_year || '',
                party_id: candidate.party_id?._id || candidate.party_id || '',
                party_name: candidate.party_id?.name || candidate.party?.name || candidate.party_name || '',
                position_result: candidate.position_result || 'win',
                total_votes_parliament: parseToNum(candidate.total_votes_parliament ?? candidate.Total_Votes_Polled),
                candidate_votes: parseToNum(candidate.candidate_votes ?? candidate.Candidate_Votes),
                margin: parseToNum(candidate.margin ?? candidate.Margin),
                margin_percentage: mp ? ((Number(mp) * 100).toFixed(2)) : '',
                electors: parseToNum(candidate.electors ?? candidate.Electors),
                turnout: parseToNum(candidate.turnout ?? candidate.Turnout),
                male_electors: parseToNum(candidate.male_electors ?? candidate.Male_Electors),
                female_electors: parseToNum(candidate.female_electors ?? candidate.Female_Electors),
                total_votes_polled: parseToNum(candidate.total_votes_polled ?? candidate.Total_Votes_Polled),
                valid_votes: parseToNum(candidate.valid_votes ?? candidate.Valid_Votes),
                total_male_voters: parseToNum(candidate.total_male_voters ?? candidate.Total_Male_Voters),
                female_voters: parseToNum(candidate.female_voters ?? candidate.Female_Voters),
                nota_votes: parseToNum(candidate.nota_votes ?? candidate.NOTA_Votes)
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
                ,
                electors: '',
                turnout: '',
                male_electors: '',
                female_electors: '',
                total_votes_polled: '',
                valid_votes: '',
                total_male_voters: '',
                female_voters: '',
                nota_votes: ''
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
        // Normalize new numeric fields
        submitData.electors = parseInt(formData.electors) || 0;
        submitData.turnout = parseInt(formData.turnout) || 0;
        submitData.male_electors = parseInt(formData.male_electors) || 0;
        submitData.female_electors = parseInt(formData.female_electors) || 0;
        submitData.total_votes_polled = parseInt(formData.total_votes_polled) || 0;
        submitData.valid_votes = parseInt(formData.valid_votes) || 0;
        submitData.total_male_voters = parseInt(formData.total_male_voters) || 0;
        submitData.female_voters = parseInt(formData.female_voters) || 0;
        submitData.nota_votes = parseInt(formData.nota_votes) || 0;

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
                // No success popup - direct close
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
                            <Autocomplete
                                options={candidates}
                                getOptionLabel={(option) => option.name || ''}
                                value={(() => {
                                    // Find candidate in loaded options
                                    const foundCandidate = candidates.find(c => c._id === formData.candidate_id);
                                    if (foundCandidate) return foundCandidate;
                                    
                                    // If not found but we have candidate_id and candidate_name, create temp object
                                    if (formData.candidate_id && formData.candidate_name) {
                                        return { _id: formData.candidate_id, name: formData.candidate_name };
                                    }
                                    
                                    return null;
                                })()}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        candidate_id: newValue?._id || '',
                                        candidate_name: newValue?.name || ''
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search and select candidate..."
                                        error={submitted && !formData.candidate_id}
                                        helperText={submitted && !formData.candidate_id ? 'Candidate is required' : ''}
                                    />
                                )}
                                filterOptions={(options, { inputValue }) => {
                                    return options.filter(option =>
                                        option.name.toLowerCase().includes(inputValue.toLowerCase())
                                    );
                                }}
                                noOptionsText="No candidates found"
                                clearOnEscape
                                fullWidth
                            />
                        </Stack>
                    </Grid>

                    {/* Parliament Selection */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Parliament Constituency <span style={{ color: 'red' }}>*</span></InputLabel>
                            <Autocomplete
                                options={parliaments}
                                getOptionLabel={(option) => option.name || ''}
                                value={(() => {
                                    // Find parliament in loaded options
                                    const foundParliament = parliaments.find(p => p._id === formData.parliament_id);
                                    if (foundParliament) return foundParliament;
                                    
                                    // If not found but we have parliament_id and parliament_name, create temp object
                                    if (formData.parliament_id && formData.parliament_name) {
                                        return { _id: formData.parliament_id, name: formData.parliament_name };
                                    }
                                    
                                    return null;
                                })()}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        parliament_id: newValue?._id || '',
                                        parliament_name: newValue?.name || ''
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search and select parliament..."
                                        error={submitted && !formData.parliament_id}
                                        helperText={submitted && !formData.parliament_id ? 'Parliament is required' : ''}
                                    />
                                )}
                                filterOptions={(options, { inputValue }) => {
                                    return options.filter(option =>
                                        option.name.toLowerCase().includes(inputValue.toLowerCase())
                                    );
                                }}
                                noOptionsText="No parliaments found"
                                clearOnEscape
                                fullWidth
                            />
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
                                    renderValue={(selected) => {
                                        if (!selected) return <em>Select Year</em>;
                                        if (formData.election_year_label) return formData.election_year_label;
                                        const opt = electionYears.find((y) => y._id === selected || y.id === selected || y.year === selected);
                                        return opt ? opt.year : selected;
                                    }}
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
                            <Autocomplete
                                options={parties}
                                getOptionLabel={(option) => option.name || ''}
                                value={(() => {
                                    // Find party in loaded options
                                    const foundParty = parties.find(p => p._id === formData.party_id);
                                    if (foundParty) return foundParty;
                                    
                                    // If not found but we have party_id and party_name, create temp object
                                    if (formData.party_id && formData.party_name) {
                                        return { _id: formData.party_id, name: formData.party_name };
                                    }
                                    
                                    return null;
                                })()}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        party_id: newValue?._id || '',
                                        party_name: newValue?.name || ''
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search and select party..."
                                        error={submitted && !formData.party_id}
                                        helperText={submitted && !formData.party_id ? 'Party is required' : ''}
                                    />
                                )}
                                filterOptions={(options, { inputValue }) => {
                                    return options.filter(option =>
                                        option.name.toLowerCase().includes(inputValue.toLowerCase())
                                    );
                                }}
                                noOptionsText="No parties found"
                                clearOnEscape
                                fullWidth
                            />
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

                    {/* Additional Statistics */}
                    <Grid item xs={12}>
                        <Divider>
                            <Typography variant="h6" color="text.secondary">Additional Statistics</Typography>
                        </Divider>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Stack spacing={1}>
                            <InputLabel>Electors</InputLabel>
                            <TextField
                                name="electors"
                                value={formData.electors}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                placeholder="Total Electors"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Stack spacing={1}>
                            <InputLabel>Turnout</InputLabel>
                            <TextField
                                name="turnout"
                                value={formData.turnout}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                placeholder="Turnout count or percentage"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Stack spacing={1}>
                            <InputLabel>Male Electors</InputLabel>
                            <TextField
                                name="male_electors"
                                value={formData.male_electors}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                placeholder="Male Electors"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Stack spacing={1}>
                            <InputLabel>Female Electors</InputLabel>
                            <TextField
                                name="female_electors"
                                value={formData.female_electors}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                placeholder="Female Electors"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Stack spacing={1}>
                            <InputLabel>Total Votes Polled</InputLabel>
                            <TextField
                                name="total_votes_polled"
                                value={formData.total_votes_polled}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                placeholder="Total Votes Polled"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Stack spacing={1}>
                            <InputLabel>Valid Votes</InputLabel>
                            <TextField
                                name="valid_votes"
                                value={formData.valid_votes}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                placeholder="Valid Votes"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Stack spacing={1}>
                            <InputLabel>Total Male Voters</InputLabel>
                            <TextField
                                name="total_male_voters"
                                value={formData.total_male_voters}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                placeholder="Total Male Voters"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Stack spacing={1}>
                            <InputLabel>Female Voters</InputLabel>
                            <TextField
                                name="female_voters"
                                value={formData.female_voters}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                placeholder="Female Voters"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <Stack spacing={1}>
                            <InputLabel>NOTA Votes</InputLabel>
                            <TextField
                                name="nota_votes"
                                value={formData.nota_votes}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                placeholder="NOTA Votes"
                            />
                        </Stack>
                    </Grid>

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