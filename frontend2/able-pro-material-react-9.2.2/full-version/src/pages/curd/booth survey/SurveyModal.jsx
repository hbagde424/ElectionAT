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
    Grid
} from '@mui/material';
import { useEffect, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';

export default function BoothSurveyModal({ 
    open, 
    modalToggler, 
    survey, 
    booths,
    users,
    divisions,
    parliaments,
    assemblies,
    blocks,
    refresh 
}) {
    const [formData, setFormData] = useState({
        booth_id: '',
        survey_done_by: '',
        survey_date: new Date(),
        status: 'Pending',
        remark: '',
        poll_result: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: ''
    });

    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);

    useEffect(() => {
        if (survey) {
            setFormData({
                booth_id: survey.booth_id?._id || '',
                survey_done_by: survey.survey_done_by?._id || '',
                survey_date: new Date(survey.survey_date) || new Date(),
                status: survey.status || 'Pending',
                remark: survey.remark || '',
                poll_result: survey.poll_result || '',
                division_id: survey.division_id?._id || '',
                parliament_id: survey.parliament_id?._id || '',
                assembly_id: survey.assembly_id?._id || '',
                block_id: survey.block_id?._id || ''
            });
        } else {
            setFormData({
                booth_id: '',
                survey_done_by: '',
                survey_date: new Date(),
                status: 'Pending',
                remark: '',
                poll_result: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: ''
            });
        }
    }, [survey]);

    // Filter parliaments by division
    useEffect(() => {
        if (formData.division_id) {
            const filtered = parliaments.filter(par => par.division_id?._id === formData.division_id);
            setFilteredParliaments(filtered);
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

    // Filter assemblies by parliament
    useEffect(() => {
        if (formData.parliament_id) {
            const filtered = assemblies.filter(asm => asm.parliament_id?._id === formData.parliament_id);
            setFilteredAssemblies(filtered);
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({ 
                ...prev, 
                assembly_id: '',
                block_id: ''
            }));
        }
    }, [formData.parliament_id, assemblies]);

    // Filter blocks by assembly
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = blocks.filter(blk => blk.assembly_id?._id === formData.assembly_id);
            setFilteredBlocks(filtered);
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({ 
                ...prev, 
                block_id: ''
            }));
        }
    }, [formData.assembly_id, blocks]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'division_id') {
                return { 
                    ...prev, 
                    [name]: value, 
                    parliament_id: '', 
                    assembly_id: '',
                    block_id: ''
                };
            }
            if (name === 'parliament_id') {
                return { 
                    ...prev, 
                    [name]: value, 
                    assembly_id: '',
                    block_id: ''
                };
            }
            if (name === 'assembly_id') {
                return { 
                    ...prev, 
                    [name]: value, 
                    block_id: ''
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, survey_date: date }));
    };

    const handleSubmit = async () => {
        const method = survey ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = survey
            ? `http://localhost:5000/api/booth-surveys/${survey._id}`
            : 'http://localhost:5000/api/booth-surveys';

        const payload = {
            ...formData,
            survey_date: formData.survey_date.toISOString()
        };

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            modalToggler(false);
            refresh();
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{survey ? 'Edit Booth Survey' : 'Add Booth Survey'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Booth</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="booth_id"
                                        value={formData.booth_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="">Select Booth</MenuItem>
                                        {booths.map((booth) => (
                                            <MenuItem key={booth._id} value={booth._id}>
                                                {booth.name} (Booth: {booth.booth_number})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Surveyor</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="survey_done_by"
                                        value={formData.survey_done_by}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="">Select Surveyor</MenuItem>
                                        {users.map((user) => (
                                            <MenuItem key={user._id} value={user._id}>
                                                {user.name}
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
                                <InputLabel>Survey Date</InputLabel>
                                <DatePicker
                                    value={formData.survey_date}
                                    onChange={handleDateChange}
                                    renderInput={(params) => <TextField fullWidth {...params} />}
                                />
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
                                        <MenuItem value="Pending">Pending</MenuItem>
                                        <MenuItem value="In Progress">In Progress</MenuItem>
                                        <MenuItem value="Completed">Completed</MenuItem>
                                        <MenuItem value="Verified">Verified</MenuItem>
                                        <MenuItem value="Rejected">Rejected</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Division</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="division_id"
                                        value={formData.division_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="">Select Division</MenuItem>
                                        {divisions.map((division) => (
                                            <MenuItem key={division._id} value={division._id}>
                                                {division.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Parliament</InputLabel>
                                <FormControl fullWidth>
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
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Assembly</InputLabel>
                                <FormControl fullWidth>
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
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Block</InputLabel>
                                <FormControl fullWidth>
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
                            </Stack>
                        </Grid>
                    </Grid>

                    <Stack spacing={1}>
                        <InputLabel>Poll Result</InputLabel>
                        <TextField 
                            name="poll_result" 
                            value={formData.poll_result} 
                            onChange={handleChange} 
                            fullWidth 
                            multiline
                            rows={2}
                            inputProps={{ maxLength: 200 }}
                        />
                    </Stack>

                    <Stack spacing={1}>
                        <InputLabel>Remarks</InputLabel>
                        <TextField 
                            name="remark" 
                            value={formData.remark} 
                            onChange={handleChange} 
                            fullWidth 
                            multiline
                            rows={3}
                            inputProps={{ maxLength: 500 }}
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {survey ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}