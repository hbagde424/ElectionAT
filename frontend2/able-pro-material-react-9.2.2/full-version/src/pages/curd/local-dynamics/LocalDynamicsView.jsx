// LocalDynamicsView.jsx
import { Stack, Typography, Divider, Grid, Box } from '@mui/material';

export default function LocalDynamicsView({ data }) {
    if (!data) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
                Local Dynamics Details - Booth: {data.booth_id}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Booth ID
                        </Typography>
                        <Typography variant="body1">
                            {data.booth_id || 'N/A'}
                        </Typography>
                    </Stack>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Dominant Caste
                        </Typography>
                        <Typography variant="body1">
                            {data.dominant_caste || 'N/A'}
                        </Typography>
                    </Stack>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Local Leader
                        </Typography>
                        <Typography variant="body1">
                            {data.local_leader || 'N/A'}
                        </Typography>
                    </Stack>
                </Grid>
                
                <Grid item xs={12}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Known Issues
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {data.known_issues || 'No issues reported'}
                        </Typography>
                    </Stack>
                </Grid>
                
                <Grid item xs={12}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Grassroots Organizations
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {data.grassroots_orgs || 'No organizations listed'}
                        </Typography>
                    </Stack>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Created At
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDate(data.created_at)}
                        </Typography>
                    </Stack>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Updated At
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDate(data.updated_at)}
                        </Typography>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}
