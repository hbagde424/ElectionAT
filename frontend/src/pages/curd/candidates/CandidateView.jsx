import { Stack, Typography, Divider, Grid, Box, Chip, Avatar } from '@mui/material';
import { CalendarTick, User } from 'iconsax-react';

export default function CandidateView({ data }) {
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
                <Avatar src={data.photo || '/default-avatar.png'} sx={{ width: 60, height: 60 }} />
                <Typography variant="h6">{data.name || 'N/A'}</Typography>
                <Chip
                    label={data.is_active ? 'Active' : 'Inactive'}
                    color={data.is_active ? 'success' : 'error'}
                    size="small"
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
                                <CalendarTick size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Created At
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {formatDate(data.created_at)}
                            </Typography>
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

                {/* Right Column */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Party</Typography>
                            <Chip label={data.party_id?.name || 'N/A'} color="primary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
                            <Chip label={data.state_id?.name || 'N/A'} color="secondary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
                            <Chip label={data.assembly_id?.name || 'N/A'} color="info" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
                            <Chip label={data.parliament_id?.name || 'N/A'} color="warning" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Caste</Typography>
                            <Chip label={data.caste || 'N/A'} size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Criminal Cases</Typography>
                            <Chip 
                                label={data.criminal_cases || 0} 
                                color={data.criminal_cases > 0 ? 'error' : 'success'} 
                                size="small" 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Election Year</Typography>
                            <Typography>{data.election_year?.year || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Education</Typography>
                            <Typography>{data.education || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assets</Typography>
                            <Typography>{data.assets || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Liabilities</Typography>
                            <Typography>{data.liabilities || 'N/A'}</Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}
