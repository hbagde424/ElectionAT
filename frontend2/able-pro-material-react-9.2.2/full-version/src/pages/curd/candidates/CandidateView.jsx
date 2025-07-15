import { Stack, Typography, Divider, Grid, Box, Chip, Avatar } from '@mui/material';
import { CalendarTick, People, User, Award } from 'iconsax-react';

export default function CandidateView({ data }) {
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

    const formatCurrency = (amount) => {
        if (!amount) return 'N/A';
        return `₹${amount.toLocaleString()}`;
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Avatar src={data.photo} alt={data.name} sx={{ width: 64, height: 64 }}>
                    <User size={32} />
                </Avatar>
                <Box>
                    <Typography variant="h6">{data.name || 'Untitled Candidate'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {data.party_id?.name || 'No Party'} • {data.assembly_id?.name || 'No Assembly'}
                    </Typography>
                </Box>
                <Chip
                    label={data.is_active ? 'Active' : 'Inactive'}
                    color={data.is_active ? 'success' : 'error'}
                    size="small"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column - Personal Information */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">Personal Information</Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Name</Typography>
                                <Typography variant="body1" fontWeight="medium">{data.name || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Caste</Typography>
                                <Chip label={data.caste || 'N/A'} size="small" variant="outlined" />
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Education</Typography>
                                <Typography variant="body1">{data.education || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Criminal Cases</Typography>
                                <Chip
                                    label={data.criminal_cases || '0'}
                                    color={data.criminal_cases > 0 ? 'error' : 'success'}
                                    size="small"
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assets</Typography>
                                <Typography variant="body1" fontWeight="bold" color="success.main">
                                    {formatCurrency(data.assets)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Liabilities</Typography>
                                <Typography variant="body1" fontWeight="bold" color="error.main">
                                    {formatCurrency(data.liabilities)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Stack>
                </Grid>

                {/* Right Column - Political Information */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Party</Typography>
                            {data.party_id ? (
                                <Chip label={data.party_id.name} color="primary" size="small" />
                            ) : (
                                <Typography variant="caption">No party assigned</Typography>
                            )}
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
                            {data.assembly_id ? (
                                <Chip label={data.assembly_id.name} color="info" size="small" />
                            ) : (
                                <Typography variant="caption">No assembly assigned</Typography>
                            )}
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
                            {data.parliament_id ? (
                                <Chip label={data.parliament_id.name} color="secondary" size="small" />
                            ) : (
                                <Typography variant="caption">No parliament assigned</Typography>
                            )}
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
                            {data.state_id ? (
                                <Chip label={data.state_id.name} color="success" size="small" />
                            ) : (
                                <Typography variant="caption">No state assigned</Typography>
                            )}
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division</Typography>
                            {data.division_id ? (
                                <Chip label={data.division_id.name} color="warning" size="small" />
                            ) : (
                                <Typography variant="caption">No division assigned</Typography>
                            )}
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Election Year</Typography>
                            {data.election_year ? (
                                <Chip
                                    label={`${data.election_year.year}`}
                                    color="warning"
                                    size="small"
                                />
                            ) : (
                                <Typography variant="caption">No election year assigned</Typography>
                            )}
                        </Grid>
                    </Grid>
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
