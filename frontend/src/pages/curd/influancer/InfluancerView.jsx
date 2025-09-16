import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User, Mobile, Location, MessageText1 } from 'iconsax-react';

export default function InfluencerView({ data }) {
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
                <Typography variant="h6">{data.name || 'Untitled Influencer'}</Typography>
                <Chip
                    label={`Contact: ${data.contact_number || 'N/A'}`}
                    size="small"
                    color="primary"
                />
                {data.email && (
                    <Chip
                        label={`Email: ${data.email}`}
                        size="small"
                        color="info"
                    />
                )}
                {data.status && (
                    <Chip
                        label={data.status}
                        size="small"
                        color={data.status === 'Active' ? 'success' : 'error'}
                        variant={data.status === 'Active' ? 'filled' : 'outlined'}
                    />
                )}
            </Stack>

            {/* Additional Info Chips */}
            <Stack direction="row" alignItems="center" spacing={1} mb={2} flexWrap="wrap">
                {data.category && (
                    <Chip
                        label={`Category: ${data.category}`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                    />
                )}
                {data.caste && (
                    <Chip
                        label={`Caste: ${data.caste}`}
                        size="small"
                        color="info"
                        variant="outlined"
                    />
                )}
                {data.party_id && (
                    <Chip
                        label={`Party: ${data.party_id.name} (${data.party_id.abbreviation})`}
                        size="small"
                        color="warning"
                        variant="outlined"
                    />
                )}
            </Stack>

            <Divider sx={{ mb: 2 }} />

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

            <Grid container spacing={3}>
                {/* Left Column - Contact Info */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Typography variant="subtitle1" gutterBottom>Contact Information</Typography>
                    <Stack spacing={2}>
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Mobile size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Contact Number
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.contact_number || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <MessageText1 size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Alternate Number
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.alternate_number || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <MessageText1 size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Email Address
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.email || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Location size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Full Address
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium" sx={{ wordBreak: 'break-word' }}>
                                {data.full_address || 'N/A'}
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

                        {/* Social Media Links */}
                        {data.social_media_links && data.social_media_links.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Social Media Links
                                </Typography>
                                <Stack spacing={1}>
                                    {data.social_media_links.map((link, index) => (
                                        <Box key={index} sx={{ 
                                            p: 1, 
                                            border: '1px solid #eee', 
                                            borderRadius: 1,
                                            bgcolor: 'background.default'
                                        }}>
                                            <Typography variant="body2" fontWeight="medium">
                                                {link.platform}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                                                {link.link}
                                            </Typography>
                                            {link.followers && (
                                                <Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                                                    Followers: {Number(link.followers).toLocaleString()}
                                                </Typography>
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </Grid>

                {/* Right Column - Location Info */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Typography variant="subtitle1" gutterBottom>Location Information</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
                            <Chip label={data.state_id?.name || 'N/A'} color="primary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division</Typography>
                            <Chip label={data.division_id?.name || 'N/A'} color="warning" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
                            <Chip label={data.parliament_id?.name || 'N/A'} color="secondary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
                            <Chip label={data.assembly_id?.name || 'N/A'} color="info" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Block</Typography>
                            <Chip label={data.block_id?.name || 'N/A'} color="success" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth</Typography>
                            <Chip label={data.booth_id?.name || 'N/A'} color="error" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth Number</Typography>
                            <Chip label={data.booth_id?.booth_number || 'N/A'} color="error" size="small" />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}
