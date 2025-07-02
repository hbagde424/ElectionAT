import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Grid, Stack, TextField, InputLabel, Select,
    MenuItem, FormControl
} from '@mui/material';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export default function VisitModal({ open, modalToggler, visit, refresh }) {
    const [formData, setFormData] = useState({
        booth_id: '', block_id: '', assembly_id: '', parliament_id: '', division_id: '',
        person_name: '', post: '', date: '', declaration: '', remark: ''
    });

    const [booths, setBooths] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [divisions, setDivisions] = useState([]);

    useEffect(() => {
        Promise.all([
            fetch('http://localhost:5000/api/booths').then(res => res.json()),
            fetch('http://localhost:5000/api/blocks').then(res => res.json()),
            fetch('http://localhost:5000/api/assemblies').then(res => res.json()),
            fetch('http://localhost:5000/api/parliaments').then(res => res.json()),
            fetch('http://localhost:5000/api/divisions').then(res => res.json())
        ]).then(([boothRes, blockRes, assemblyRes, parliamentRes, divisionRes]) => {
            if (boothRes.success) setBooths(boothRes.data);
            if (blockRes.success) setBlocks(blockRes.data);
            if (assemblyRes.success) setAssemblies(assemblyRes.data);
            if (parliamentRes.success) setParliaments(parliamentRes.data);
            if (divisionRes.success) setDivisions(divisionRes.data);
        });
    }, []);

    useEffect(() => {
        if (visit) {
            setFormData({
                booth_id: visit.booth_id?._id || '',
                block_id: visit.block_id?._id || '',
                assembly_id: visit.assembly_id?._id || '',
                parliament_id: visit.parliament_id?._id || '',
                division_id: visit.division_id?._id || '',
                person_name: visit.person_name || '',
                post: visit.post || '',
                date: dayjs(visit.date).format('YYYY-MM-DD'),
                declaration: visit.declaration || '',
                remark: visit.remark || ''
            });
        } else {
            setFormData({ booth_id: '', block_id: '', assembly_id: '', parliament_id: '', division_id: '', person_name: '', post: '', date: '', declaration: '', remark: '' });
        }
    }, [visit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('serviceToken');
        const method = visit ? 'PUT' : 'POST';
        const url = visit ? `http://localhost:5000/api/visits/${visit._id}` : 'http://localhost:5000/api/visits';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            modalToggler(false);
            refresh();
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{visit ? 'Edit Visit' : 'Add Visit'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {[['Person Name', 'person_name'], ['Post', 'post'], ['Declaration', 'declaration'], ['Remark', 'remark']].map(([label, name]) => (
                        <Grid item xs={12} sm={6} key={name}>
                            <Stack spacing={1}>
                                <InputLabel>{label}</InputLabel>
                                <TextField name={name} value={formData[name]} onChange={handleChange} fullWidth />
                            </Stack>
                        </Grid>
                    ))}

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Date</InputLabel>
                            <TextField type="date" name="date" value={formData.date} onChange={handleChange} fullWidth />
                        </Stack>
                    </Grid>

                    {[{ label: 'Division', name: 'division_id', data: divisions }, { label: 'Parliament', name: 'parliament_id', data: parliaments }, { label: 'Assembly', name: 'assembly_id', data: assemblies }, { label: 'Block', name: 'block_id', data: blocks }, { label: 'Booth', name: 'booth_id', data: booths }].map(({ label, name, data }) => (
                        <Grid item xs={12} sm={6} key={name}>
                            <Stack spacing={1}>
                                <InputLabel>{label}</InputLabel>
                                <FormControl fullWidth>
                                    <Select name={name} value={formData[name]} onChange={handleChange}>
                                        {data.map((d) => (
                                            <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>{visit ? 'Update' : 'Submit'}</Button>
            </DialogActions>
        </Dialog>
    );
}
