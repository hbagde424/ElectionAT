import { Dialog, DialogTitle, DialogActions, Button, DialogContent, Typography, Stack, Chip } from '@mui/material';
import { Warning2 } from 'iconsax-react';

export default function AlertCasteDelete({ id, open, handleClose, refresh }) {
    const handleDelete = async () => {
        const token = localStorage.getItem('serviceToken');
        const res = await fetch(`http://localhost:5000/api/caste-lists/${id}`, {
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
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Warning2 size="24" color="#f44336" />
                    <Typography variant="h6">Delete Caste Entry</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography>
                        Are you sure you want to delete this caste entry? This action cannot be undone.
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Chip label="Warning" color="error" size="small" />
                        <Typography variant="body2" color="text.secondary">
                            This caste information will be permanently removed from the system.
                        </Typography>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} variant="outlined">
                    Cancel
                </Button>
                <Button color="error" variant="contained" onClick={handleDelete}>
                    Delete Entry
                </Button>
            </DialogActions>
        </Dialog>
    );
}