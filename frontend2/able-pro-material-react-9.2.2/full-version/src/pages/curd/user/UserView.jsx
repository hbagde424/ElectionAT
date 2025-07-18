import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, People, User } from 'iconsax-react';

export default function UserView({ data }) {
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

  const formatArray = (items) => {
    if (!items || items.length === 0) return 'None';
    return items.map(item => item.name).join(', ');
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'superadmin':
        return 'error';
      case 'admin':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="h6">{data.username || 'Untitled User'}</Typography>
        <Chip
          label={data.role?.toUpperCase() || 'N/A'}
          color={getRoleColor(data.role)}
          size="small"
        />
        <Chip
          label={data.isActive ? 'ACTIVE' : 'INACTIVE'}
          color={data.isActive ? 'success' : 'error'}
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
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Username</Typography>
                <Typography variant="body1" fontWeight="medium">{data.username || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Mobile</Typography>
                <Typography variant="body1">{data.mobile || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Email</Typography>
                <Typography variant="body1">{data.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Role</Typography>
                <Chip
                  label={data.role || 'N/A'}
                  color={getRoleColor(data.role)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                <Chip
                  label={data.isActive ? 'Active' : 'Inactive'}
                  color={data.isActive ? 'success' : 'error'}
                  size="small"
                />
              </Grid>
            </Grid>
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
          <Stack spacing={2}>
            <Typography variant="h6" color="primary">Assigned Areas</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>States</Typography>
                {data.state_ids && data.state_ids.length > 0 ? (
                  <Box>
                    {data.state_ids.map((state, index) => (
                      <Chip
                        key={state._id}
                        label={state.name}
                        color="primary"
                        size="small"
                        sx={{ mb: 0.5, mr: 0.5 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption">No states assigned</Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Divisions</Typography>
                {data.division_ids && data.division_ids.length > 0 ? (
                  <Box>
                    {data.division_ids.map((division, index) => (
                      <Chip
                        key={division._id}
                        label={division.name}
                        color="warning"
                        size="small"
                        sx={{ mb: 0.5, mr: 0.5 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption">No divisions assigned</Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliaments</Typography>
                {data.parliament_ids && data.parliament_ids.length > 0 ? (
                  <Box>
                    {data.parliament_ids.map((parliament, index) => (
                      <Chip
                        key={parliament._id}
                        label={parliament.name}
                        color="secondary"
                        size="small"
                        sx={{ mb: 0.5, mr: 0.5 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption">No parliaments assigned</Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assemblies</Typography>
                {data.assembly_ids && data.assembly_ids.length > 0 ? (
                  <Box>
                    {data.assembly_ids.map((assembly, index) => (
                      <Chip
                        key={assembly._id}
                        label={assembly.name}
                        color="info"
                        size="small"
                        sx={{ mb: 0.5, mr: 0.5 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption">No assemblies assigned</Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Blocks</Typography>
                {data.block_ids && data.block_ids.length > 0 ? (
                  <Box>
                    {data.block_ids.map((block, index) => (
                      <Chip
                        key={block._id}
                        label={block.name}
                        color="primary"
                        size="small"
                        sx={{ mb: 0.5, mr: 0.5 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption">No blocks assigned</Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booths</Typography>
                {data.booth_ids && data.booth_ids.length > 0 ? (
                  <Box>
                    {data.booth_ids.map((booth, index) => (
                      <Chip
                        key={booth._id}
                        label={`${booth.name} (${booth.booth_number})`}
                        color="success"
                        size="small"
                        sx={{ mb: 0.5, mr: 0.5 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption">No booths assigned</Typography>
                )}
              </Grid>
            </Grid>
          </Stack>
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