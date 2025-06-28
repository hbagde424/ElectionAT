import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    InputLabel
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function StateModal({ open, modalToggler, state, refresh }) {
    const [formData, setFormData] = useState({
        name: ''
    });

    useEffect(() => {
        if (state) {
            setFormData({
                name: state.name || ''
            });
        } else {
            setFormData({
                name: ''
            });
        }
    }, [state]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        const method = state ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = state
            ? `http://localhost:5000/api/states/${state._id}`
            : 'http://localhost:5000/api/states';

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
            <DialogTitle>{state ? 'Edit State' : 'Add State'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Stack spacing={1}>
                        <InputLabel>State Name</InputLabel>
                        <TextField 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            fullWidth 
                            required
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {state ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}