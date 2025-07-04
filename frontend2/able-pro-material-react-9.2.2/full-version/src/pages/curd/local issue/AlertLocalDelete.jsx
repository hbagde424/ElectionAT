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
import { Trash } from 'iconsax-react';

export default function AlertLocalIssueDelete({ id, open, handleClose, refresh }) {
    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('serviceToken');

            const res = await fetch(`http://localhost:5000/api/local-issues/${id}`, {
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
                alert('Failed to delete local issue. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting local issue:', error);
            alert('Network error. Please check your connection and try again.');
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ color: 'error.main' }}>
                        <Trash size={24} />
                    </Box>
                    <Typography variant="h6">Delete Local Issue</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete this local issue? This action cannot be undone.
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