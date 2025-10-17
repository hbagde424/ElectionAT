import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Divider,
    Alert,
    Box,
    CircularProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

// Project imports
import axiosServices from 'utils/axios';

const SamitiModal = ({
    open,
    modalToggler,
    samiti,
    states,
    divisions,
    parliaments,
    assemblies,
    blocks,
    booths,
    refresh
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isEdit = Boolean(samiti);

    // Filtered data for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);
    // panchayat / village / falliya lists and filtered versions
    const [panchayats, setPanchayats] = useState([]);
    const [filteredPanchayats, setFilteredPanchayats] = useState([]);
    const [villages, setVillages] = useState([]);
    const [filteredVillages, setFilteredVillages] = useState([]);
    const [falliyas, setFalliyas] = useState([]);
    const [filteredFalliyas, setFilteredFalliyas] = useState([]);

    const validationSchema = Yup.object({
        samiti_name: Yup.string()
            .required('Samiti Name is required')
            .min(2, 'Samiti Name must be at least 2 characters')
            .max(100, 'Samiti Name must not exceed 100 characters'),
        panchayat_id: Yup.string().required('Panchayat is required'),
        village_id: Yup.string().required('Village is required'),
        falliya_id: Yup.string().required('Falliya is required'),
        count: Yup.number()
            .required('Count is required')
            .min(0, 'Count must be non-negative')
            .integer('Count must be a whole number'),
        state_id: Yup.string().required('State is required'),
        division_id: Yup.string().required('Division is required'),
        parliament_id: Yup.string().required('Parliament is required'),
        assembly_id: Yup.string().required('Assembly is required'),
        block_id: Yup.string().required('Block is required'),
        booth_id: Yup.string().required('Booth is required')
    });

    const formik = useFormik({
        initialValues: {
            samiti_name: '',
                panchayat_id: '',
                village_id: '',
                falliya_id: '',
                count: '',
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: ''
        },
        validationSchema,
        onSubmit: async (values) => {
            setLoading(true);
            setError('');
            setSuccess('');

            try {
                const payload = {
                    ...values,
                    count: parseInt(values.count, 10)
                };

                let response;
                if (isEdit) {
                    response = await axiosServices.put(`/samitis/${samiti._id}`, payload);
                } else {
                    response = await axiosServices.post('/samitis', payload);
                }

                if (response.data.success) {
                    setSuccess(isEdit ? 'Samiti updated successfully!' : 'Samiti created successfully!');
                    setTimeout(() => {
                        handleClose();
                        refresh();
                    }, 1000);
                } else {
                    setError(response.data.message || 'An error occurred');
                }
            } catch (err) {
                console.error('Error saving samiti:', err);
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    'An unexpected error occurred'
                );
            } finally {
                setLoading(false);
            }
        }
    });

    // Update filtered dropdowns based on selections
    useEffect(() => {
        if (formik.values.state_id) {
            const filtered = divisions.filter(division => {
                const stateId = division.state_id?._id || division.state_id;
                return stateId === formik.values.state_id;
            });
            setFilteredDivisions(filtered);
        } else {
            setFilteredDivisions([]);
        }
    }, [formik.values.state_id, divisions]);

    useEffect(() => {
        if (formik.values.division_id) {
            const filtered = parliaments.filter(parliament => {
                const divisionId = parliament.division_id?._id || parliament.division_id;
                return divisionId === formik.values.division_id;
            });
            setFilteredParliaments(filtered);
        } else if (formik.values.state_id) {
            const filtered = parliaments.filter(parliament => {
                const stateId = parliament.state_id?._id || parliament.state_id;
                return stateId === formik.values.state_id;
            });
            setFilteredParliaments(filtered);
        } else {
            setFilteredParliaments([]);
        }
    }, [formik.values.division_id, formik.values.state_id, parliaments]);

    useEffect(() => {
        if (formik.values.parliament_id) {
            const filtered = assemblies.filter(assembly => {
                const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                return parliamentId === formik.values.parliament_id;
            });
            setFilteredAssemblies(filtered);
        } else if (formik.values.division_id) {
            const filtered = assemblies.filter(assembly => {
                const divisionId = assembly.division_id?._id || assembly.division_id;
                return divisionId === formik.values.division_id;
            });
            setFilteredAssemblies(filtered);
        } else {
            setFilteredAssemblies([]);
        }
    }, [formik.values.parliament_id, formik.values.division_id, assemblies]);

    useEffect(() => {
        if (formik.values.assembly_id) {
            const filtered = blocks.filter(block => {
                const assemblyId = block.assembly_id?._id || block.assembly_id;
                return assemblyId === formik.values.assembly_id;
            });
            setFilteredBlocks(filtered);
        } else {
            setFilteredBlocks([]);
        }
    }, [formik.values.assembly_id, blocks]);

    useEffect(() => {
        if (formik.values.block_id) {
            const filtered = booths.filter(booth => {
                const blockId = booth.block_id?._id || booth.block_id;
                return blockId === formik.values.block_id;
            });
            setFilteredBooths(filtered);
        } else {
            setFilteredBooths([]);
        }
    }, [formik.values.block_id, booths]);

    // Fetch panchayats, villages, falliyas when modal opens
    useEffect(() => {
        const fetchLists = async () => {
            try {
                const [pRes, vRes, fRes] = await Promise.all([
                    axiosServices.get('/panchayats?all=true'),
                    axiosServices.get('/villages?all=true'),
                    axiosServices.get('/falliyas?all=true')
                ]);

                if (pRes.data?.success) setPanchayats(pRes.data.data || []);
                if (vRes.data?.success) setVillages(vRes.data.data || []);
                if (fRes.data?.success) setFalliyas(fRes.data.data || []);
            } catch (err) {
                // silently fail; lists are optional
                console.error('Error fetching panchayat/village/falliya lists', err);
            }
        };

        if (open) fetchLists();
    }, [open]);

    // filter panchayats by block
    useEffect(() => {
        if (formik.values.block_id && panchayats.length) {
            const filtered = panchayats.filter(p => {
                const blockId = p.block_id?._id || p.block_id;
                return blockId === formik.values.block_id;
            });
            setFilteredPanchayats(filtered);
        } else {
            setFilteredPanchayats([]);
        }
    }, [formik.values.block_id, panchayats]);

    // filter villages by panchayat
    useEffect(() => {
        if (formik.values.panchayat_id && villages.length) {
            const filtered = villages.filter(v => {
                const pId = v.panchayat_id?._id || v.panchayat_id;
                return pId === formik.values.panchayat_id;
            });
            setFilteredVillages(filtered);
        } else {
            setFilteredVillages([]);
        }
    }, [formik.values.panchayat_id, villages]);

    // filter falliyas by village
    useEffect(() => {
        if (formik.values.village_id && falliyas.length) {
            const filtered = falliyas.filter(f => {
                const vId = f.village_id?._id || f.village_id;
                return vId === formik.values.village_id;
            });
            setFilteredFalliyas(filtered);
        } else {
            setFilteredFalliyas([]);
        }
    }, [formik.values.village_id, falliyas]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (open) {
            if (isEdit && samiti) {
                formik.setValues({
                    samiti_name: samiti.samiti_name || '',
                    panchayat_id: samiti.panchayat_id?._id || samiti.panchayat_id || '',
                    village_id: samiti.village_id?._id || samiti.village_id || '',
                    falliya_id: samiti.falliya_id?._id || samiti.falliya_id || '',
                    count: samiti.count?.toString() || '',
                    state_id: samiti.state_id?._id || samiti.state_id || '',
                    division_id: samiti.division_id?._id || samiti.division_id || '',
                    parliament_id: samiti.parliament_id?._id || samiti.parliament_id || '',
                    assembly_id: samiti.assembly_id?._id || samiti.assembly_id || '',
                    block_id: samiti.block_id?._id || samiti.block_id || '',
                    booth_id: samiti.booth_id?._id || samiti.booth_id || ''
                });
            } else {
                formik.resetForm();
            }
            setError('');
            setSuccess('');
        }
    }, [open, samiti, isEdit]);

    const handleClose = () => {
        formik.resetForm();
        setError('');
        setSuccess('');
        modalToggler(false);
    };

    // Handle cascading changes
    const handleStateChange = (stateValue) => {
        formik.setValues({
            ...formik.values,
            state_id: stateValue,
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: ''
        });
    };

    const handleDivisionChange = (divisionValue) => {
        formik.setValues({
            ...formik.values,
            division_id: divisionValue,
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: ''
        });
    };

    const handleParliamentChange = (parliamentValue) => {
        formik.setValues({
            ...formik.values,
            parliament_id: parliamentValue,
            assembly_id: '',
            block_id: '',
            booth_id: ''
        });
    };

    const handleAssemblyChange = (assemblyValue) => {
        formik.setValues({
            ...formik.values,
            assembly_id: assemblyValue,
            block_id: '',
            booth_id: ''
        });
    };

    const handleBlockChange = (blockValue) => {
        formik.setValues({
            ...formik.values,
            block_id: blockValue,
            booth_id: '',
            panchayat_id: '',
            village_id: '',
            falliya_id: ''
        });
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '600px' }
            }}
        >
            <form onSubmit={formik.handleSubmit}>
                <DialogTitle>
                    {isEdit ? 'Edit Samiti' : 'Add New Samiti'}
                </DialogTitle>

                <DialogContent sx={{ py: 2 }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    {/* Administrative Hierarchy */}
                    <Grid container spacing={2} sx={{ mb: 1 }}>
                        <Grid item xs={12}>
                            <Box sx={{ mb: 2, mt: 2 }}>
                                <Divider textAlign="left" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    Administrative Hierarchy
                                </Divider>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                error={formik.touched.state_id && Boolean(formik.errors.state_id)}
                            >
                                <InputLabel>State *</InputLabel>
                                <Select
                                    name="state_id"
                                    value={formik.values.state_id}
                                    onChange={(e) => handleStateChange(e.target.value)}
                                    onBlur={formik.handleBlur}
                                    label="State *"
                                >
                                    <MenuItem value="">Select State</MenuItem>
                                    {states.map((state) => (
                                        <MenuItem key={state._id} value={state._id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {formik.touched.state_id && formik.errors.state_id}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                error={formik.touched.division_id && Boolean(formik.errors.division_id)}
                            >
                                <InputLabel>Division *</InputLabel>
                                <Select
                                    name="division_id"
                                    value={formik.values.division_id}
                                    onChange={(e) => handleDivisionChange(e.target.value)}
                                    onBlur={formik.handleBlur}
                                    label="Division *"
                                    disabled={!formik.values.state_id}
                                >
                                    <MenuItem value="">
                                        {!formik.values.state_id ? "Select State First" : "Select Division"}
                                    </MenuItem>
                                    {filteredDivisions.map((division) => (
                                        <MenuItem key={division._id} value={division._id}>
                                            {division.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {formik.touched.division_id && formik.errors.division_id}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                error={formik.touched.parliament_id && Boolean(formik.errors.parliament_id)}
                            >
                                <InputLabel>Parliament *</InputLabel>
                                <Select
                                    name="parliament_id"
                                    value={formik.values.parliament_id}
                                    onChange={(e) => handleParliamentChange(e.target.value)}
                                    onBlur={formik.handleBlur}
                                    label="Parliament *"
                                    disabled={!formik.values.division_id}
                                >
                                    <MenuItem value="">
                                        {!formik.values.division_id ? "Select Division First" : "Select Parliament"}
                                    </MenuItem>
                                    {filteredParliaments.map((parliament) => (
                                        <MenuItem key={parliament._id} value={parliament._id}>
                                            {parliament.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {formik.touched.parliament_id && formik.errors.parliament_id}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                error={formik.touched.assembly_id && Boolean(formik.errors.assembly_id)}
                            >
                                <InputLabel>Assembly *</InputLabel>
                                <Select
                                    name="assembly_id"
                                    value={formik.values.assembly_id}
                                    onChange={(e) => handleAssemblyChange(e.target.value)}
                                    onBlur={formik.handleBlur}
                                    label="Assembly *"
                                    disabled={!formik.values.parliament_id}
                                >
                                    <MenuItem value="">
                                        {!formik.values.parliament_id ? "Select Parliament First" : "Select Assembly"}
                                    </MenuItem>
                                    {filteredAssemblies.map((assembly) => (
                                        <MenuItem key={assembly._id} value={assembly._id}>
                                            {assembly.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {formik.touched.assembly_id && formik.errors.assembly_id}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                error={formik.touched.block_id && Boolean(formik.errors.block_id)}
                            >
                                <InputLabel>Block *</InputLabel>
                                <Select
                                    name="block_id"
                                    value={formik.values.block_id}
                                    onChange={(e) => handleBlockChange(e.target.value)}
                                    onBlur={formik.handleBlur}
                                    label="Block *"
                                    disabled={!formik.values.assembly_id}
                                >
                                    <MenuItem value="">
                                        {!formik.values.assembly_id ? "Select Assembly First" : "Select Block"}
                                    </MenuItem>
                                    {filteredBlocks.map((block) => (
                                        <MenuItem key={block._id} value={block._id}>
                                            {block.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {formik.touched.block_id && formik.errors.block_id}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                error={formik.touched.booth_id && Boolean(formik.errors.booth_id)}
                            >
                                <InputLabel>Booth *</InputLabel>
                                <Select
                                    name="booth_id"
                                    value={formik.values.booth_id}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    label="Booth *"
                                    disabled={!formik.values.block_id}
                                >
                                    <MenuItem value="">
                                        {!formik.values.block_id ? "Select Block First" : "Select Booth"}
                                    </MenuItem>
                                    {filteredBooths.map((booth) => (
                                        <MenuItem key={booth._id} value={booth._id}>
                                            {booth.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {formik.touched.booth_id && formik.errors.booth_id}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                error={formik.touched.panchayat_id && Boolean(formik.errors.panchayat_id)}
                            >
                                <InputLabel>Panchayat *</InputLabel>
                                <Select
                                    name="panchayat_id"
                                    value={formik.values.panchayat_id}
                                    onChange={(e) => formik.setFieldValue('panchayat_id', e.target.value)}
                                    onBlur={formik.handleBlur}
                                    label="Panchayat *"
                                    disabled={!formik.values.block_id}
                                >
                                    <MenuItem value="">{!formik.values.block_id ? 'Select Block First' : 'Select Panchayat'}</MenuItem>
                                    {filteredPanchayats.map((p) => (
                                        <MenuItem key={p._id} value={p._id}>{p.name || p.panchayat_name || p._id}</MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {formik.touched.panchayat_id && formik.errors.panchayat_id}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                error={formik.touched.village_id && Boolean(formik.errors.village_id)}
                            >
                                <InputLabel>Village *</InputLabel>
                                <Select
                                    name="village_id"
                                    value={formik.values.village_id}
                                    onChange={(e) => formik.setFieldValue('village_id', e.target.value)}
                                    onBlur={formik.handleBlur}
                                    label="Village *"
                                    disabled={!formik.values.panchayat_id}
                                >
                                    <MenuItem value="">{!formik.values.panchayat_id ? 'Select Panchayat First' : 'Select Village'}</MenuItem>
                                    {filteredVillages.map((v) => (
                                        <MenuItem key={v._id} value={v._id}>{v.name || v.village_name || v._id}</MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {formik.touched.village_id && formik.errors.village_id}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                error={formik.touched.falliya_id && Boolean(formik.errors.falliya_id)}
                            >
                                <InputLabel>Falliya *</InputLabel>
                                <Select
                                    name="falliya_id"
                                    value={formik.values.falliya_id}
                                    onChange={(e) => formik.setFieldValue('falliya_id', e.target.value)}
                                    onBlur={formik.handleBlur}
                                    label="Falliya *"
                                    disabled={!formik.values.village_id}
                                >
                                    <MenuItem value="">{!formik.values.village_id ? 'Select Village First' : 'Select Falliya'}</MenuItem>
                                    {filteredFalliyas.map((f) => (
                                        <MenuItem key={f._id} value={f._id}>{f.name || f.falliya_name || f._id}</MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>
                                    {formik.touched.falliya_id && formik.errors.falliya_id}
                                </FormHelperText>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Box sx={{ mb: 2, mt: 1 }}>
                                <Divider textAlign="left" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                    Basic Information
                                </Divider>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl
                                fullWidth
                                error={formik.touched.samiti_name && Boolean(formik.errors.samiti_name)}
                            >
                                <InputLabel>Samiti Name *</InputLabel>
                                <Select
                                    name="samiti_name"
                                    value={formik.values.samiti_name}
                                    onChange={(e) => formik.setFieldValue('samiti_name', e.target.value)}
                                    onBlur={formik.handleBlur}
                                    label="Samiti Name *"
                                >
                                    <MenuItem value="">Select Samiti</MenuItem>
                                    <MenuItem value="ganesh samiti">ganesh samiti</MenuItem>
                                    <MenuItem value="tenkar samiti">tenkar samiti</MenuItem>
                                    <MenuItem value="mandir samiti">mandir samiti</MenuItem>
                                    <MenuItem value="DP samiti">DP samiti</MenuItem>
                                    <MenuItem value="Bhagoriya samiti">Bhagoriya samiti</MenuItem>
                                    <MenuItem value="road samiti">road samiti</MenuItem>
                                </Select>
                                <FormHelperText>
                                    {formik.touched.samiti_name && formik.errors.samiti_name}
                                </FormHelperText>
                            </FormControl>
                        </Grid>

                        

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                name="count"
                                label="Count *"
                                value={formik.values.count}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.count && Boolean(formik.errors.count)}
                                helperText={formik.touched.count && formik.errors.count}
                                placeholder="Enter count"
                                inputProps={{ min: 0, step: 1 }}
                            />
                        </Grid>


                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={loading}
                        loadingPosition="start"
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
                    </LoadingButton>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default SamitiModal;