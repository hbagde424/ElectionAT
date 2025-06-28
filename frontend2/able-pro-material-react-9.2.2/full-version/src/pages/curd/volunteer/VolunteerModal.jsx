import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Stack,
    TextField,
    InputLabel,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function VolunteerModal({ open, modalToggler, volunteer, refresh }) {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        booth_id: '',
        party_id: '',
        assembly_id: '',
        parliament_id: '',
        block_id: '',
        area_responsibility: '',
        activity_level: 'Medium',
        remarks: ''
    });

    const [booths, setBooths] = useState([]);
    const [parties, setParties] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const BASE_URL = process.env.REACT_APP_API_BASE_URL;
    useEffect(() => {
        Promise.all([
            fetch('${BASE_URL}/booths').then((res) => res.json()),
            fetch('${BASE_URL}/parties').then((res) => res.json()),
            fetch('${BASE_URL}/assemblies').then((res) => res.json()),
            fetch('${BASE_URL}/parliaments').then((res) => res.json()),
            fetch('${BASE_URL}/blocks').then((res) => res.json())
        ]).then(([boothRes, partyRes, assemblyRes, parliamentRes, blockRes]) => {
            if (boothRes.success) setBooths(boothRes.data);
            if (partyRes.success) setParties(partyRes.data);
            if (assemblyRes.success) setAssemblies(assemblyRes.data);
            if (parliamentRes.success) setParliaments(parliamentRes.data);
            if (blockRes.success) setBlocks(blockRes.data);
        });
    }, []);

    useEffect(() => {
        if (volunteer) {
            setFormData({
                name: volunteer.name || '',
                role: volunteer.role || '',
                phone: volunteer.phone || '',
                email: volunteer.email || '',
                booth_id: volunteer.booth_id?._id || '',
                party_id: volunteer.party_id?._id || '',
                assembly_id: volunteer.assembly_id?._id || '',
                parliament_id: volunteer.parliament_id?._id || '',
                block_id: volunteer.block_id?._id || '',
                area_responsibility: volunteer.area_responsibility || '',
                activity_level: volunteer.activity_level || 'Medium',
                remarks: volunteer.remarks || ''
            });
        } else {
            setFormData({
                name: '',
                role: '',
                phone: '',
                email: '',
                booth_id: '',
                party_id: '',
                assembly_id: '',
                parliament_id: '',
                block_id: '',
                area_responsibility: '',
                activity_level: 'Medium',
                remarks: ''
            });
        }
    }, [volunteer]);


    useEffect(() => {
        const booth = booths.find((b) => b._id === formData.booth_id);
        if (booth) {
            setFormData((prev) => ({
                ...prev,
                assembly_id: booth.assembly_id?._id || '',
                parliament_id: booth.parliament_id?._id || '',
                block_id: booth.block_id?._id || ''
            }));
        }
    }, [formData.booth_id, booths]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        const method = volunteer ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = volunteer
            ? `${BASE_URL}/booth-volunteers/${volunteer._id}`
            : '${BASE_URL}/booth-volunteers';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            modalToggler(false);
            refresh();
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{volunteer ? 'Edit Volunteer' : 'Add Volunteer'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {[
                        ['Name', 'name'],
                        ['Role', 'role'],
                        ['Phone', 'phone'],
                        ['Email', 'email'],
                        ['Area Responsibility', 'area_responsibility'],
                        ['Remarks', 'remarks']
                    ].map(([label, name]) => (
                        <Grid item xs={12} sm={6} key={name}>
                            <Stack spacing={1}>
                                <InputLabel>{label}</InputLabel>
                                <TextField name={name} value={formData[name]} onChange={handleChange} fullWidth />
                            </Stack>
                        </Grid>
                    ))}

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Booth</InputLabel>
                            <FormControl fullWidth>
                                <Select name="booth_id" value={formData.booth_id} onChange={handleChange}>
                                    {booths.map((booth) => (
                                        <MenuItem key={booth._id} value={booth._id}>
                                            {booth.name} ({booth.number})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Party</InputLabel>
                            <FormControl fullWidth>
                                <Select name="party_id" value={formData.party_id} onChange={handleChange}>
                                    {parties.map((party) => (
                                        <MenuItem key={party._id} value={party._id}>
                                            {party.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Assembly</InputLabel>
                            <FormControl fullWidth>
                                <Select name="assembly_id" value={formData.assembly_id} onChange={handleChange}>
                                    {assemblies.map((a) => (
                                        <MenuItem key={a._id} value={a._id}>
                                            {a.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Parliament</InputLabel>
                            <FormControl fullWidth>
                                <Select name="parliament_id" value={formData.parliament_id} onChange={handleChange}>
                                    {parliaments.map((p) => (
                                        <MenuItem key={p._id} value={p._id}>
                                            {p.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Block</InputLabel>
                            <FormControl fullWidth>
                                <Select name="block_id" value={formData.block_id} onChange={handleChange}>
                                    {blocks.map((b) => (
                                        <MenuItem key={b._id} value={b._id}>
                                            {b.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Activity Level</InputLabel>
                            <FormControl fullWidth>
                                <Select name="activity_level" value={formData.activity_level} onChange={handleChange}>
                                    <MenuItem value="High">High</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="Low">Low</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {volunteer ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
