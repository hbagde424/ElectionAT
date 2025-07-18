import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, People, User } from 'iconsax-react';

export default function BoothVolunteerView({ data }) {
  if (!data) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getActivityLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="h6">{data.name || 'Untitled Volunteer'}</Typography>
        <Chip
          label={data.role?.toUpperCase() || 'N/A'}
          size="small"
          variant="outlined"
        />
        <Chip
          label={data.activity_level?.toUpperCase() || 'N/A'}
          color={getActivityLevelColor(data.activity_level)}
          size="small"
        />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
          <Stack spacing={2}>
            <Typography variant="h6" color="primary">Personal Information</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Name</Typography>
                <Typography variant="body1" fontWeight="medium">{data.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Phone</Typography>
                <Typography variant="body1">{data.phone || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Email</Typography>
                <Typography variant="body1">{data.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Role</Typography>
                <Chip label={data.role || 'N/A'} size="small" variant="outlined" />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Activity Level</Typography>
                <Chip
                  label={data.activity_level || 'N/A'}
                  color={getActivityLevelColor(data.activity_level)}
                  size="small"
                />
              </Grid>
            </Grid>

            {data.area_responsibility && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Area Responsibility</Typography>
                <Typography variant="body1">{data.area_responsibility}</Typography>
              </Box>
            )}

            {data.remarks && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Remarks</Typography>
                <Typography variant="body1">{data.remarks}</Typography>
              </Box>
            )}
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Party</Typography>
              {data.party ? (
                <Chip label={data.party.name} color="primary" size="small" />
              ) : (
                <Typography variant="caption">No party assigned</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
              {data.state ? (
                <Chip label={data.state.name} color="primary" size="small" />
              ) : (
                <Typography variant="caption">No state assigned</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division</Typography>
              {data.division ? (
                <Chip label={data.division.name} color="warning" size="small" />
              ) : (
                <Typography variant="caption">No division assigned</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
              {data.parliament ? (
                <Chip label={data.parliament.name} color="secondary" size="small" />
              ) : (
                <Typography variant="caption">No parliament assigned</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
              {data.assembly ? (
                <Chip label={data.assembly.name} color="info" size="small" />
              ) : (
                <Typography variant="caption">No assembly assigned</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Block</Typography>
              {data.block ? (
                <Chip label={data.block.name} color="primary" size="small" />
              ) : (
                <Typography variant="caption">No block assigned</Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth</Typography>
              {data.booth ? (
                <Typography variant="body1">{data.booth.name} (No: {data.booth.booth_number})</Typography>
              ) : (
                <Typography variant="caption">No booth assigned</Typography>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Metadata Section */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <User size={16} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
              <Typography variant="body2">{data.created_by?.username || 'Unknown'}</Typography>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <User size={16} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
              <Typography variant="body2">{data.updated_by?.username || 'N/A'}</Typography>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarTick size={16} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
              <Typography variant="body2">{formatDateTime(data.created_at)}</Typography>
            </Box>
          </Stack>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CalendarTick size={16} />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
              <Typography variant="body2">{formatDateTime(data.updated_at)}</Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}