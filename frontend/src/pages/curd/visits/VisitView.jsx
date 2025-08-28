import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User, Location, DocumentText } from 'iconsax-react';

export default function VisitView({ data }) {
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

    const workStatusColor = {
        'announced': 'default',
        'approved': 'info',
        'in progress': 'warning',
        'complete': 'success',
        'N/A': 'default'
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="h6">Visit Details</Typography>
                <Chip
                    label={formatDate(data.date)}
                    color="primary"
                    size="small"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <User size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Candidate
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.candidate_id?.name || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <DocumentText size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Post
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.post || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <CalendarTick size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Work Status
                                </Typography>
                            </Stack>
                            <Chip
                                label={data.work_status?.toUpperCase() || 'N/A'}
                                color={workStatusColor[data.work_status] || 'default'}
                                size="small"
                            />
                        </Box>

                        {data.locationName && (
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                    <Location size="16" />
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Location
                                    </Typography>
                                </Stack>
                                <Typography variant="body1" fontWeight="medium">
                                    {data.locationName}
                                </Typography>
                                {data.latitude && data.longitude && (
                                    <Typography variant="body2" color="text.secondary">
                                        {data.latitude}, {data.longitude}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </Stack>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
                            <Chip label={data.state_id?.name || 'N/A'} color="primary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division</Typography>
                            <Chip label={data.division_id?.name || 'N/A'} color="secondary" size="small" />
                        </Grid>
                        {data.assembly_id && (
                            <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
                                <Chip label={data.assembly_id?.name || 'N/A'} color="info" size="small" />
                            </Grid>
                        )}
                        {data.parliament_id && (
                            <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
                                <Chip label={data.parliament_id?.name || 'N/A'} color="warning" size="small" />
                            </Grid>
                        )}
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Block</Typography>
                            <Chip label={data.block_id?.name || 'N/A'} color="success" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth</Typography>
                            <Chip label={data.booth_id?.name || 'N/A'} size="small" />
                        </Grid>
                    </Grid>
                </Grid>

                {/* Full width fields */}
                 {/* Description Field (HTML) */}
            {data.description && (
                <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                    <Box
                        sx={{
                            border: '1px solid #eee',
                            borderRadius: 1,
                            p: 1,
                            bgcolor: 'background.default',
                            maxHeight: 400,
                            minHeight: 150,
                            overflow: 'auto',
                        }}
                        dangerouslySetInnerHTML={{ __html: data.description }}
                    />
                </Grid>
            )}

                <Grid item xs={12}>
                    {data.remark && (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Remark
                            </Typography>
                            <Box
                                sx={{
                                    border: '1px solid #eee',
                                    borderRadius: 1,
                                    p: 2,
                                    bgcolor: 'background.default',
                                    maxHeight: 300,
                                    overflow: 'auto',
                                    minHeight: 120
                                }}
                            >
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                    {data.remark}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
