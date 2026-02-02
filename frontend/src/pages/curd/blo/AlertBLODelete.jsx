import { useRef } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography
} from '@mui/material';

// project import
import { PopupTransition } from 'components/@extended/Transitions';

// assets
import { Trash } from 'iconsax-react';
import axiosServices from 'utils/axios';

// ==============================|| BLO - DELETE ||============================== //

export default function AlertBLODelete({ id, title, open, handleClose, refresh }) {
  const theme = useTheme();
  const deleteId = useRef(null);

  const deleteBLO = async () => {
    try {
      await axiosServices.delete(`/blos/${id}`);
      handleClose();
      refresh();
    } catch (error) {
      console.error('Error deleting BLO:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      keepMounted
      TransitionComponent={PopupTransition}
      maxWidth="xs"
      aria-labelledby="item-delete-title"
      aria-describedby="item-delete-description"
    >
      <DialogTitle id="item-delete-title">Delete BLO Officer</DialogTitle>
      <DialogContent>
        <DialogContentText id="item-delete-description">
          <Typography variant="h6" component="span">
            Are you sure you want to delete{' '}
            <Typography variant="subtitle1" component="span" color="primary">
              {title}
            </Typography>
            ?
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="contained" size="small" onClick={deleteBLO} autoFocus>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}