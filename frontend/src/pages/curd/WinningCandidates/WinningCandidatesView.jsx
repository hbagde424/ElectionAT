import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User, Profile, People } from 'iconsax-react';

export default function WinningCandidateView({ data }) {
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
                <Typography variant="h6">Winning Candidate Details</Typography>
                <Chip
                    label={`Votes: ${data.total_votes}`}
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
                                    Candidate
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.candidate_id?.name || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <People size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Winning Party
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.party_id?.name || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Profile size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Total Electors
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.total_electors || '0'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Profile size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Total Votes
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.total_votes || '0'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Profile size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Poll Percentage
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.poll_percentage || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Profile size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Election Type
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {Array.isArray(data.type) ? data.type.join(', ') : (data.type || 'N/A')}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Profile size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Voting Percentage
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.voting_percentage || '0'}%
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Profile size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Margin
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.margin || '0'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Profile size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Margin Percentage
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.margin_percentage || '0'}%
                            </Typography>
                        </Box>

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
                         {/* Description Field (HTML) */}
            {data.description && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                    <Box
                        sx={{
                            border: '1px solid #eee',
                            borderRadius: 1,
                            p: 1,
                            bgcolor: 'background.default',
                            maxHeight: 180,
                            overflow: 'auto',
                        }}
                        dangerouslySetInnerHTML={{ __html: data.description }}
                    />
                </Box>
            )}
                    </Stack>
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

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
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                        <Typography>{formatDate(data.created_at)}</Typography>
                    </Stack>
                </Grid>
                {data.updated_at && (
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="text.secondary">Last Updated</Typography>
                            <Typography>{formatDate(data.updated_at)}</Typography>
                        </Stack>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}
