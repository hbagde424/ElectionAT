import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Typography, Divider, Box, Chip
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function BoothDemographicsModal({
    open,
    modalToggler,
    booth,
    demographics,
    refresh,
    booths = [] // Accept booths array as a prop
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    // State for reference data
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);

    // State for filtered dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);

    // Add filteredBooths state
    const [filteredBooths, setFilteredBooths] = useState([]);

    const [formData, setFormData] = useState({
        booth_id: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        total_population: 0,
        total_electors: 0,
        male_electors: 0,
        female_electors: 0,
        other_electors: 0,
        education: {
            illiterate: 0,
            educated: 0,
            class_1_to_5: 0,
            class_5_to_10: 0,
            class_10_to_12: 0,
            graduate: 0,
            post_graduate: 0,
            other_education: 0
        },
        annual_income: {
            below_10k: 0,
            _10k_to_20k: 0,
            _25k_to_50k: 0,
            _50k_to_2L: 0,
            _2L_to_5L: 0,
            above_5L: 0
        },
        age_groups: {
            _18_25: 0,
            _26_40: 0,
            _41_60: 0,
            _60_above: 0
        },
        caste_population: {
            sc: 0,
            st: 0,
            obc: 0,
            general: 0,
            other: 0
        },
        literacy_rate: 0
    });

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch all reference data
    useEffect(() => {
        const fetchReferenceData = async () => {
            try {
                const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes] = await Promise.all([
                    fetch('http://localhost:5000/api/states'),
                    fetch('http://localhost:5000/api/divisions'),
                    fetch('http://localhost:5000/api/parliaments'),
                    fetch('http://localhost:5000/api/assemblies'),
                    fetch('http://localhost:5000/api/blocks')
                ]);

                const [statesData, divisionsData, parliamentsData, assembliesData, blocksData] = await Promise.all([
                    statesRes.json(),
                    divisionsRes.json(),
                    parliamentsRes.json(),
                    assembliesRes.json(),
                    blocksRes.json()
                ]);

                if (statesData.success) setStates(statesData.data);
                if (divisionsData.success) setDivisions(divisionsData.data);
                if (parliamentsData.success) setParliaments(parliamentsData.data);
                if (assembliesData.success) setAssemblies(assembliesData.data);
                if (blocksData.success) setBlocks(blocksData.data);

            } catch (error) {
                console.error('Failed to fetch reference data:', error);
            }
        };

        fetchReferenceData();
    }, []);

    // Initialize form data when booth or demographics changes
    useEffect(() => {
        if (booth) {
            setFormData(prev => ({
                ...prev,
                booth_id: booth._id,
                state_id: booth.state_id?._id || booth.state_id || '',
                division_id: booth.division_id?._id || booth.division_id || '',
                parliament_id: booth.parliament_id?._id || booth.parliament_id || '',
                assembly_id: booth.assembly_id?._id || booth.assembly_id || '',
                block_id: booth.block_id?._id || booth.block_id || ''
            }));
        }

        if (demographics) {
            setFormData({
                booth_id: demographics.booth_id,
                state_id: demographics.state_id?._id || demographics.state_id || '',
                division_id: demographics.division_id?._id || demographics.division_id || '',
                parliament_id: demographics.parliament_id?._id || demographics.parliament_id || '',
                assembly_id: demographics.assembly_id?._id || demographics.assembly_id || '',
                block_id: demographics.block_id?._id || demographics.block_id || '',
                total_population: demographics.total_population || 0,
                total_electors: demographics.total_electors || 0,
                male_electors: demographics.male_electors || 0,
                female_electors: demographics.female_electors || 0,
                other_electors: demographics.other_electors || 0,
                education: {
                    illiterate: demographics.education?.illiterate || 0,
                    educated: demographics.education?.educated || 0,
                    class_1_to_5: demographics.education?.class_1_to_5 || 0,
                    class_5_to_10: demographics.education?.class_5_to_10 || 0,
                    class_10_to_12: demographics.education?.class_10_to_12 || 0,
                    graduate: demographics.education?.graduate || 0,
                    post_graduate: demographics.education?.post_graduate || 0,
                    other_education: demographics.education?.other_education || 0
                },
                annual_income: {
                    below_10k: demographics.annual_income?.below_10k || 0,
                    _10k_to_20k: demographics.annual_income?._10k_to_20k || 0,
                    _25k_to_50k: demographics.annual_income?._25k_to_50k || 0,
                    _50k_to_2L: demographics.annual_income?._50k_to_2L || 0,
                    _2L_to_5L: demographics.annual_income?._2L_to_5L || 0,
                    above_5L: demographics.annual_income?.above_5L || 0
                },
                age_groups: {
                    _18_25: demographics.age_groups?._18_25 || 0,
                    _26_40: demographics.age_groups?._26_40 || 0,
                    _41_60: demographics.age_groups?._41_60 || 0,
                    _60_above: demographics.age_groups?._60_above || 0
                },
                caste_population: {
                    sc: demographics.caste_population?.sc || 0,
                    st: demographics.caste_population?.st || 0,
                    obc: demographics.caste_population?.obc || 0,
                    general: demographics.caste_population?.general || 0,
                    other: demographics.caste_population?.other || 0
                },
                literacy_rate: demographics.literacy_rate || 0
            });
        }
    }, [booth, demographics]);

    // Cascading dropdown effects
    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions.filter(division =>
                division.state_id?._id === formData.state_id || division.state_id === formData.state_id
            );
            setFilteredDivisions(filtered);

            if (formData.division_id && !filtered.some(d => d._id === formData.division_id)) {
                setFormData(prev => ({
                    ...prev,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: '',
                    block_id: ''
                }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: ''
            }));
        }
    }, [formData.state_id, divisions]);

    useEffect(() => {
        if (formData.division_id) {
            const filtered = parliaments.filter(parliament =>
                parliament.division_id?._id === formData.division_id || parliament.division_id === formData.division_id
            );
            setFilteredParliaments(filtered);

            if (formData.parliament_id && !filtered.some(p => p._id === formData.parliament_id)) {
                setFormData(prev => ({
                    ...prev,
                    parliament_id: '',
                    assembly_id: '',
                    block_id: ''
                }));
            }
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({
                ...prev,
                parliament_id: '',
                assembly_id: '',
                block_id: ''
            }));
        }
    }, [formData.division_id, parliaments]);

    useEffect(() => {
        if (formData.parliament_id) {
            const filtered = assemblies.filter(assembly =>
                assembly.parliament_id?._id === formData.parliament_id || assembly.parliament_id === formData.parliament_id
            );
            setFilteredAssemblies(filtered);

            if (formData.assembly_id && !filtered.some(a => a._id === formData.assembly_id)) {
                setFormData(prev => ({
                    ...prev,
                    assembly_id: '',
                    block_id: ''
                }));
            }
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({
                ...prev,
                assembly_id: '',
                block_id: ''
            }));
        }
    }, [formData.parliament_id, assemblies]);

    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = blocks.filter(block =>
                block.assembly_id?._id === formData.assembly_id || block.assembly_id === formData.assembly_id
            );
            setFilteredBlocks(filtered);

            if (formData.block_id && !filtered.some(b => b._id === formData.block_id)) {
                setFormData(prev => ({
                    ...prev,
                    block_id: ''
                }));
            }
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({
                ...prev,
                block_id: ''
            }));
        }
    }, [formData.assembly_id, blocks]);

    // Filter booths by block
    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths.filter(b =>
                b.block_id?._id === formData.block_id || b.block_id === formData.block_id
            );
            setFilteredBooths(filtered);
            // Reset booth_id if not in filtered list
            if (!filtered.some(b => b._id === formData.booth_id)) {
                setFormData(prev => ({ ...prev, booth_id: '' }));
            }
        } else {
            setFilteredBooths([]);
            setFormData(prev => ({ ...prev, booth_id: '' }));
        }
    }, [formData.block_id, booths]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Convert to number if it's a numeric field
        const processedValue = value === '' ? '' : isNaN(value) ? value : Number(value);

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: processedValue
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: processedValue
            }));
        }
    };

    const handleSubmit = async () => {
        console.log('Submit button clicked'); // Check if handler is triggered
        setSubmitted(true);
        setLoading(true);

        // Validation
        const requiredFields = [
            'booth_id', 'state_id', 'division_id',
            'parliament_id', 'assembly_id', 'block_id',
            'total_population', 'total_electors',
            'male_electors', 'female_electors'
        ];

        console.log('Form data:', formData); // Log current form data

        const hasErrors = requiredFields.some(field => {
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                const value = formData[parent][child];
                return value === '' || value === null || value === undefined || isNaN(value);
            }
            const value = formData[field];
            return value === '' || value === null || value === undefined || isNaN(value);
        });

        console.log('Validation hasErrors:', hasErrors); // Log validation result


        console.log('Preparing to submit data...'); // Confirm we're proceeding to submit

        const method = demographics ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = demographics
            ? `http://localhost:5000/api/booth-demographics/${demographics._id}`
            : 'http://localhost:5000/api/booth-demographics';

        // Get user ID
        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const submitData = {
            ...formData,
            created_by: demographics ? undefined : userId,
            updated_by: userId
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
                console.error('Failed to submit demographics:', errorData);
                alert(errorData.message || 'Failed to save demographics. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting demographics:', error);
            alert('An error occurred while saving the demographics.');
        } finally {
            setLoading(false);
        }
    };

    const calculatePercentage = (value, total) => {
        if (!value || !total || total === 0) return '0%';
        return `${Math.round((value / total) * 100)}%`;
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="lg">
            <DialogTitle>
                {demographics ? 'Edit Booth Demographics' : 'Add Booth Demographics'}
                <Typography variant="subtitle2" color="text.secondary">
                    {booth?.name ? `${booth.name} (Booth #${booth.booth_number})` : ''}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {/* Hierarchy Section */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>Geographical Hierarchy</Typography>
                        <Divider />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
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
                                    {states.map((state) => (
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

                    <Grid item xs={12} sm={6} md={4}>
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

                    <Grid item xs={12} sm={6} md={4}>
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

                    <Grid item xs={12} sm={6} md={4}>
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

                    {/* Block Dropdown */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Stack spacing={1}>
                            <InputLabel required>Block</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.block_id}>
                                <Select
                                    name="block_id"
                                    value={formData.block_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.assembly_id}
                                >
                                    <MenuItem value="">Select Block</MenuItem>
                                    {filteredBlocks.map((block) => (
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

                    {/* Booth Selector (only for add, after block) */}
                    {!demographics && (
                        <Grid item xs={12} sm={6} md={4}>
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
                                        {filteredBooths.map((b) => (
                                            <MenuItem key={b._id} value={b._id}>
                                                {b.name} (#{b.booth_number})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {submitted && !formData.booth_id && (
                                    <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Booth is required</Box>
                                )}
                            </Stack>
                        </Grid>
                    )}
                    {/* If editing, show booth as read-only */}
                    {demographics && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Stack spacing={1}>
                                <InputLabel>Booth</InputLabel>
                                <TextField
                                    value={
                                        booth?.name
                                            ? `${booth.name} (Booth #${booth.booth_number})`
                                            : demographics?.booth_id?.name
                                                ? `${demographics.booth_id.name} (Booth #${demographics.booth_id.booth_number})`
                                                : ''
                                    }
                                    fullWidth
                                    InputProps={{ readOnly: true }}
                                />
                            </Stack>
                        </Grid>
                    )}
                    {/* Basic Demographics */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>Basic Demographics</Typography>
                        <Divider />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Stack spacing={1}>
                            <InputLabel required>Total Population</InputLabel>
                            <TextField
                                name="total_population"
                                value={formData.total_population}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                required
                                error={submitted && (!formData.total_population || isNaN(formData.total_population))}
                                helperText={submitted && (!formData.total_population || isNaN(formData.total_population)) ? 'Required field' : ''}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Stack spacing={1}>
                            <InputLabel required>Total Electors</InputLabel>
                            <TextField
                                name="total_electors"
                                value={formData.total_electors}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                required
                                error={submitted && (!formData.total_electors || isNaN(formData.total_electors))}
                                helperText={submitted && (!formData.total_electors || isNaN(formData.total_electors)) ? 'Required field' : ''}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <Stack spacing={1}>
                            <InputLabel required>Male Electors</InputLabel>
                            <TextField
                                name="male_electors"
                                value={formData.male_electors}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                required
                                error={submitted && (!formData.male_electors || isNaN(formData.male_electors))}
                                helperText={
                                    submitted && (!formData.male_electors || isNaN(formData.male_electors)) ? 'Required field' :
                                        formData.total_electors ? calculatePercentage(formData.male_electors, formData.total_electors) : ''
                                }
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <Stack spacing={1}>
                            <InputLabel required>Female Electors</InputLabel>
                            <TextField
                                name="female_electors"
                                value={formData.female_electors}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                required
                                error={submitted && (!formData.female_electors || isNaN(formData.female_electors))}
                                helperText={
                                    submitted && (!formData.female_electors || isNaN(formData.female_electors)) ? 'Required field' :
                                        formData.total_electors ? calculatePercentage(formData.female_electors, formData.total_electors) : ''
                                }
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                        <Stack spacing={1}>
                            <InputLabel>Other Electors</InputLabel>
                            <TextField
                                name="other_electors"
                                value={formData.other_electors}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                helperText={
                                    formData.total_electors ? calculatePercentage(formData.other_electors, formData.total_electors) : ''
                                }
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Stack spacing={1}>
                            <InputLabel>Literacy Rate (%)</InputLabel>
                            <TextField
                                name="literacy_rate"
                                value={formData.literacy_rate}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0, max: 100 }}
                            />
                        </Stack>
                    </Grid>

                    {/* Education Breakdown */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom mt={3}>Education Breakdown</Typography>
                        <Divider />
                    </Grid>

                    {Object.entries({
                        illiterate: 'Illiterate',
                        educated: 'Literate (No Formal Education)',
                        class_1_to_5: 'Class 1-5',
                        class_5_to_10: 'Class 5-10',
                        class_10_to_12: 'Class 10-12',
                        graduate: 'Graduate',
                        post_graduate: 'Post Graduate',
                        other_education: 'Other Education'
                    }).map(([key, label]) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                            <Stack spacing={1}>
                                <InputLabel>{label}</InputLabel>
                                <TextField
                                    name={`education.${key}`}
                                    value={formData.education[key]}
                                    onChange={handleChange}
                                    fullWidth
                                    type="number"
                                    helperText={
                                        formData.total_population ? calculatePercentage(formData.education[key], formData.total_population) : ''
                                    }
                                />
                            </Stack>
                        </Grid>
                    ))}

                    {/* Annual Income Breakdown */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom mt={3}>Annual Income Breakdown</Typography>
                        <Divider />
                    </Grid>

                    {Object.entries({
                        below_10k: 'Below ₹10,000',
                        _10k_to_20k: '₹10,000 - ₹20,000',
                        _25k_to_50k: '₹25,000 - ₹50,000',
                        _50k_to_2L: '₹50,000 - ₹2 Lakh',
                        _2L_to_5L: '₹2 Lakh - ₹5 Lakh',
                        above_5L: 'Above ₹5 Lakh'
                    }).map(([key, label]) => (
                        <Grid item xs={12} sm={6} md={4} key={key}>
                            <Stack spacing={1}>
                                <InputLabel>{label}</InputLabel>
                                <TextField
                                    name={`annual_income.${key}`}
                                    value={formData.annual_income[key]}
                                    onChange={handleChange}
                                    fullWidth
                                    type="number"
                                    helperText={
                                        formData.total_population ? calculatePercentage(formData.annual_income[key], formData.total_population) : ''
                                    }
                                />
                            </Stack>
                        </Grid>
                    ))}

                    {/* Age Groups */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom mt={3}>Age Groups</Typography>
                        <Divider />
                    </Grid>

                    {Object.entries({
                        _18_25: '18-25 Years',
                        _26_40: '26-40 Years',
                        _41_60: '41-60 Years',
                        _60_above: '60+ Years'
                    }).map(([key, label]) => (
                        <Grid item xs={12} sm={6} md={3} key={key}>
                            <Stack spacing={1}>
                                <InputLabel>{label}</InputLabel>
                                <TextField
                                    name={`age_groups.${key}`}
                                    value={formData.age_groups[key]}
                                    onChange={handleChange}
                                    fullWidth
                                    type="number"
                                    helperText={
                                        formData.total_population ? calculatePercentage(formData.age_groups[key], formData.total_population) : ''
                                    }
                                />
                            </Stack>
                        </Grid>
                    ))}

                    {/* Caste Population */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom mt={3}>Caste Population</Typography>
                        <Divider />
                    </Grid>

                    {Object.entries({
                        sc: 'Scheduled Caste (SC)',
                        st: 'Scheduled Tribe (ST)',
                        obc: 'Other Backward Class (OBC)',
                        general: 'General',
                        other: 'Other'
                    }).map(([key, label]) => (
                        <Grid item xs={12} sm={6} md={4} lg={2.4} key={key}>
                            <Stack spacing={1}>
                                <InputLabel>{label}</InputLabel>
                                <TextField
                                    name={`caste_population.${key}`}
                                    value={formData.caste_population[key]}
                                    onChange={handleChange}
                                    fullWidth
                                    type="number"
                                    helperText={
                                        formData.total_population ? calculatePercentage(formData.caste_population[key], formData.total_population) : ''
                                    }
                                />
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)} disabled={loading}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Processing...' : demographics ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}