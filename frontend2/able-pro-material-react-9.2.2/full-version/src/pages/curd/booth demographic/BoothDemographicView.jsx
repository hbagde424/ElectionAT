import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User, People, Book, Money2, Profile2User, Health, Home } from 'iconsax-react';

export default function BoothDemographicsView({ data }) {
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

    const calculatePercentage = (value, total) => {
        if (!total || total === 0) return '0%';
        return `${Math.round((value / total) * 100)}%`;
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="h6">Booth Demographics</Typography>
                <Chip
                    label={`Booth ID: ${data.booth_id?._id || data.booth_id || 'N/A'}`}
                    size="small"
                    variant="outlined"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column - Basic Info */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        {/* Population Summary */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <People size="16" />
                                <Typography variant="subtitle2" color="text.secondary">
                                    Population Summary
                                </Typography>
                            </Stack>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Total Population:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.total_population || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Total Electors:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.total_electors || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body2">Male:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.male_electors || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body2">Female:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.female_electors || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="body2">Other:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.other_electors || '0'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Age Groups */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Health size="16" /> {/* Using Health icon for Age */}
                                <Typography variant="subtitle2" color="text.secondary">
                                    Age Groups
                                </Typography>
                            </Stack>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">18-25:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.age_groups?._18_25 || '0'} ({calculatePercentage(data.age_groups?._18_25 || 0, data.total_electors)})
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">26-40:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.age_groups?._26_40 || '0'} ({calculatePercentage(data.age_groups?._26_40 || 0, data.total_electors)})
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">41-60:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.age_groups?._41_60 || '0'} ({calculatePercentage(data.age_groups?._41_60 || 0, data.total_electors)})
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">60+:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.age_groups?._60_above || '0'} ({calculatePercentage(data.age_groups?._60_above || 0, data.total_electors)})
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Caste Population */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Profile2User size="16" /> {/* Using Profile2User for Caste */}
                                <Typography variant="subtitle2" color="text.secondary">
                                    Caste Distribution
                                </Typography>
                            </Stack>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">SC:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.caste_population?.sc || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">ST:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.caste_population?.st || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">OBC:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.caste_population?.obc || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">General:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.caste_population?.general || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Other:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.caste_population?.other || '0'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Stack>
                </Grid>

                {/* Right Column - Detailed Info */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        {/* Education */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Book size="16" /> {/* Using Book icon for Education */}
                                <Typography variant="subtitle2" color="text.secondary">
                                    Education
                                </Typography>
                            </Stack>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Illiterate:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.education?.illiterate || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Educated:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.education?.educated || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Class 1-5:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.education?.class_1_to_5 || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Class 5-10:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.education?.class_5_to_10 || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Class 10-12:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.education?.class_10_to_12 || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Graduate:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.education?.graduate || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Post Graduate:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.education?.post_graduate || '0'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Income */}
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <Money2 size="16" /> {/* Using Money2 icon for Income */}
                                <Typography variant="subtitle2" color="text.secondary">
                                    Annual Income
                                </Typography>
                            </Stack>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Below ₹10K:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.annual_income?.below_10k || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">₹10K-20K:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.annual_income?._10k_to_20k || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">₹25K-50K:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.annual_income?._25k_to_50k || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">₹50K-2L:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.annual_income?._50k_to_2L || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">₹2L-5L:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.annual_income?._2L_to_5L || '0'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Above ₹5L:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.annual_income?.above_5L || '0'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Religious Composition */}
                        {data.religious_composition && (
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                    <Home size="16" /> {/* Using Home icon for Religion */}
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Religious Composition
                                    </Typography>
                                </Stack>
                                <Grid container spacing={1}>
                                    {Object.entries(data.religious_composition).map(([religion, count]) => (
                                        <Grid item xs={6} key={religion}>
                                            <Typography variant="body2" textTransform="capitalize">
                                                {religion}:
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {count} ({calculatePercentage(count, data.total_population)})
                                            </Typography>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                    </Stack>
                </Grid>

                {/* Metadata */}
                <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Created By
                            </Typography>
                            <Typography variant="body1">
                                {data.created_by?.username || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Created At
                            </Typography>
                            <Typography variant="body1">
                                {formatDate(data.created_at)}
                            </Typography>
                        </Grid>
                        {data.updated_by && (
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Updated By
                                </Typography>
                                <Typography variant="body1">
                                    {data.updated_by?.username || 'N/A'}
                                </Typography>
                            </Grid>
                        )}
                        {data.updated_at && (
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Updated At
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(data.updated_at)}
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}