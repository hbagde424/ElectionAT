import { Stack, Typography, Divider, Chip, Avatar, Grid, Box, Paper } from '@mui/material';
import { User, CalendarTick, MessageText1, Award, Buildings2, Location } from 'iconsax-react';

export default function BoothSurveyView({ data }) {
    if (!data) return null;

    const statusColors = {
        'Pending': 'default',
        'In Progress': 'info',
        'Completed': 'primary',
        'Verified': 'success',
        'Rejected': 'error'
    };

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
            month: 'long',
            day: 'numeric'
        });
    };

    // Create hierarchy breadcrumb
    const hierarchy = [
        { label: 'State', data: data.state_id, color: 'secondary' },
        { label: 'Division', data: data.division_id, color: 'info' },
        { label: 'Parliament', data: data.parliament_id, color: 'warning' },
        { label: 'Assembly', data: data.assembly_id, color: 'success' },
        { label: 'Block', data: data.block_id, color: 'error' },
        { label: 'Booth', data: data.booth_id, color: 'primary' }
    ].filter(item => item.data);

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                    <Buildings2 size={32} />
                </Avatar>
                <Box>
                    <Typography variant="h6">Booth Survey - {data._id?.slice(-8)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {data.booth_id?.name || 'No Booth'} • {data.state_id?.name || 'No State'}
                    </Typography>
                </Box>
                <Chip
                    label={data.status || 'Unknown'}
                    color={statusColors[data.status] || 'default'}
                    size="small"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Hierarchy Breadcrumb */}
            {hierarchy.length > 0 && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Location size={16} />
                        <Typography variant="subtitle2" color="text.secondary">Administrative Hierarchy</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        {hierarchy.map((item, index) => (
                            <Stack key={item.label} direction="row" alignItems="center" spacing={0.5}>
                                <Chip
                                    label={`${item.label}: ${item.data.name}`}
                                    color={item.color}
                                    size="small"
                                    variant="outlined"
                                />
                                {index < hierarchy.length - 1 && (
                                    <Typography variant="caption" color="text.secondary">→</Typography>
                                )}
                            </Stack>
                        ))}
                    </Stack>
                </Paper>
            )}

            <Grid container spacing={3}>
                {/* Left Column - Survey Information */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">Survey Information</Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth</Typography>
                                {data.booth_id ? (
                                    <Box>
                                        <Typography variant="body1" fontWeight="medium">{data.booth_id.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">Booth: {data.booth_id.booth_number}</Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="caption">No booth assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Surveyor</Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Avatar sx={{ width: 24, height: 24 }}>
                                        <User size={16} />
                                    </Avatar>
                                    <Typography variant="body2">{data.survey_done_by?.email || 'Unknown'}</Typography>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Survey Date</Typography>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <CalendarTick size={16} />
                                    <Typography variant="body2">{formatDate(data.survey_date)}</Typography>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                                <Chip
                                    label={data.status || 'Unknown'}
                                    color={statusColors[data.status] || 'default'}
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                    </Stack>
                </Grid>

                {/* Right Column - Administrative Information */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">Administrative Information</Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
                                {data.state_id ? (
                                    <Chip label={data.state_id.name} color="secondary" size="small" />
                                ) : (
                                    <Typography variant="caption">No state assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division</Typography>
                                {data.division_id ? (
                                    <Chip label={data.division_id.name} color="info" size="small" />
                                ) : (
                                    <Typography variant="caption">No division assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
                                {data.parliament_id ? (
                                    <Chip label={data.parliament_id.name} color="warning" size="small" />
                                ) : (
                                    <Typography variant="caption">No parliament assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
                                {data.assembly_id ? (
                                    <Chip label={data.assembly_id.name} color="success" size="small" />
                                ) : (
                                    <Typography variant="caption">No assembly assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Block</Typography>
                                {data.block_id ? (
                                    <Chip label={data.block_id.name} color="error" size="small" />
                                ) : (
                                    <Typography variant="caption">No block assigned</Typography>
                                )}
                            </Grid>
                        </Grid>
                    </Stack>
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Survey Results Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">Survey Results</Typography>

                        {data.poll_result ? (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Poll Result</Typography>
                                <Typography variant="body1" sx={{
                                    p: 2,
                                    bgcolor: 'info.50',
                                    borderRadius: 1,
                                    minHeight: 60,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {data.poll_result}
                                </Typography>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">No poll results available</Typography>
                        )}
                    </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">Remarks</Typography>

                        {data.remark ? (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Survey Remarks</Typography>
                                <Typography variant="body1" sx={{
                                    p: 2,
                                    bgcolor: 'grey.50',
                                    borderRadius: 1,
                                    minHeight: 60,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {data.remark}
                                </Typography>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">No remarks available</Typography>
                        )}
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