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
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        total_population: '',
        total_electors: '',
        male_electors: '',
        female_electors: '',
        other_electors: '',
        education: {
            illiterate: '',
            educated: '',
            class_1_to_5: '',
            class_5_to_10: '',
            class_10_to_12: '',
            graduate: '',
            post_graduate: '',
            other_education: ''
        },
        annual_income: {
            below_10k: '',
            _10k_to_20k: '',
            _25k_to_50k: '',
            _50k_to_2L: '',
            _2L_to_5L: '',
            above_5L: ''
        },
        age_groups: {
            _18_25: '',
            _26_40: '',
            _41_60: '',
            _60_above: ''
        },
        caste_population: {
            sc: '',
            st: '',
            obc: '',
            general: '',
            other: ''
        },
        literacy_rate: ''
    });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (demographics) {
            setFormData({
                total_population: demographics.total_population || '',
                total_electors: demographics.total_electors || '',
                male_electors: demographics.male_electors || '',
                female_electors: demographics.female_electors || '',
                other_electors: demographics.other_electors || '',
                education: demographics.education || {
                    illiterate: '',
                    educated: '',
                    class_1_to_5: '',
                    class_5_to_10: '',
                    class_10_to_12: '',
                    graduate: '',
                    post_graduate: '',
                    other_education: ''
                },
                annual_income: demographics.annual_income || {
                    below_10k: '',
                    _10k_to_20k: '',
                    _25k_to_50k: '',
                    _50k_to_2L: '',
                    _2L_to_5L: '',
                    above_5L: ''
                },
                age_groups: demographics.age_groups || {
                    _18_25: '',
                    _26_40: '',
                    _41_60: '',
                    _60_above: ''
                },
                caste_population: demographics.caste_population || {
                    sc: '',
                    st: '',
                    obc: '',
                    general: '',
                    other: ''
                },
                literacy_rate: demographics.literacy_rate || ''
            });
        } else {
            setFormData({
                total_population: '',
                total_electors: '',
                male_electors: '',
                female_electors: '',
                other_electors: '',
                education: {
                    illiterate: '',
                    educated: '',
                    class_1_to_5: '',
                    class_5_to_10: '',
                    class_10_to_12: '',
                    graduate: '',
                    post_graduate: '',
                    other_education: ''
                },
                annual_income: {
                    below_10k: '',
                    _10k_to_20k: '',
                    _25k_to_50k: '',
                    _50k_to_2L: '',
                    _2L_to_5L: '',
                    above_5L: ''
                },
                age_groups: {
                    _18_25: '',
                    _26_40: '',
                    _41_60: '',
                    _60_above: ''
                },
                caste_population: {
                    sc: '',
                    st: '',
                    obc: '',
                    general: '',
                    other: ''
                },
                literacy_rate: ''
            });
        }
    }, [demographics]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Check if the field is nested (contains a dot)
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        
        // Basic validation
        const requiredFields = [
            'total_population', 'total_electors', 
            'male_electors', 'female_electors'
        ];
        
        for (const field of requiredFields) {
            if (!formData[field] || isNaN(formData[field])) {
                return;
            }
        }

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
            booth_id: booth._id,
            state_id: booth.state_id?._id || booth.state_id,
            division_id: booth.division_id?._id || booth.division_id,
            assembly_id: booth.assembly_id?._id || booth.assembly_id,
            parliament_id: booth.parliament_id?._id || booth.parliament_id,
            block_id: booth.block_id?._id || booth.block_id,
            ...formData,
            created_by: demographics ? undefined : userId,
            updated_by: userId
        };

        // Convert string numbers to actual numbers
        Object.keys(submitData).forEach(key => {
            if (typeof submitData[key] === 'string' && !isNaN(submitData[key])) {
                submitData[key] = Number(submitData[key]);
            }
        });

        // Convert nested objects' string numbers
        ['education', 'annual_income', 'age_groups', 'caste_population'].forEach(group => {
            if (submitData[group]) {
                Object.keys(submitData[group]).forEach(key => {
                    if (typeof submitData[group][key] === 'string' && !isNaN(submitData[group][key])) {
                        submitData[group][key] = Number(submitData[group][key]);
                    }
                });
            }
        });

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
                alert('Failed to save demographics. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting demographics:', error);
            alert('An error occurred while saving the demographics.');
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
                    {booth?.name} (Booth #{booth?.booth_number})
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
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
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {demographics ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}