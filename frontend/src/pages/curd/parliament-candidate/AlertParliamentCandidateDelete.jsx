import { 
    Dialog, DialogTitle, DialogActions, Button, DialogContent, 
    Typography, Stack, Chip 
} from '@mui/material';
import { Warning2 } from 'iconsax-react';

export default function AlertParliamentCandidateDelete({ id, open, handleClose, refresh }) {
    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-candidates/${id}`, {
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
                const errorData = await res.json();
                console.error('Failed to delete parliament candidate:', errorData);
                alert(`Failed to delete parliament candidate: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting parliament candidate:', error);
            alert('An error occurred while deleting the parliament candidate.');
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Warning2 size="24" color="#f44336" />
                    <Typography variant="h6">Delete Parliament Candidate</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <Typography>
                        Are you sure you want to delete this Parliament Candidate record? This action cannot be undone.
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Chip label="Warning" color="error" size="small" />
                        <Typography variant="body2" color="text.secondary">
                            This will permanently remove the parliament candidate record and all associated data from the system.
                        </Typography>
                    </Stack>
                    <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>This action will delete:</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                            • Parliament candidate election record
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                            • Voting statistics and results
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                            • Historical election data
                        </Typography>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} variant="outlined">
                    Cancel
                </Button>
                <Button color="error" variant="contained" onClick={handleDelete}>
                    Delete Parliament Candidate
                </Button>
            </DialogActions>
        </Dialog>
    );
}