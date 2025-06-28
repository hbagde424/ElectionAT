import { Dialog, DialogTitle, DialogActions, Button } from '@mui/material';

export default function AlertParliamentDelete({ id, open, handleClose, refresh }) {
    const handleDelete = async () => {
        const token = localStorage.getItem('serviceToken');

        const res = await fetch(`http://localhost:5000/api/parliaments/${id}`, {
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
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Are you sure you want to delete this parliament?</DialogTitle>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button color="error" variant="contained" onClick={handleDelete}>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}