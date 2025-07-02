import { Stack, Typography, Divider, Chip, Avatar, Grid } from '@mui/material';
import { User } from 'iconsax-react';

export default function BoothSurveyView({ data }) {
    if (!data) return null;

    const statusColors = {
        'Pending': 'default',
        'In Progress': 'info',
        'Completed': 'primary',
        'Verified': 'success',
        'Rejected': 'error'
    };

    return (
        <Stack spacing={2}>
            <Typography variant="h6">Survey Details</Typography>
            <Divider />
            
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Booth:</Typography>
                        <Typography>
                            {data.booth_id?.name || 'Unknown'} (Booth: {data.booth_id?.booth_number || 'N/A'})
                        </Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Survey Date:</Typography>
                        <Typography>{new Date(data.survey_date).toLocaleDateString()}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Status:</Typography>
                        <Chip 
                            label={data.status} 
                            color={statusColors[data.status]} 
                            size="small" 
                            sx={{ width: 100 }}
                        />
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Surveyor:</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                                <User size={16} />
                            </Avatar>
                            <Typography>{data.survey_done_by?.name || 'Unknown'}</Typography>
                        </Stack>
                    </Stack>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Division:</Typography>
                        {data.division_id ? (
                            <Chip label={data.division_id.name} color="primary" size="small" />
                        ) : (
                            <Typography variant="caption">No division</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Parliament:</Typography>
                        {data.parliament_id ? (
                            <Chip label={data.parliament_id.name} color="secondary" size="small" />
                        ) : (
                            <Typography variant="caption">No parliament</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Assembly:</Typography>
                        {data.assembly_id ? (
                            <Chip label={data.assembly_id.name} color="info" size="small" />
                        ) : (
                            <Typography variant="caption">No assembly</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Block:</Typography>
                        {data.block_id ? (
                            <Chip label={data.block_id.name} color="warning" size="small" />
                        ) : (
                            <Typography variant="caption">No block</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            {data.poll_result && (
                <Stack spacing={1}>
                    <Typography fontWeight="bold">Poll Result:</Typography>
                    <Typography>{data.poll_result}</Typography>
                </Stack>
            )}

            {data.remark && (
                <Stack spacing={1}>
                    <Typography fontWeight="bold">Remarks:</Typography>
                    <Typography>{data.remark}</Typography>
                </Stack>
            )}

            <Typography variant="body2">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography variant="body2">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}