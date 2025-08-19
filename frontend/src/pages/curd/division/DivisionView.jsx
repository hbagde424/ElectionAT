import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User } from 'iconsax-react';

export default function DivisionView({ data }) {
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

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="h6">{data.name || 'Untitled Division'}</Typography>
                <Chip
                    label={data.division_code || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            </Stack>

            {data.description && (
                <Box sx={{ mb: 2 }}>
                    <Divider sx={{ mb: 1 }} />
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                    <Box sx={{ bgcolor: '#f9f9f9', borderRadius: 1, p: 2 }}>
                        <div dangerouslySetInnerHTML={{ __html: data.description }} />
                    </Box>
                </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column */}
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
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <CalendarTick size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Updated At
                                </Typography>
                            </Stack>
                            <Typography variant="body2" fontWeight="medium">
                                {formatDate(data.updated_at)}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>
                {/* Right Column */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
                            <Chip label={data.state_id?.name || 'N/A'} color="primary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division Code</Typography>
                            <Chip label={data.division_code || 'N/A'} color="warning" size="small" />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}
