import { Dialog, DialogTitle, DialogActions, Button, DialogContent, Typography, Stack, Chip } from '@mui/material';
import { Warning2 } from 'iconsax-react';

export default function AlertInfluancerDelete({ id, open, handleClose, refresh }) {
    const handleDelete = async () => {
        const token = localStorage.getItem('serviceToken');
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/influencers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            const json = await res.json().catch(() => null);
            if (res.ok) {
                if (!json || json.success === undefined || json.success === true) {
                    handleClose();
                    refresh();
                    return;
                }
            }

            const msg = (json && (json.message || json.error)) || res.statusText || 'Failed to delete influencer';
            console.error('Failed to delete influencer:', res.status, msg);
            alert(msg);
        } catch (err) {
            console.error('Error deleting influencer:', err);
            alert('An error occurred while deleting the influencer');
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Warning2 size="24" color="#f44336" />
                    <Typography variant="h6">Delete Influencer</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography>
                        Are you sure you want to delete this influencer? This action cannot be undone.
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Chip label="Warning" color="error" size="small" />
                        <Typography variant="body2" color="text.secondary">
                            All influencer information will be permanently removed from the system.
                        </Typography>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} variant="outlined">
                    Cancel
                </Button>
                <Button color="error" variant="contained" onClick={handleDelete}>
                    Delete Influencer
                </Button>
            </DialogActions>
        </Dialog>
    );
}
