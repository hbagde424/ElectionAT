import { Box, Typography, Grid, Chip, Divider } from '@mui/material';

export default function ParliamentView({ data }) {
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Parliament Details</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Parliament Name</Typography>
                    <Typography variant="body1">{data.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">PC Number</Typography>
                    <Chip label={data.parliament_no || 'N/A'} color="primary" size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                    <Chip label={data.category || 'N/A'} color="secondary" size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Regional Type</Typography>
                    <Chip label={data.regional_type || 'N/A'} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Division</Typography>
                    <Chip label={data.division_id?.name || 'N/A'} color="info" size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">State</Typography>
                    <Chip label={data.state_id?.name || 'N/A'} color="success" size="small" />
                </Grid>
                <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                    <Typography variant="body2" dangerouslySetInnerHTML={{ __html: data.description || 'No description available' }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Created By</Typography>
                    <Typography variant="body2">{data.created_by?.username || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">Updated By</Typography>
                    <Typography variant="body2">{data.updated_by?.username || 'N/A'}</Typography>
                </Grid>
            </Grid>
        </Box>
    );
}
