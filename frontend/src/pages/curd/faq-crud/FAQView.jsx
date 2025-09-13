import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User, Document, Category2 } from 'iconsax-react';

export default function FAQView({ data }) {
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

    const getCategoryColor = (category) => {
        const categoryColors = {
            'General Questions': 'primary',
            'Account & Login': 'success',
            'Data & Analytics': 'warning',
            'Technical Support': 'error',
            'Other': 'secondary'
        };
        return categoryColors[category] || 'default';
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="h6">{data.question || 'Untitled FAQ'}</Typography>
                <Chip
                    label={data.category || 'N/A'}
                    color={getCategoryColor(data.category)}
                    size="small"
                    variant="outlined"
                />
                <Chip
                    label={data.is_active ? 'Active' : 'Inactive'}
                    color={data.is_active ? 'success' : 'error'}
                    size="small"
                />
                {data.order_index !== undefined && data.order_index > 0 && (
                    <Chip
                        label={`Order: ${data.order_index}`}
                        color="info"
                        size="small"
                        variant="outlined"
                    />
                )}
            </Stack>

            {/* Answer Field (HTML) */}
            {data.answer && (
                <Box sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Document size="16" />
                        <Typography variant="subtitle2" color="text.secondary">Answer</Typography>
                    </Stack>
                    <Box
                        sx={{
                            border: '1px solid #eee',
                            borderRadius: 1,
                            p: 2,
                            bgcolor: 'background.default',
                            maxHeight: 300,
                            overflow: 'auto',
                            '& p': { mb: 1 },
                            '& ul, & ol': { pl: 2, mb: 1 },
                            '& li': { mb: 0.5 },
                            '& h1, & h2, & h3': { mb: 1, mt: 1 },
                            '& code': { 
                                bgcolor: 'grey.100', 
                                p: 0.5, 
                                borderRadius: 0.5, 
                                fontSize: '0.9em' 
                            },
                            '& pre': { 
                                bgcolor: 'grey.100', 
                                p: 1, 
                                borderRadius: 1, 
                                overflow: 'auto' 
                            }
                        }}
                        dangerouslySetInnerHTML={{ __html: data.answer }}
                    />
                </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column */}
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
                    </Stack>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
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

                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Category2 size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Category Details
                                </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <Chip
                                    label={data.category || 'N/A'}
                                    color={getCategoryColor(data.category)}
                                    size="small"
                                />
                                <Chip
                                    label={`Order: ${data.order_index || 0}`}
                                    color="info"
                                    size="small"
                                    variant="outlined"
                                />
                            </Stack>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}