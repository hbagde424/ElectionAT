const codingTypes = [
    'BC', 'PP', 'IP', 'FH', 'SMM', 'MS', 'FP', 'ER', 'AK', 'FM',
    'वरिष्ठ', 'युवा', 'वोटर प्रभारी'
];
// codingModal.js
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Box, Checkbox, FormGroup, FormControlLabel, Autocomplete
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import JWTContext from 'contexts/JWTContext';


export default function CodingModal({
    open,
    modalToggler,
    codingEntry,
    states,
    divisions,
    parliaments,
    assemblies,
    blocks,
    booths,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};


    // Validate mobile and WhatsApp number fields

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        facebook: '',
        instagram: '',
        twitter: '',
        whatsapp_number: '',
        description: '',
        coding_types: [],
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const [submitted, setSubmitted] = useState(false);
    const [backendError, setBackendError] = useState('');

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    useEffect(() => {
        if (codingEntry) {
            setFormData({
                name: codingEntry.name || '',
                mobile: codingEntry.mobile || '',
                email: codingEntry.email || '',
                facebook: codingEntry.facebook || '',
                instagram: codingEntry.instagram || '',
                twitter: codingEntry.twitter || '',
                whatsapp_number: codingEntry.whatsapp_number || '',
                description: codingEntry.description || '',
                coding_types: codingEntry.coding_types || [],
                state_id: codingEntry.state_id?._id?.toString() || codingEntry.state_id?.toString() || '',
                division_id: codingEntry.division_id?._id?.toString() || codingEntry.division_id?.toString() || '',
                parliament_id: codingEntry.parliament_id?._id?.toString() || codingEntry.parliament_id?.toString() || '',
                assembly_id: codingEntry.assembly_id?._id?.toString() || codingEntry.assembly_id?.toString() || '',
                block_id: codingEntry.block_id?._id?.toString() || codingEntry.block_id?.toString() || '',
                booth_id: codingEntry.booth_id?._id?.toString() || codingEntry.booth_id?.toString() || ''
            });
        } else {
            setFormData({
                name: '',
                mobile: '',
                email: '',
                facebook: '',
                instagram: '',
                twitter: '',
                whatsapp_number: '',
                description: '',
                coding_types: [],
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            });
        }
    }, [codingEntry]);
    // For ReactQuill description
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
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
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
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({
                ...prev,
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
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
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({
                ...prev,
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.parliament_id, assemblies]);

    // Assembly -> Block
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = blocks?.filter(block => {
                const blockAssemblyId = block.assembly_id?._id || block.assembly_id;
                return blockAssemblyId === formData.assembly_id;
            }) || [];
            setFilteredBlocks(filtered);

            if (formData.block_id && !filtered.find(b => b._id === formData.block_id)) {
                setFormData(prev => ({
                    ...prev,
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({
                ...prev,
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.assembly_id, blocks]);

    // Block -> Booth
    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths?.filter(booth => {
                const boothBlockId = booth.block_id?._id || booth.block_id;
                return boothBlockId === formData.block_id;
            }) || [];
            setFilteredBooths(filtered);

            if (formData.booth_id && !filtered.find(b => b._id === formData.booth_id)) {
                setFormData(prev => ({
                    ...prev,
                    booth_id: ''
                }));
            }
        } else {
            setFilteredBooths([]);
            setFormData(prev => ({
                ...prev,
                booth_id: ''
            }));
        }
    }, [formData.block_id, booths]);

    // Remove duplicate handleChange definition if present

    const handleCodingTypeChange = (type) => {
        setFormData(prev => {
            const newTypes = prev.coding_types.includes(type)
                ? prev.coding_types.filter(t => t !== type)
                : [...prev.coding_types, type];
            return {
                ...prev,
                coding_types: newTypes
            };
        });
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        setBackendError('');

        // Validation
        const requiredFields = [
            'name', 'mobile', 'coding_types',
            'state_id', 'division_id', 'parliament_id',
            'assembly_id', 'block_id', 'booth_id'
        ];

        for (const field of requiredFields) {
            if (!formData[field] || (field === 'coding_types' && formData[field].length === 0)) {
                return;
            }
        }

        const method = codingEntry ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = codingEntry
            ? `${import.meta.env.VITE_APP_API_URL}/codings/${codingEntry._id}`
            : `${import.meta.env.VITE_APP_API_URL}/codings`;

        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = codingEntry ? { updated_by: userId } : { created_by: userId };
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
                // Always try to show the API error message if present
                let errorMsg = 'Failed to save coding entry. Please check the form data.';
                try {
                    const errorData = await res.json();
                    if (errorData && (errorData.message || errorData.error)) {
                        errorMsg = errorData.message || errorData.error;
                    } else {
                        errorMsg = JSON.stringify(errorData);
                    }
                    console.error('Failed to submit coding entry:', errorData);
                } catch (jsonErr) {
                    // If not JSON, try to get raw text
                    const rawText = await res.text();
                    errorMsg = rawText || errorMsg;
                    console.error('Failed to parse error as JSON. Raw response:', rawText);
                }
                setBackendError(errorMsg);
            }
        } catch (error) {
            console.error('Error submitting coding entry:', error);
            setBackendError('An error occurred while saving the coding entry.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{codingEntry ? 'Edit Coding Entry' : 'Add Coding Entry'}</DialogTitle>
            <DialogContent>
                {backendError && (
                    <Box sx={{ color: 'error.main', mb: 2, fontWeight: 500 }}>{backendError}</Box>
                )}
                <Grid container spacing={3} mt={1}>
                    {/* Row 1: Name and Mobile */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Name</InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.name}
                                helperText={submitted && !formData.name ? 'Name is required' : ''}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Mobile</InputLabel>
                            <TextField
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.mobile}
                                helperText={submitted && !formData.mobile ? 'Mobile is required' : ''}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 2: Email and WhatsApp */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Email</InputLabel>
                            <TextField
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                fullWidth
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>WhatsApp Number</InputLabel>
                            <TextField
                                name="whatsapp_number"
                                value={formData.whatsapp_number}
                                onChange={handleChange}
                                fullWidth
                            />
                        </Stack>
                    </Grid>

                    {/* Row 3: Social Media */}
                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel>Facebook</InputLabel>
                            <TextField
                                name="facebook"
                                value={formData.facebook}
                                onChange={handleChange}
                                fullWidth
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel>Instagram</InputLabel>
                            <TextField
                                name="instagram"
                                value={formData.instagram}
                                onChange={handleChange}
                                fullWidth
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel>Twitter</InputLabel>
                            <TextField
                                name="twitter"
                                value={formData.twitter}
                                onChange={handleChange}
                                fullWidth
                            />
                        </Stack>
                    </Grid>

                    {/* Description (ReactQuill) */}
                    <Grid item xs={12}>
                        <InputLabel>Description</InputLabel>
                        <ReactQuill
                            theme="snow"
                            value={formData.description}
                            onChange={handleDescriptionChange}
                            placeholder="Enter coding entry description"
                            style={{ background: 'white' }}
                        />
                    </Grid>

                    {/* Row 4: Coding Types */}
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel required>Coding Types</InputLabel>
                            <FormGroup row>
                                {codingTypes.map((type) => (
                                    <FormControlLabel
                                        key={type}
                                        control={
                                            <Checkbox
                                                checked={formData.coding_types.includes(type)}
                                                onChange={() => handleCodingTypeChange(type)}
                                                name={type}
                                            />
                                        }
                                        label={type}
                                    />
                                ))}
                            </FormGroup>
                            {submitted && formData.coding_types.length === 0 && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>At least one coding type is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 5: State and Division */}
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

                    {/* Row 6: Parliament and Assembly */}
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

                    {/* Row 7: Block and Booth */}
                    <Grid item xs={12} sm={6}>
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
                                    {filteredBooths.map((booth) => (
                                        <MenuItem key={booth._id} value={booth._id}>
                                            {booth.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.booth_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Booth is required</Box>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {codingEntry ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
