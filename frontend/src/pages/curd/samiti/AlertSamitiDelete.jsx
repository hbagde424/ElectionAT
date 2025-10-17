import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Alert,
    Box,
    Stack
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Trash } from 'iconsax-react';

// Project imports
import axiosServices from 'utils/axios';

const AlertSamitiDelete = ({ open, handleClose, id, refresh }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!id) return;

        setLoading(true);
        setError('');

        try {
            const response = await axiosServices.delete(`/samitis/${id}`);
            
            if (response.data.success) {
                handleClose();
                refresh();
            } else {
                setError(response.data.message || 'Failed to delete samiti');
            }
        } catch (err) {
            console.error('Error deleting samiti:', err);
            setError(
                err.response?.data?.message ||
                err.message ||
                'An unexpected error occurred while deleting the samiti'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setError('');
        handleClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleCancel}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Trash size={24} color="red" />
                    <Typography variant="h5" color="error">
                        Delete Samiti
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ py: 1 }}>
                    <Typography variant="body1" gutterBottom>
                        Are you sure you want to delete this samiti?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This action cannot be undone. The samiti record will be permanently removed 
                        from the system along with all its associated data.
                    </Typography>
                </Box>

                <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>Warning:</strong> Deleting this samiti may affect related data 
                        and reports. Please ensure this action is necessary.
                    </Typography>
                </Alert>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button 
                    onClick={handleCancel}
                    variant="outlined"
                    disabled={loading}
                >
                    Cancel
                </Button>
                <LoadingButton
                    onClick={handleDelete}
                    variant="contained"
                    color="error"
                    loading={loading}
                    startIcon={<Trash />}
                >
                    {loading ? 'Deleting...' : 'Delete Samiti'}
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export default AlertSamitiDelete;