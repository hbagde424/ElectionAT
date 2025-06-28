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
    FormControl
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function DivisionModal({ open, modalToggler, division, states, refresh }) {
    const [formData, setFormData] = useState({
        name: '',
        state_id: ''
    });

    useEffect(() => {
        if (division) {
            setFormData({
                name: division.name || '',
                state_id: division.state_id?._id || ''
            });
        } else {
            setFormData({
                name: '',
                state_id: ''
            });
        }
    }, [division]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        const method = division ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = division
            ? `http://localhost:5000/api/divisions/${division._id}`
            : 'http://localhost:5000/api/divisions';

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
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="sm">
            <DialogTitle>{division ? 'Edit Division' : 'Add Division'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Stack spacing={1}>
                        <InputLabel>Division Name</InputLabel>
                        <TextField 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            fullWidth 
                            required
                        />
                    </Stack>
                    <Stack spacing={1}>
                        <InputLabel>State</InputLabel>
                        <FormControl fullWidth>
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
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {division ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}