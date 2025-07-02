import { Stack, Typography, Divider, Chip, Box, Grid, LinearProgress } from '@mui/material';
// import { MapOutlined } from '@mui/icons-material';

export default function WorkStatusView({ data }) {
    if (!data) return null;

    const progress = Math.min(100, (data.approved_fund / data.total_budget) * 100);

    return (
        <Stack spacing={2} sx={{ p: 2 }}>
            <Typography variant="h6">{data.work_name}</Typography>
            <Divider />
            
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Department:</Typography>
                        <Typography>{data.department}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Status:</Typography>
                        <Chip 
                            label={data.status} 
                            color={
                                data.status === 'Completed' ? 'success' : 
                                data.status === 'In Progress' ? 'primary' : 
                                data.status === 'Halted' ? 'warning' : 
                                data.status === 'Cancelled' ? 'error' : 'default'
                            } 
                            size="small" 
                            sx={{ width: 100 }}
                        />
                    </Stack>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Approved Fund:</Typography>
                        <Typography>₹{new Intl.NumberFormat('en-IN').format(data.approved_fund)}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Total Budget:</Typography>
                        <Typography>₹{new Intl.NumberFormat('en-IN').format(data.total_budget)}</Typography>
                    </Stack>
                </Grid>
            </Grid>

            <Stack spacing={1}>
                <Typography fontWeight="bold">Progress:</Typography>
                <Stack spacing={1}>
                    <Typography variant="caption" color="textSecondary">
                        ₹{new Intl.NumberFormat('en-IN').format(data.approved_fund)} / ₹{new Intl.NumberFormat('en-IN').format(data.total_budget)}
                    </Typography>
                    <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        color={
                            progress === 100 ? 'success' : 
                            progress > 70 ? 'primary' : 
                            progress > 30 ? 'warning' : 'error'
                        }
                    />
                </Stack>
            </Stack>

            {data.falia && (
                <Stack spacing={1}>
                    <Typography fontWeight="bold">Falia:</Typography>
                    <Typography>{data.falia}</Typography>
                </Stack>
            )}

            <Divider />

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight="bold">Division:</Typography>
                        {data.division_id ? (
                            <Chip label={data.division_id.name} color="primary" size="small" />
                        ) : (
                            <Typography variant="caption">No division</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight="bold">Parliament:</Typography>
                        {data.parliament_id ? (
                            <Chip label={data.parliament_id.name} color="secondary" size="small" />
                        ) : (
                            <Typography variant="caption">No parliament</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight="bold">Assembly:</Typography>
                        {data.assembly_id ? (
                            <Chip label={data.assembly_id.name} color="info" size="small" />
                        ) : (
                            <Typography variant="caption">No assembly</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight="bold">Block:</Typography>
                        {data.block_id ? (
                            <Chip label={data.block_id.name} color="warning" size="small" />
                        ) : (
                            <Typography variant="caption">No block</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight="bold">Booth:</Typography>
                        {data.booth_id ? (
                            <Chip 
                                label={`${data.booth_id.name} (Booth: ${data.booth_id.booth_number})`} 
                                color="success" 
                                size="small" 
                            />
                        ) : (
                            <Typography variant="caption">No booth</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            {data.description && (
                <>
                    <Divider />
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Description:</Typography>
                        <Typography>{data.description}</Typography>
                    </Stack>
                </>
            )}

            <Divider />
            <Typography variant="caption">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography variant="caption">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}