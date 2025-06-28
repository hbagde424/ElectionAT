import { Dialog, DialogTitle, DialogActions, Button } from '@mui/material';

export default function AlertVolunteerDelete({ id, open, handleClose, refresh }) {
    const handleDelete = async () => {
        const res = await fetch(`http://localhost:5000/api/booth-volunteers/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            handleClose();
            refresh();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Are you sure you want to delete this volunteer?</DialogTitle>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button color="error" variant="contained" onClick={handleDelete}>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
}
