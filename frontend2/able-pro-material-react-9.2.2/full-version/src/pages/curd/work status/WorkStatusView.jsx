import { Stack, Typography, Divider, Chip, Grid, Link } from '@mui/material';

export default function WorkStatusView({ data }) {
    if (!data) return null;

    const statusColors = {
        'Pending': 'default',
        'In Progress': 'info',
        'Completed': 'success',
        'Halted': 'warning',
        'Cancelled': 'error'
    };

    const fundSourceColors = {
        'vidhayak nidhi': 'primary',
        'swechcha nidhi': 'secondary'
    };

    return (
        <Stack spacing={2}>
            <Typography variant="h5">{data.work_name}</Typography>
            <Divider />

            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Department:</Typography>
                        <Typography>{data.department}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Status:</Typography>
                        <Chip 
                            label={data.status} 
                            color={statusColors[data.status]} 
                            size="small" 
                            sx={{ textTransform: 'capitalize' }}
                        />
                    </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Fund Source:</Typography>
                        <Chip 
                            label={data.approved_fund_from} 
                            color={fundSourceColors[data.approved_fund_from]} 
                            size="small" 
                            sx={{ textTransform: 'capitalize' }}
                        />
                    </Stack>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Total Budget:</Typography>
                        <Typography>₹{data.total_budget.toLocaleString()}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Spent Amount:</Typography>
                        <Typography>₹{data.spent_amount.toLocaleString()}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Remaining:</Typography>
                        <Typography>₹{(data.total_budget - data.spent_amount).toLocaleString()}</Typography>
                    </Stack>
                </Grid>
            </Grid>

            {data.falia && (
                <Stack spacing={1}>
                    <Typography fontWeight="bold">Falia:</Typography>
                    <Typography>{data.falia}</Typography>
                </Stack>
            )}

            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Start Date:</Typography>
                        <Typography>{new Date(data.start_date).toLocaleDateString()}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Expected End Date:</Typography>
                        <Typography>{new Date(data.expected_end_date).toLocaleDateString()}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Actual End Date:</Typography>
                        <Typography>
                            {data.actual_end_date ? new Date(data.actual_end_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                    </Stack>
                </Grid>
            </Grid>

            {data.description && (
                <Stack spacing={1}>
                    <Typography fontWeight="bold">Description:</Typography>
                    <Typography>{data.description}</Typography>
                </Stack>
            )}

            <Typography variant="h6">Location Details</Typography>
            <Divider />

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

            {data.documents?.length > 0 && (
                <>
                    <Typography variant="h6">Documents</Typography>
                    <Divider />
                    <Stack spacing={1}>
                        {data.documents.map((doc, index) => (
                            <Stack key={index} direction="row" spacing={2} alignItems="center">
                                <Typography sx={{ flex: 1 }}>{doc.name}</Typography>
                                <Link href={doc.url} target="_blank" rel="noopener">View Document</Link>
                            </Stack>
                        ))}
                    </Stack>
                </>
            )}

            <Typography variant="body2">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography variant="body2">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}