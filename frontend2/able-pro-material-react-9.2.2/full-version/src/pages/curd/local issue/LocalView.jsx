import { Stack, Typography, Divider, Chip, Grid } from '@mui/material';

export default function LocalIssueView({ data }) {
    if (!data) return null;

    const statusColors = {
        'Reported': 'default',
        'In Progress': 'info',
        'Resolved': 'success',
        'Rejected': 'error'
    };

    const priorityColors = {
        'Low': 'success',
        'Medium': 'info',
        'High': 'warning',
        'Critical': 'error'
    };

    return (
        <Stack spacing={2}>
            <Typography variant="h6">Issue Details</Typography>
            <Divider />

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Issue Name:</Typography>
                        <Typography>{data.issue_name}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Department:</Typography>
                        <Typography>{data.department}</Typography>
                    </Stack>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Status:</Typography>
                        <Chip
                            label={data.status}
                            color={statusColors[data.status]}
                            size="small"
                            sx={{ width: 120 }}
                        />
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Priority:</Typography>
                        <Chip
                            label={data.priority}
                            color={priorityColors[data.priority]}
                            size="small"
                            sx={{ width: 120 }}
                        />
                    </Stack>
                </Grid>
            </Grid>

            {data.description && (
                <Stack spacing={1}>
                    <Typography fontWeight="bold">Description:</Typography>
                    <Typography>{data.description}</Typography>
                </Stack>
            )}

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">State:</Typography>
                        {data.state_id ? (
                            <Chip label={data.state_id.name} color="info" size="small" />
                        ) : (
                            <Typography variant="caption">No state</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Division:</Typography>
                        {data.division_id ? (
                            <Chip label={data.division_id.name} color="warning" size="small" />
                        ) : (
                            <Typography variant="caption">No division</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Booth:</Typography>
                        {data.booth_id ? (
                            <Typography>
                                {data.booth_id.name} (Booth: {data.booth_id.booth_number})
                            </Typography>
                        ) : (
                            <Typography variant="caption">No booth</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Block:</Typography>
                        {data.block_id ? (
                            <Chip label={data.block_id.name} color="primary" size="small" />
                        ) : (
                            <Typography variant="caption">No block</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Assembly:</Typography>
                        {data.assembly_id ? (
                            <Chip label={data.assembly_id.name} color="secondary" size="small" />
                        ) : (
                            <Typography variant="caption">No assembly</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Parliament:</Typography>
                        {data.parliament_id ? (
                            <Chip label={data.parliament_id.name} color="info" size="small" />
                        ) : (
                            <Typography variant="caption">No parliament</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Stack spacing={1}>
                <Typography fontWeight="bold">Division:</Typography>
                {data.division_id ? (
                    <Chip label={data.division_id.name} color="warning" size="small" />
                ) : (
                    <Typography variant="caption">No division</Typography>
                )}
            </Stack>

            <Typography variant="body2">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography variant="body2">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}