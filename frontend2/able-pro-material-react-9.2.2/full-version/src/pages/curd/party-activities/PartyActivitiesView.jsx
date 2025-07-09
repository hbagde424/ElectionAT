// PartyActivitiesView.jsx
import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, People, Video } from 'iconsax-react';

export default function PartyActivitiesView({ data }) {
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled':
                return 'info';
            case 'ongoing':
                return 'warning';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            case 'postponed':
                return 'secondary';
            default:
                return 'default';
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="h6">{data.title || 'Untitled Activity'}</Typography>
                <Chip
                    label={data.activity_type?.toUpperCase() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
                <Chip
                    label={data.status?.toUpperCase() || 'N/A'}
                    color={getStatusColor(data.status)}
                    size="small"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Description
                            </Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {data.description || 'No description provided'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <CalendarTick size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Activity Date & Time
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {formatDateTime(data.activity_date)}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <People size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Expected/Actual Attendance
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.attendance_count ? data.attendance_count.toLocaleString() : 'Not specified'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Video size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Media Coverage
                                </Typography>
                            </Stack>
                            <Chip
                                label={data.media_coverage ? 'Yes' : 'No'}
                                color={data.media_coverage ? 'success' : 'default'}
                                size="small"
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Location
                            </Typography>
                            <Typography variant="body1">
                                {data.location || 'N/A'}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Party
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {data.party_id?.name || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Division
                            </Typography>
                            <Chip
                                label={data.division_id?.name || 'N/A'}
                                color="warning"
                                size="small"
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Parliament
                            </Typography>
                            <Chip
                                label={data.parliament_id?.name || 'N/A'}
                                color="secondary"
                                size="small"
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Assembly
                            </Typography>
                            <Chip
                                label={data.assembly_id?.name || 'N/A'}
                                color="info"
                                size="small"
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Block
                            </Typography>
                            <Chip
                                label={data.block_id?.name || 'N/A'}
                                color="primary"
                                size="small"
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Booth
                            </Typography>
                            <Chip
                                label={
                                    data.booth_id
                                        ? `${data.booth_id.name} (${data.booth_id.booth_number})`
                                        : 'N/A'
                                }
                                color="success"
                                size="small"
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Created By
                            </Typography>
                            <Typography variant="body1" fontFamily="monospace">
                                {data.created_by?._id || 'N/A'}
                            </Typography>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Created At
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {formatDate(data.created_at)}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Last Updated
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {formatDate(data.updated_at)}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}
