import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User, Mobile, Location, MessageText1 } from 'iconsax-react';

export default function CodingView({ data }) {
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
                <Typography variant="h6">{data.name || 'Untitled Coding Entry'}</Typography>
                <Chip
                    label={`Mobile: ${data.mobile || 'N/A'}`}
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
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Coding Types */}
            {data.coding_types && data.coding_types.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Coding Types</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {data.coding_types.map((type, index) => (
                            <Chip key={index} label={type} size="small" color="primary" />
                        ))}
                    </Stack>
                </Box>
            )}

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
                                    Mobile Number
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.mobile || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <MessageText1 size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    WhatsApp Number
                                </Typography>
                            </Stack>
                            <Typography variant="body1" fontWeight="medium">
                                {data.whatsapp_number || 'N/A'}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Social Media</Typography>
                            <Stack spacing={1}>
                                <Typography variant="body2">
                                    <strong>Facebook:</strong> {data.facebook || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Instagram:</strong> {data.instagram || 'N/A'}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Twitter:</strong> {data.twitter || 'N/A'}
                                </Typography>
                            </Stack>
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
                    </Stack>
                </Grid>

                {/* Right Column - Location Info */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Typography variant="subtitle1" gutterBottom>Location Information</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
                            <Chip label={data.state?.name || 'N/A'} color="primary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division</Typography>
                            <Chip label={data.division?.name || 'N/A'} color="warning" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
                            <Chip label={data.parliament?.name || 'N/A'} color="secondary" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
                            <Chip label={data.assembly?.name || 'N/A'} color="info" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Block</Typography>
                            <Chip label={data.block?.name || 'N/A'} color="success" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth</Typography>
                            <Chip label={data.booth?.name || 'N/A'} color="error" size="small" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={6} lg={6} xl={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth Number</Typography>
                            <Chip label={data.booth?.booth_number || 'N/A'} color="error" size="small" />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}
