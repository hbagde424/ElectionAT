import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User, Profile, People } from 'iconsax-react';

export default function GenderView({ data }) {
    if (!data) return null;

    const formatDate = (dateString) => {
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

    const totalCount = data.male + data.female + data.others;

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="h6">Gender Distribution</Typography>
                <Chip
                    label={`Total: ${totalCount}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <People size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Male Count
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.male || '0'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <People size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Female Count
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.female || '0'}
                            </Typography>
                        </Box>

                         <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <People size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    others Count
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.others || '0'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Profile size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Male Percentage
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {totalCount > 0 ? ((data.male / totalCount) * 100).toFixed(2) + '%' : '0%'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Profile size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Others Percentage
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {totalCount > 0 ? ((data.others / totalCount) * 100).toFixed(2) + '%' : '0%'}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <User size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Created By
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.created_by?.username || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <User size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Updated By
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.updated_by?.username || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <CalendarTick size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Created At
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {formatDate(data.created_at)}
                            </Typography>
                        </Box>

                        {data.updated_at && (
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                    <CalendarTick size="16" />
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Last Updated
                                    </Typography>
                                </Stack>
                                <Typography variant="body1" fontWeight="medium">
                                    {formatDate(data.updated_at)}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
                    <Chip label={data.state?.name || 'N/A'} color="primary" size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division</Typography>
                    <Chip label={data.division?.name || 'N/A'} color="warning" size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
                    <Chip label={data.parliament?.name || 'N/A'} color="secondary" size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
                    <Chip label={data.assembly?.name || 'N/A'} color="info" size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Block</Typography>
                    <Chip label={data.block?.name || 'N/A'} color="success" size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth</Typography>
                    <Chip label={data.booth?.name || 'N/A'} color="error" size="small" />
                </Grid>
            </Grid>
        </Box>
    );
}