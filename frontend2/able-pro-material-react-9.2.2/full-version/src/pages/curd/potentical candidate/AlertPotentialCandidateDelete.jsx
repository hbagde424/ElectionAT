import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Button,
    DialogContent,
    DialogContentText,
    Alert,
    CircularProgress,
    Stack
} from '@mui/material';
import { Trash, Warning2 } from 'iconsax-react';

export default function AlertPotentialCandidateDelete({ id, open, handleClose, refresh }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('serviceToken');

            const res = await fetch(`http://localhost:5000/api/potential-candidates/${id}`, {
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
                setError(data.message || 'Failed to delete potential candidate');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            setError('Network error occurred while deleting potential candidate');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDialog = () => {
        if (!loading) {
            setError('');
            handleClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Warning2 size={24} color="#f57c00" />
                    <span>Delete Potential Candidate</span>
                </Stack>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <DialogContentText>
                    Are you sure you want to delete this potential candidate? This action cannot be undone and will permanently remove all associated data.
                </DialogContentText>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 1 }}>
                <Button
                    onClick={handleCloseDialog}
                    disabled={loading}
                    variant="outlined"
                >
                    Cancel
                </Button>
                <Button
                    color="error"
                    variant="contained"
                    onClick={handleDelete}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} /> : <Trash size={16} />}
                >
                    {loading ? 'Deleting...' : 'Delete Candidate'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}