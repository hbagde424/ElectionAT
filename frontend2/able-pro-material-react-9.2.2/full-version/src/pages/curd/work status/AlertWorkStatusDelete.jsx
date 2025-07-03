import {
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Button,
    Typography,
    Stack,
    Box
} from '@mui/material';
import { Warning } from 'iconsax-react';

export default function AlertWorkStatusDelete({ id, open, handleClose, refresh }) {
    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('serviceToken');

            const res = await fetch(`http://localhost:5000/api/work-statuses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                handleClose();
                refresh();
            } else {
                const data = await res.json();
                console.error('Delete failed:', data);
            }
        } catch (error) {
            console.error('Error deleting work status:', error);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ color: 'warning.main' }}>
                        <Warning size={24} />
                    </Box>
                    <Typography variant="h6">Confirm Delete</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete this work status? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} variant="outlined">
                    Cancel
                </Button>
                <Button color="error" variant="contained" onClick={handleDelete}>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}