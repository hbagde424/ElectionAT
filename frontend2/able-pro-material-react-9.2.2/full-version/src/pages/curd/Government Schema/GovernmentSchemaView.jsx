import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User, Location, Money, DocumentText1 } from 'iconsax-react';

export default function GovernmentView({ data }) {
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

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="h6">{data.name || 'Untitled Government Project'}</Typography>
                <Chip
                    label={data.type === 'new' ? 'New Project' : 'Old Project'}
                    size="small"
                    color={data.type === 'new' ? 'success' : 'warning'}
                    variant="outlined"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <DocumentText1 size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Project Type
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.type === 'new' ? 'New Project' : 'Existing Project'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Money size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Project Amount
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {formatCurrency(data.amount)}
                            </Typography>
                        </Box>

                        {data.project_complete_date && (
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                    <CalendarTick size="16" />
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Project Completion Date
                                    </Typography>
                                </Stack>
                                <Typography variant="body1" fontWeight="medium">
                                    {formatDate(data.project_complete_date)}
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
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division</Typography>
                            <Chip label={data.division_id?.name || 'N/A'} color="warning" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
                            <Chip label={data.parliament_id?.name || 'N/A'} color="secondary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
                            <Chip label={data.assembly_id?.name || 'N/A'} color="info" size="small" />
                        </Grid>
                        {/* <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Block</Typography>
                            <Chip label={data.block_id?.name || 'N/A'} color="default" size="small" />
                        </Grid>
                        {data.booth_id && (
                            <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth</Typography>
                                <Chip label={data.booth_id?.name || 'N/A'} color="success" size="small" />
                            </Grid>
                        )} */}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}