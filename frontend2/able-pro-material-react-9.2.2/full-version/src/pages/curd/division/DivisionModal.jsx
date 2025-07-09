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
import { useEffect, useState, useContext } from 'react';

// project imports
import JWTContext from 'contexts/JWTContext';

export default function DivisionModal({ open, modalToggler, division, states, refresh }) {
    // Get logged-in user from context
    const contextValue = useContext(JWTContext);
    const { user, isLoggedIn, isInitialized } = contextValue || {};

    console.log('=== DIVISION JWT CONTEXT DEBUG ===');
    console.log('Full context value:', contextValue);
    console.log('isLoggedIn:', isLoggedIn);
    console.log('isInitialized:', isInitialized);
    console.log('user from context:', user);
    console.log('=== END DIVISION JWT CONTEXT DEBUG ===');

    // Debug logging to check user context and localStorage
    console.log('=== DIVISION USER DEBUG INFO ===');
    console.log('JWTContext user:', user);
    console.log('User ID:', user?._id);
    console.log('User object keys:', user ? Object.keys(user) : 'No user');
    console.log('localStorage serviceToken:', localStorage.getItem('serviceToken'));
    console.log('localStorage user:', localStorage.getItem('user'));

    // Try to parse localStorage user
    try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Parsed localStorage user:', localUser);
    } catch (e) {
        console.log('Failed to parse localStorage user:', e);
    }
    console.log('=== END DIVISION DEBUG INFO ===');
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

        // Debug user information
        console.log('Division HandleSubmit - User context:', user);
        console.log('Division HandleSubmit - User ID check:', user?._id);
        console.log('Division HandleSubmit - User ID (alternative):', user?.id);

        // Try to get user ID from different possible fields or fallback to localStorage
        let userId = user?._id || user?.id;

        // Fallback: try to get user from localStorage if context fails
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
                console.log('Division Fallback - localStorage user:', localUser);
                console.log('Division Fallback - userId:', userId);
            } catch (e) {
                console.error('Division Failed to parse localStorage user:', e);
            }
        }

        // Validate that user is logged in
        if (!userId) {
            console.error('Division User validation failed:', { contextUser: user, userId });

            // TEMPORARY BYPASS FOR TESTING - Remove this after fixing user context
            const tempUserId = "507f1f77bcf86cd799439022"; // Replace with a valid user ID from your database
            console.warn('DIVISION USING TEMPORARY USER ID FOR TESTING:', tempUserId);
            userId = tempUserId;

            // Uncomment the lines below to re-enable validation after fixing user context
            // alert(`User not logged in. Please login again. Debug: contextUser=${!!user}, userId=${userId}`);
            // return;
        }

        // Create payload with user tracking
        const payload = {
            ...formData,
            ...(division ? { updated_by: userId } : { created_by: userId })
        };

        console.log('Division - User ID being used:', userId);
        console.log('Division payload:', payload);

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