import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User } from 'iconsax-react';

export default function ElectionYearView({ data }) {
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
                <Typography variant="h6">Election Year {data.year || 'N/A'}</Typography>
                <Chip
                    label={data.election_type || 'N/A'}
                    color={data.election_type === 'Assembly' ? 'success' : 'secondary'}
                    size="small"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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
                    </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
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
            </Grid>
        </Box>
    );
}