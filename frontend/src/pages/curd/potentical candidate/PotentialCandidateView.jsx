import { Stack, Typography, Divider, Chip, Box, Avatar, Grid } from '@mui/material';
import { CalendarTick, People, User, Award } from 'iconsax-react';

export default function PotentialCandidateView({ data }) {
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
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Avatar src={data.image} alt={data.name} sx={{ width: 64, height: 64 }}>
                    <User size={32} />
                </Avatar>
                <Box>
                    <Typography variant="h6">{data.name || 'Untitled Candidate'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {data.party_id?.name || 'No Party'} • {data.constituency_id?.name || 'No Constituency'}
                    </Typography>
                </Box>
                <Chip
                    label={data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1).replace('_', ' ') : 'Unknown'}
                    color={data.status === 'active' ? 'success' : data.status === 'inactive' ? 'error' : 'warning'}
                    size="small"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column - Basic Information */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">Basic Information</Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Name</Typography>
                                <Typography variant="body1" fontWeight="medium">{data.name || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Party</Typography>
                                {data.party_id ? (
                                    <Chip label={data.party_id.name} color="primary" size="small" />
                                ) : (
                                    <Typography variant="caption">No party assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Constituency</Typography>
                                {data.constituency_id ? (
                                    <Chip label={data.constituency_id.name} color="secondary" size="small" />
                                ) : (
                                    <Typography variant="caption">No constituency assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Election Year</Typography>
                                {data.election_year_id ? (
                                    <Chip label={data.election_year_id.year} color="info" size="small" />
                                ) : (
                                    <Typography variant="caption">No election year assigned</Typography>
                                )}
                            </Grid>
                        </Grid>
                    </Stack>
                </Grid>

                {/* Right Column - Post Details */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">Post Details</Typography>

                        {data.post_details ? (
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Post Name</Typography>
                                    <Typography variant="body1" fontWeight="medium">{data.post_details.postname || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Place</Typography>
                                    <Typography variant="body1">{data.post_details.place || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>From Date</Typography>
                                    <Typography variant="body1">{formatDate(data.post_details.from_date)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>To Date</Typography>
                                    <Typography variant="body1">{formatDate(data.post_details.to_date)}</Typography>
                                </Grid>
                            </Grid>
                        ) : (
                            <Typography variant="body2" color="text.secondary">No post details available</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Analysis Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">Political Analysis</Typography>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Political History</Typography>
                            <Typography variant="body1" sx={{
                                p: 2,
                                bgcolor: 'grey.50',
                                borderRadius: 1,
                                minHeight: 60,
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                {data.history || 'No political history available'}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">Pros & Cons</Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Pros</Typography>
                                <Typography variant="body1" sx={{
                                    p: 2,
                                    bgcolor: 'success.50',
                                    borderRadius: 1,
                                    minHeight: 60,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {data.pros || 'No pros listed'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Cons</Typography>
                                <Typography variant="body1" sx={{
                                    p: 2,
                                    bgcolor: 'error.50',
                                    borderRadius: 1,
                                    minHeight: 60,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {data.cons || 'No cons listed'}
                                </Typography>
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
                <Grid item xs={12} sm={6} md={3}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Award size={16} />
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                            <Chip
                                label={data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1).replace('_', ' ') : 'Unknown'}
                                color={data.status === 'active' ? 'success' : data.status === 'inactive' ? 'error' : 'warning'}
                                size="small"
                            />
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}