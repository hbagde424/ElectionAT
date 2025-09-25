import { useState, useEffect } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

// project-imports
import MainCard from 'components/MainCard';
import { useGetProfile, updateProfile } from 'api/profile';
import { openSnackbar } from 'api/snackbar';

// styles & constant
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = { PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP } } };

// ==============================|| ACCOUNT PROFILE - MY ACCOUNT ||============================== //

export default function TabAccount() {
  const { profile, isLoading, error } = useGetProfile();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        mobile: profile.mobile || ''
      });
    }
  }, [profile]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await updateProfile(formData);
      openSnackbar({
        open: true,
        message: 'Profile updated successfully',
        variant: 'alert',
        alert: { color: 'success' }
      });
    } catch (error) {
      openSnackbar({
        open: true,
        message: error.message || 'Failed to update profile',
        variant: 'alert',
        alert: { color: 'error' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Grid container spacing={3} justifyContent="center" alignItems="center" sx={{ minHeight: 400 }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (error) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="error">
            Failed to load profile data. Please try again later.
          </Alert>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <MainCard title="General Settings">
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <InputLabel htmlFor="my-account-username">Username</InputLabel>
                <TextField
                  fullWidth
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  id="my-account-username"
                  placeholder="Username"
                  autoFocus
                />
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <InputLabel htmlFor="my-account-email">Account Email</InputLabel>
                <TextField
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  id="my-account-email"
                  placeholder="Account Email"
                  type="email"
                />
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <InputLabel htmlFor="my-account-mobile">Mobile Number</InputLabel>
                <TextField
                  fullWidth
                  value={formData.mobile}
                  onChange={handleInputChange('mobile')}
                  id="my-account-mobile"
                  placeholder="Mobile Number"
                />
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <InputLabel htmlFor="my-account-role">Role</InputLabel>
                <TextField
                  fullWidth
                  value={profile?.role || ''}
                  id="my-account-role"
                  placeholder="Role"
                  disabled
                />
              </Stack>
            </Grid>
          </Grid>
        </MainCard>
      </Grid>

      <Grid item xs={12}>
        <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setFormData({
                username: profile?.username || '',
                email: profile?.email || '',
                mobile: profile?.mobile || ''
              });
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Profile'}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
}

