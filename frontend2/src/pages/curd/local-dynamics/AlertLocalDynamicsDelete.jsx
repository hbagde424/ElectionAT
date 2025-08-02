// AlertLocalDynamicsDelete.jsx
import { Dialog, DialogTitle, DialogActions, Button, DialogContent, Typography } from '@mui/material';

export default function AlertLocalDynamicsDelete({ id, open, handleClose, refresh }) {
    const handleDelete = async () => {
        const token = localStorage.getItem('serviceToken');
        const res = await fetch(`http://localhost:5000/api/local-dynamics/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (res.ok) {
            handleClose();
            refresh();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Delete Local Dynamics</DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete this local dynamics record? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button color="error" variant="contained" onClick={handleDelete}>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}
