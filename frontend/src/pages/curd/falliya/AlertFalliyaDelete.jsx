import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Chip, Stack, Alert, CircularProgress
} from '@mui/material';
import { useState } from 'react';
import axiosServices from 'utils/axios';

export default function AlertFalliyaDelete({ open, modalToggler, falliya, refresh }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const handleDelete = async () => {
        if (!falliya?._id) return;

        setIsDeleting(true);
        setDeleteError('');

        try {
            await axiosServices.delete(`/falliyas/${falliya._id}`);
            modalToggler();
            refresh();
        } catch (error) {
            console.error('Error deleting falliya:', error);
            setDeleteError(error.response?.data?.message || 'Failed to delete falliya');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            modalToggler();
            setDeleteError('');
        }
    };

    if (!falliya) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Typography variant="h4" color="error">
                    Delete Falliya
                </Typography>
            </DialogTitle>
            
            <DialogContent>
                {deleteError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {deleteError}
                    </Alert>
                )}

                <Typography variant="body1" sx={{ mb: 3 }}>
                    Are you sure you want to delete this falliya? This action cannot be undone.
                </Typography>

                <Box sx={{ 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    bgcolor: 'grey.50'
                }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                        Falliya Details:
                    </Typography>
                    
                    <Stack spacing={2}>
                        {/* Falliya Information */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Falliya Name:
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {falliya.falliya_name}
                            </Typography>
                        </Box>

                        {/* Hierarchy Information */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                Hierarchy:
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {falliya.state_id?.name && (
                                    <Chip 
                                        label={`State: ${falliya.state_id.name}`} 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined" 
                                    />
                                )}
                                {falliya.division_id?.name && (
                                    <Chip 
                                        label={`Division: ${falliya.division_id.name}`} 
                                        size="small" 
                                        color="secondary" 
                                        variant="outlined" 
                                    />
                                )}
                                {falliya.parliament_id?.name && (
                                    <Chip 
                                        label={`Parliament: ${falliya.parliament_id.name}`} 
                                        size="small" 
                                        color="info" 
                                        variant="outlined" 
                                    />
                                )}
                                {falliya.assembly_id?.name && (
                                    <Chip 
                                        label={`Assembly: ${falliya.assembly_id.name}`} 
                                        size="small" 
                                        color="warning" 
                                        variant="outlined" 
                                    />
                                )}
                                {falliya.block_id?.name && (
                                    <Chip 
                                        label={`Block: ${falliya.block_id.name}`} 
                                        size="small" 
                                        color="success" 
                                        variant="outlined" 
                                    />
                                )}
                                {falliya.booth_id?.name && (
                                    <Chip 
                                        label={`Booth: ${falliya.booth_id.name}`} 
                                        size="small" 
                                        color="error" 
                                        variant="outlined" 
                                    />
                                )}
                                {falliya.panchayat_id?.panchayat_name && (
                                    <Chip 
                                        label={`Panchayat: ${falliya.panchayat_id.panchayat_name}`} 
                                        size="small" 
                                        color="primary" 
                                        variant="filled" 
                                    />
                                )}
                                {falliya.village_id?.village_name && (
                                    <Chip 
                                        label={`Village: ${falliya.village_id.village_name}`} 
                                        size="small" 
                                        color="secondary" 
                                        variant="filled" 
                                    />
                                )}
                            </Stack>
                        </Box>

                        {/* Location Information */}
                        {falliya.location && (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Location:
                                </Typography>
                                <Typography variant="body1">
                                    {falliya.location}
                                </Typography>
                                {(falliya.latitude && falliya.longitude) && (
                                    <Typography variant="body2" color="text.secondary">
                                        Coordinates: {falliya.latitude}, {falliya.longitude}
                                    </Typography>
                                )}
                            </Box>
                        )}

                        {/* Population Information */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                Population:
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                <Chip 
                                    label={`Male: ${falliya.male_count || 0}`} 
                                    size="small" 
                                    color="info" 
                                />
                                <Chip 
                                    label={`Female: ${falliya.female_count || 0}`} 
                                    size="small" 
                                    color="success" 
                                />
                                <Chip 
                                    label={`Others: ${falliya.others_count || 0}`} 
                                    size="small" 
                                    color="warning" 
                                />
                                <Chip 
                                    label={`Total: ${falliya.total_count || 0}`} 
                                    size="small" 
                                    color="primary" 
                                    variant="filled" 
                                />
                            </Stack>
                        </Box>

                        {/* Metadata */}
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Created:
                            </Typography>
                            <Typography variant="body2">
                                {falliya.created_at ? new Date(falliya.created_at).toLocaleString() : 'Unknown'}
                                {falliya.created_by?.email && ` by ${falliya.created_by.email}`}
                            </Typography>
                            {falliya.updated_at && (
                                <>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                                        Last Updated:
                                    </Typography>
                                    <Typography variant="body2">
                                        {new Date(falliya.updated_at).toLocaleString()}
                                        {falliya.updated_by?.email && ` by ${falliya.updated_by.email}`}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Stack>
                </Box>

                <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>Warning:</strong> Deleting this falliya will permanently remove all associated data. 
                        This action cannot be undone.
                    </Typography>
                </Alert>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button 
                    onClick={handleClose} 
                    disabled={isDeleting}
                    variant="outlined"
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleDelete} 
                    color="error" 
                    variant="contained"
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Deleting...
                        </>
                    ) : (
                        'Delete Falliya'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}