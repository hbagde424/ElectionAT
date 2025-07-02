import { Stack, Typography, Divider, Chip, Box, Avatar, Grid } from '@mui/material';

export default function PotentialCandidateView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
                {data.image && (
                    <Avatar src={data.image} alt={data.name} sx={{ width: 80, height: 80 }} />
                )}
                <Box>
                    <Typography variant="h5">{data.name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {data.party_id && (
                            <Chip label={data.party_id.name} color="primary" size="small" />
                        )}
                        {data.constituency_id && (
                            <Chip label={data.constituency_id.name} color="secondary" size="small" />
                        )}
                    </Stack>
                </Box>
            </Stack>
            <Divider />

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Election Year:</Typography>
                        <Typography>{data.election_year_id?.year || 'N/A'}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Status:</Typography>
                        <Chip 
                            label={data.status.charAt(0).toUpperCase() + data.status.slice(1).replace('_', ' ')} 
                            color={
                                data.status === 'active' ? 'success' : 
                                data.status === 'inactive' ? 'error' : 'warning'
                            } 
                            size="small" 
                        />
                    </Stack>
                </Grid>
            </Grid>

            {data.history && (
                <Stack spacing={1}>
                    <Typography fontWeight="bold">Political History:</Typography>
                    <Typography>{data.history}</Typography>
                </Stack>
            )}

            {data.post_details && (
                <>
                    <Typography variant="h6">Previous Post Details</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <Typography fontWeight="bold">Post Name:</Typography>
                                <Typography>{data.post_details.postname}</Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <Typography fontWeight="bold">Place:</Typography>
                                <Typography>{data.post_details.place}</Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <Typography fontWeight="bold">From Date:</Typography>
                                <Typography>{new Date(data.post_details.from_date).toLocaleDateString()}</Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <Typography fontWeight="bold">To Date:</Typography>
                                <Typography>{new Date(data.post_details.to_date).toLocaleDateString()}</Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                </>
            )}

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Pros:</Typography>
                        <Typography>{data.pros || 'N/A'}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Cons:</Typography>
                        <Typography>{data.cons || 'N/A'}</Typography>
                    </Stack>
                </Grid>
            </Grid>

            <Typography variant="caption">
                Last updated: {new Date(data.updated_at).toLocaleString()}
            </Typography>
        </Stack>
    );
}