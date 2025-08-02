import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User } from 'iconsax-react';

export default function LocalIssueView({ data }) {
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

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low': return 'success';
            case 'Medium': return 'info';
            case 'High': return 'warning';
            case 'Critical': return 'error';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Reported': return 'info';
            case 'In Progress': return 'warning';
            case 'Resolved': return 'success';
            case 'Rejected': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="h6">{data.issue_name || 'Untitled Issue'}</Typography>
                <Chip
                    label={data.status || 'N/A'}
                    color={getStatusColor(data.status)}
                    size="small"
                />
                <Chip
                    label={data.priority || 'N/A'}
                    color={getPriorityColor(data.priority)}
                    size="small"
                    variant="outlined"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Department
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                                {data.department || 'N/A'}
                            </Typography>
                        </Box>

                        {data.description && (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Description
                                </Typography>
                                <Typography variant="body1" paragraph>
                                    {data.description}
                                </Typography>
                            </Box>
                        )}

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
                    </Stack>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Status
                            </Typography>
                            <Chip 
                                label={data.status || 'N/A'} 
                                color={getStatusColor(data.status)}
                                size="small"
                            />
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Priority
                            </Typography>
                            <Chip 
                                label={data.priority || 'N/A'} 
                                color={getPriorityColor(data.priority)}
                                size="small"
                                variant="outlined"
                            />
                        </Box>

                        {data.updated_by && (
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
                        )}

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

                {/* Location Hierarchy */}
                <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
                            <Chip label={data.state_id?.name || 'N/A'} color="primary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division</Typography>
                            <Chip label={data.division_id?.name || 'N/A'} color="warning" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
                            <Chip label={data.parliament_id?.name || 'N/A'} color="secondary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
                            <Chip label={data.assembly_id?.name || 'N/A'} color="info" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Block</Typography>
                            <Chip label={data.block_id?.name || 'N/A'} color="success" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth</Typography>
                            <Chip label={data.booth_id?.name || 'N/A'} color="error" size="small" />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}