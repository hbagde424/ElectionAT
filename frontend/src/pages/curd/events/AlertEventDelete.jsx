import { Dialog, DialogTitle, DialogActions, Button, DialogContent, Typography, Stack, Chip } from '@mui/material';
import { Warning2 } from 'iconsax-react';

export default function AlertEventDelete({ id, open, handleClose, refresh }) {
    const handleDelete = async () => {
        const token = localStorage.getItem('serviceToken');
        const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/events/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });
        try {
            // Try to parse JSON response
            const json = await res.json().catch(() => null);
            if (res.ok) {
                // If server returned success flag, respect it, otherwise still proceed on 2xx
                if (!json || json.success === undefined || json.success === true) {
                    handleClose();
                    refresh();
                    return;
                }
            }

            // If we reached here, deletion failed — show best available message
            const msg = (json && (json.message || json.error)) || res.statusText || 'Failed to delete event';
            console.error('Failed to delete event:', res.status, msg);
            alert(msg);
        } catch (err) {
            console.error('Error deleting event:', err);
            alert('An error occurred while deleting the event');
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Warning2 size="24" color="#f44336" />
                    <Typography variant="h6">Delete Event</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography>
                        Are you sure you want to delete this event? This action cannot be undone.
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Chip label="Warning" color="error" size="small" />
                        <Typography variant="body2" color="text.secondary">
                            All event information will be permanently removed from the system.
                        </Typography>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} variant="outlined">
                    Cancel
                </Button>
                <Button color="error" variant="contained" onClick={handleDelete}>
                    Delete Event
                </Button>
            </DialogActions>
        </Dialog>
    );
}
