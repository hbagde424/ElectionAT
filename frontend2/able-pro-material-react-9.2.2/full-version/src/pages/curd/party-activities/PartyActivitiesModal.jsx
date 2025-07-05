// PartyActivitiesModal.jsx
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Switch, FormControlLabel, Chip
} from '@mui/material';
import { useEffect, useState } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function PartyActivitiesModal({ open, modalToggler, partyActivity, divisions, blocks, refresh }) {
    const [formData, setFormData] = useState({
        party_id: '',
        division_id: '',
        block_id: '',
        assembly_id: '',
        booth_id: '',
        activity_type: '',
        title: '',
        description: '',
        activity_date: new Date(),
        status: 'scheduled',
        created_by: '',
        attendance_count: '',
        media_coverage: false
    });

    const [filteredBlocks, setFilteredBlocks] = useState([]);

    const activityTypes = [
        'rally', 'meeting', 'campaign', 'door-to-door', 'public-address',
        'fundraiser', 'volunteer-training', 'community-outreach', 'debate', 'other'
    ];

    const statusOptions = [
        'scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'
    ];

    useEffect(() => {
        if (partyActivity) {
            setFormData({
                party_id: partyActivity.party_id || '',
                division_id: partyActivity.division_id?._id || '',
                block_id: partyActivity.block_id?._id || '',
                assembly_id: partyActivity.assembly_id || '',
                booth_id: partyActivity.booth_id || '',
                activity_type: partyActivity.activity_type || '',
                title: partyActivity.title || '',
                description: partyActivity.description || '',
                activity_date: partyActivity.activity_date ? new Date(partyActivity.activity_date) : new Date(),
                status: partyActivity.status || 'scheduled',
                created_by: partyActivity.created_by || '',
                attendance_count: partyActivity.attendance_count || '',
                media_coverage: partyActivity.media_coverage || false
            });
        } else {
            setFormData({
                party_id: '',
                division_id: '',
                block_id: '',
                assembly_id: '',
                booth_id: '',
                activity_type: '',
                title: '',
                description: '',
                activity_date: new Date(),
                status: 'scheduled',
                created_by: '',
                attendance_count: '',
                media_coverage: false
            });
        }
    }, [partyActivity]);

    // Filter blocks by division
    useEffect(() => {
        if (formData.division_id) {
            const filtered = blocks.filter(block => block.division_id?._id === formData.division_id);
            setFilteredBlocks(filtered);
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({
                ...prev,
                block_id: ''
            }));
        }
    }, [formData.division_id, blocks]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDateChange = (date) => {
        setFormData((prev) => ({ ...prev, activity_date: date }));
    };

    const handleSubmit = async () => {
        const method = partyActivity ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = partyActivity
            ? `http://localhost:5000/api/party-activities/${partyActivity._id}`
            : 'http://localhost:5000/api/party-activities';

        // Format the data for submission
        const submitData = {
            ...formData,
            attendance_count: formData.attendance_count ? parseInt(formData.attendance_count) : 0,
            activity_date: formData.activity_date.toISOString()
        };

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
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
                <DialogTitle>{partyActivity ? 'Edit Party Activity' : 'Add Party Activity'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        {/* Row 1 */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Party ID</InputLabel>
                                <TextField
                                    name="party_id"
                                    value={formData.party_id}
                                    onChange={handleChange}
                                    fullWidth
                                    placeholder="Enter party ID"
                                />
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
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

                        {/* Row 2 */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Block</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="block_id"
                                        value={formData.block_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.division_id}
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

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Activity Type</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="activity_type"
                                        value={formData.activity_type}
                                        onChange={handleChange}
                                    >
                                        {activityTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                <Chip label={type.toUpperCase()} size="small" />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>

                        {/* Row 3 */}
                        <Grid item xs={12}>
                            <Stack spacing={1}>
                                <InputLabel>Title</InputLabel>
                                <TextField
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    fullWidth
                                    placeholder="Enter activity title"
                                />
                            </Stack>
                        </Grid>

                        {/* Row 4 */}
                        <Grid item xs={12}>
                            <Stack spacing={1}>
                                <InputLabel>Description</InputLabel>
                                <TextField
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Enter activity description"
                                />
                            </Stack>
                        </Grid>

                        {/* Row 5 */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Activity Date & Time</InputLabel>
                                <DateTimePicker
                                    value={formData.activity_date}
                                    onChange={handleDateChange}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Status</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        {statusOptions.map((status) => (
                                            <MenuItem key={status} value={status}>
                                                <Chip
                                                    label={status.toUpperCase()}
                                                    size="small"
                                                    color={
                                                        status === 'scheduled' ? 'info' :
                                                            status === 'ongoing' ? 'warning' :
                                                                status === 'completed' ? 'success' :
                                                                    status === 'cancelled' ? 'error' : 'default'
                                                    }
                                                />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>

                        {/* Row 6 */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Created By</InputLabel>
                                <TextField
                                    name="created_by"
                                    value={formData.created_by}
                                    onChange={handleChange}
                                    fullWidth
                                    placeholder="Enter creator ID"
                                />
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Attendance Count</InputLabel>
                                <TextField
                                    name="attendance_count"
                                    type="number"
                                    value={formData.attendance_count}
                                    onChange={handleChange}
                                    fullWidth
                                    placeholder="Enter expected/actual attendance"
                                />
                            </Stack>
                        </Grid>

                        {/* Row 7 */}
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="media_coverage"
                                        checked={formData.media_coverage}
                                        onChange={handleChange}
                                    />
                                }
                                label="Media Coverage"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => modalToggler(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {partyActivity ? 'Update' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}
