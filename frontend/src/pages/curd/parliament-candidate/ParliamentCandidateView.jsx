import { 
    Stack, Typography, Divider, Grid, Box, Chip, 
    DialogTitle, DialogContent, DialogActions, Button, IconButton
} from '@mui/material';
import { CalendarTick, User, Document, Category2, Award, Chart, CloseCircle } from 'iconsax-react';

export default function ParliamentCandidateView({ data, onClose }) {
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

    const formatNumber = (num) => {
        const parseToNumber = (val) => {
            if (val === undefined || val === null || val === '') return null;
            if (typeof val === 'number') return val;
            const s = String(val);
            const match = s.match(/([0-9,.-]+)/);
            if (!match) return null;
            const cleaned = match[0].replace(/,/g, '');
            const n = Number(cleaned);
            return isNaN(n) ? null : n;
        };
        const n = parseToNumber(num);
        if (n === null) return 'N/A';
        return n.toLocaleString();
    };

    const getResultColor = (result) => {
        switch (result?.toLowerCase()) {
            case 'win':
                return 'success';
            case 'loss':
                return 'error';
            default:
                return 'default';
        }
    };

    const getVotePercentage = () => {
        const parse = (v) => {
            if (v === undefined || v === null || v === '') return 0;
            if (typeof v === 'number') return v;
            const s = String(v).replace(/[^0-9.-]/g, '');
            const n = Number(s);
            return isNaN(n) ? 0 : n;
        };
        const total = parse(data.total_votes_parliament ?? data.Total_Votes_Polled);
        const cand = parse(data.candidate_votes);
        if (total > 0) {
            return ((cand / total) * 100).toFixed(2);
        }
        return '0';
    };

    const getMarginPercentDecimal = () => {
        const parseToNumber = (v) => {
            if (v === undefined || v === null || v === '') return null;
            if (typeof v === 'number') return v;
            const s = String(v);
            const percentMatch = s.match(/([0-9.,]+)\s*%/);
            if (percentMatch) {
                const cleaned = percentMatch[1].replace(/,/g, '');
                const n = Number(cleaned);
                return isNaN(n) ? null : (n <= 1 ? n : n / 100);
            }
            const cleaned = s.replace(/[^0-9.-]/g, '');
            const n = Number(cleaned);
            return isNaN(n) ? null : n;
        };

        const possible = [
            data.margin_percentage,
            data.Margin_percentage,
            data.marginPercent,
            data.margin_percent,
            data.marginPercentage
        ];
        for (const v of possible) {
            const n = parseToNumber(v);
            if (n !== null) {
                // if this looks like a percent (greater than 1), convert to decimal fraction
                if (n > 1) return n <= 100 ? n / 100 : n;
                return n;
            }
        }

        const margin = parseToNumber(data.margin ?? data.Margin) || 0;
        const total = parseToNumber(data.total_votes_parliament ?? data.Total_Votes_Polled) || 0;
        if (total > 0) return Math.abs(margin) / total;
        return 0;
    };

    return (
        <>
            <DialogTitle>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="h5">Parliament Candidate Details</Typography>
                        <Chip
                            label={data.position_result?.toUpperCase() || 'N/A'}
                            color={getResultColor(data.position_result)}
                            size="small"
                        />
                    </Stack>
                    <IconButton onClick={onClose} color="inherit">
                        <CloseCircle />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ p: 2 }}>
                    {/* Basic Information */}
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" gutterBottom color="primary">
                                Candidate Information
                            </Typography>
                            
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                                <User size="16" />
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Candidate Name
                                                </Typography>
                                            </Stack>
                                            <Typography variant="h6" fontWeight="bold">
                                                {data.candidate_id?.name || 'N/A'}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                                <Document size="16" />
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Parliament Constituency
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body1" fontWeight="medium">
                                                {data.parliament_id?.name || 'N/A'}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                                <CalendarTick size="16" />
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Election Year
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body1" fontWeight="medium">
                                                {data.election_year_id?.year || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                                <Category2 size="16" />
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Political Party
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body1" fontWeight="medium">
                                                {data.party_id?.name || 'N/A'}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                                <Award size="16" />
                                                <Typography variant="subtitle2" color="text.secondary">
                                                    Election Result
                                                </Typography>
                                            </Stack>
                                            <Chip
                                                label={data.position_result?.toUpperCase() || 'N/A'}
                                                color={getResultColor(data.position_result)}
                                                size="medium"
                                            />
                                        </Box>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider />

                        {/* Voting Statistics */}
                        <Box>
                            <Typography variant="h6" gutterBottom color="primary">
                                Voting Statistics
                            </Typography>
                            
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: 'primary.lighter', 
                                        borderRadius: 1,
                                        textAlign: 'center'
                                    }}>
                                        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} mb={1}>
                                            <Chart size="20" color="primary" />
                                            <Typography variant="subtitle2" color="primary">
                                                Total Votes
                                            </Typography>
                                        </Stack>
                                        <Typography variant="h4" color="primary" fontWeight="bold">
                                            {formatNumber(data.total_votes_parliament)}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: getResultColor(data.position_result) === 'success' ? 'success.lighter' : 'error.lighter', 
                                        borderRadius: 1,
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="subtitle2" color={getResultColor(data.position_result) === 'success' ? 'success.main' : 'error.main'} mb={1}>
                                            Candidate Votes
                                        </Typography>
                                        <Typography 
                                            variant="h4" 
                                            color={getResultColor(data.position_result) === 'success' ? 'success.main' : 'error.main'} 
                                            fontWeight="bold"
                                        >
                                            {formatNumber(data.candidate_votes)}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: 'info.lighter', 
                                        borderRadius: 1,
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="subtitle2" color="info.main" mb={1}>
                                            Vote Percentage
                                        </Typography>
                                        <Typography variant="h4" color="info.main" fontWeight="bold">
                                            {getVotePercentage()}%
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: data.margin >= 0 ? 'success.lighter' : 'error.lighter', 
                                        borderRadius: 1,
                                        textAlign: 'center'
                                    }}>
                                        <Typography 
                                            variant="subtitle2" 
                                            color={data.margin >= 0 ? 'success.main' : 'error.main'} 
                                            mb={1}
                                        >
                                            Margin
                                        </Typography>
                                        <Typography 
                                            variant="h4" 
                                            color={data.margin >= 0 ? 'success.main' : 'error.main'} 
                                            fontWeight="bold"
                                        >
                                            {data.margin > 0 ? '+' : ''}{formatNumber(data.margin)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: 'background.default', 
                                        borderRadius: 1,
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="subtitle2" color="text.secondary" mb={1}>
                                            Electors
                                        </Typography>
                                        <Typography variant="h6" color="text.primary" fontWeight="bold">
                                            {formatNumber(data.electors)}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: 'background.default', 
                                        borderRadius: 1,
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="subtitle2" color="text.secondary" mb={1}>
                                            Turnout
                                        </Typography>
                                        <Typography variant="h6" color="text.primary" fontWeight="bold">
                                                    {(() => {
                                                        const parse = (v) => {
                                                            if (v === undefined || v === null || v === '') return null;
                                                            if (typeof v === 'number') return v;
                                                            const s = String(v);
                                                            const percentMatch = s.match(/([0-9.,]+)\s*%/);
                                                            if (percentMatch) {
                                                                const cleaned = percentMatch[1].replace(/,/g, '');
                                                                const n = Number(cleaned);
                                                                return isNaN(n) ? null : (n <= 1 ? n : n / 100);
                                                            }
                                                            const cleaned = s.replace(/[^0-9.-]/g, '');
                                                            const n = Number(cleaned);
                                                            return isNaN(n) ? null : (n <= 1 ? n : n / 100);
                                                        };
                                                        const n = parse(data.turnout ?? data.Turnout);
                                                        if (n === null) return 'N/A';
                                                        return `${(n * 100).toFixed(1)}%`;
                                                    })()}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: 'background.default', 
                                        borderRadius: 1,
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="subtitle2" color="text.secondary" mb={1}>
                                            NOTA Votes
                                        </Typography>
                                        <Typography variant="h6" color="text.primary" fontWeight="bold">
                                            {formatNumber(data.nota_votes)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ 
                                        p: 2, 
                                        bgcolor: 'background.default', 
                                        borderRadius: 1,
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="subtitle2" color="text.secondary" mb={1}>
                                            Margin %
                                        </Typography>
                                        <Typography variant="h4" color="text.primary" fontWeight="bold">
                                            {`${(getMarginPercentDecimal() * 100).toFixed(2)}%`}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Vote Analysis */}
                            <Box sx={{ 
                                mt: 2, 
                                p: 2, 
                                bgcolor: 'background.default', 
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Vote Analysis
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            Other Candidates Votes: <strong>
                                                {formatNumber((data.total_votes_parliament || 0) - (data.candidate_votes || 0))}
                                            </strong>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Typography variant="body2" color="text.secondary">
                                            Vote Share: <strong>{getVotePercentage()}%</strong>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Typography 
                                            variant="body2" 
                                            color={data.position_result === 'win' ? 'success.main' : 'error.main'}
                                        >
                                            Result: <strong>{data.position_result?.toUpperCase() || 'N/A'}</strong>
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Metadata */}
                        <Box>
                            <Typography variant="h6" gutterBottom color="primary">
                                Record Information
                            </Typography>
                            
                            <Grid container spacing={3}>
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
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Box>
                    </Stack>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button variant="outlined" onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </>
    );
}