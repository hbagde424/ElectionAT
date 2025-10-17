import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import { useState } from 'react';
import axiosServices from 'utils/axios';

const AlertPanchayatDelete = ({ id, title, open, handleClose, refresh }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const handleConfirmDelete = async () => {
        if (!id) return;

        setIsDeleting(true);
        setDeleteError('');

        try {
            await axiosServices.delete(`/panchayats/${id}`);
            handleClose();
            refresh();
        } catch (error) {
            console.error('Error deleting panchayat:', error);
            setDeleteError(
                error.response?.data?.message || 
                'Failed to delete panchayat. Please try again.'
            );
        }
        setIsDeleting(false);
    };

    const handleCancel = () => {
        if (!isDeleting) {
            setDeleteError('');
            handleClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleCancel}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id="alert-dialog-title">
                <Typography variant="h4" component="div">
                    Delete Panchayat
                </Typography>
            </DialogTitle>
            
            <DialogContent>
                {deleteError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {deleteError}
                    </Alert>
                )}
                
                <DialogContentText id="alert-dialog-description">
                    Are you sure you want to delete the panchayat{' '}
                    <Typography component="span" sx={{ fontWeight: 'bold' }}>
                        "{title}"
                    </Typography>
                    ?
                </DialogContentText>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    This action cannot be undone. All villages associated with this panchayat 
                    must be removed or reassigned before deletion.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button 
                    onClick={handleCancel} 
                    disabled={isDeleting}
                    variant="outlined"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleConfirmDelete} 
                    autoFocus 
                    variant="contained"
                    color="error"
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Deleting...
                        </>
                    ) : (
                        'Delete'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AlertPanchayatDelete;