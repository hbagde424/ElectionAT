import { Stack, Typography, Divider, Grid, Box, Chip } from '@mui/material';
import { CalendarTick, User, DocumentText1 } from 'iconsax-react';

export default function WorkStatusView({ data }) {
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
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Typography variant="h6">{data.work_name || 'Untitled Work'}</Typography>
                <Chip
                    label={data.department?.toUpperCase() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
                <Chip
                    label={data.status || 'N/A'}
                    color={
                        data.status === 'Completed' ? 'success' :
                        data.status === 'In Progress' ? 'info' :
                        data.status === 'Halted' ? 'warning' :
                        data.status === 'Cancelled' ? 'error' : 'default'
                    }
                    size="small"
                />
                <Chip
                    label={`Work ID: ${data._id || 'N/A'}`}
                    size="small"
                    variant="outlined"
                />
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Description
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {data.description || 'No description provided'}
                            </Typography>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Financial Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Total Budget:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {formatCurrency(data.total_budget)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Spent Amount:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {formatCurrency(data.spent_amount)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Fund Source:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.approved_fund_from || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Remaining Budget:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {formatCurrency((data.total_budget || 0) - (data.spent_amount || 0))}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Timeline
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Start Date:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {formatDate(data.start_date)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Expected End:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {formatDate(data.expected_end_date)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Actual End:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {formatDate(data.actual_end_date)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Status:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.status || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Stack>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Location Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Falia:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.falia || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">State:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.state_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Division:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.division_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Parliament:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.parliament_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Assembly:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.assembly_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2">Block:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.block_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2">Booth:</Typography>
                                    <Typography variant="body1" fontWeight="medium">
                                        {data.booth_id?.name || 'N/A'} {data.booth_id?.booth_number ? `(Booth #${data.booth_id.booth_number})` : ''}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Documents
                            </Typography>
                            {data.documents?.length > 0 ? (
                                <Stack spacing={1}>
                                    {data.documents.map((doc, index) => (
                                        <Stack key={index} direction="row" alignItems="center" spacing={1}>
                                            <DocumentText1 size="16" />
                                            <Typography 
                                                variant="body2" 
                                                component="a" 
                                                href={doc.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                sx={{ textDecoration: 'underline', color: 'primary.main' }}
                                            >
                                                {doc.name}
                                            </Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                            ) : (
                                <Typography variant="body2">No documents attached</Typography>
                            )}
                        </Box>

                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Audit Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <User size="16" />
                                        <Stack>
                                            <Typography variant="body2">Created By:</Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {data.created_by?.username || 'N/A'}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Grid>
                                <Grid item xs={6}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CalendarTick size="16" />
                                        <Stack>
                                            <Typography variant="body2">Created At:</Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {formatDate(data.created_at)}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Grid>
                                <Grid item xs={6}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <User size="16" />
                                        <Stack>
                                            <Typography variant="body2">Updated By:</Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {data.updated_by?.username || 'N/A'}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Grid>
                                <Grid item xs={6}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CalendarTick size="16" />
                                        <Stack>
                                            <Typography variant="body2">Last Updated:</Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {formatDate(data.updated_at)}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}
