import { Button, Dialog, DialogContent, Stack, Typography } from '@mui/material';
import Avatar from 'components/@extended/Avatar';
import { Trash } from 'iconsax-react';

export default function AlertParliamentDelete({ id, open, handleClose, refresh }) {
    const deleteHandler = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.ok) {
                handleClose();
                refresh();
            } else {
                const errorData = await res.json();
                console.error('Failed to delete parliament:', errorData);
                alert('Failed to delete parliament. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting parliament:', error);
            alert('An error occurred while deleting the parliament.');
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            keepMounted
            maxWidth="xs"
            aria-labelledby="parliament-delete-title"
            aria-describedby="parliament-delete-description"
        >
            <DialogContent sx={{ mt: 2, my: 1 }}>
                <Stack alignItems="center" spacing={3.5}>
                    <Avatar color="error" sx={{ width: 72, height: 72, fontSize: '1.75rem' }}>
                        <Trash variant="Bold" />
                    </Avatar>
                    <Stack spacing={2}>
                        <Typography variant="h4" align="center">
                            Are you sure you want to delete?
                        </Typography>
                        <Typography align="center">
                            By deleting this parliament, all related data will be permanently removed.
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ width: 1 }}>
                        <Button fullWidth onClick={handleClose} color="secondary" variant="outlined">
                            Cancel
                        </Button>
                        <Button fullWidth color="error" variant="contained" onClick={deleteHandler} autoFocus>
                            Delete
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
