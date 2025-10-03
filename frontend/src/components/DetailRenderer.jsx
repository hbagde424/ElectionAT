import React from 'react';
import { Grid, Typography, Box, Chip, Stack } from '@mui/material';

const humanize = (key) => {
    if (!key) return '';
    return String(key)
        .replace(/_/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

const isIsoDateString = (value) => {
    if (typeof value !== 'string') return false;
    // simple ISO datetime check
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
};

const formatDateTime = (val) => {
    if (!val && val !== 0) return 'N/A';
    try {
        if (typeof val === 'number') return new Date(val).toLocaleString();
        if (isIsoDateString(val)) return new Date(val).toLocaleString();
        return String(val);
    } catch (e) {
        return String(val);
    }
};

const renderValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') {
        if (isIsoDateString(value)) return formatDateTime(value);
        return value || 'N/A';
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        // primitive array
        if (value.every((v) => ['string', 'number', 'boolean'].includes(typeof v))) {
            return value.join(', ');
        }
        // object array - show compact JSON per item
        return (
            <Stack spacing={1}>
                {value.map((v, i) => (
                    <Box key={i} sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{JSON.stringify(v, null, 2)}</Box>
                ))}
            </Stack>
        );
    }
    if (typeof value === 'object') {
        // common pattern: populated refs have name or username
        if (value.name || value.username || value._id) {
            const display = value.name || value.username || value._id;
            return display;
        }
        // otherwise show compact JSON
        return <Box sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</Box>;
    }
    return String(value);
};

const DetailRenderer = ({ data }) => {
    if (!data) return <Typography>No data</Typography>;

    // hide common internal/id fields and post details
    const HIDDEN_KEYS = new Set([
        'id', '_id', '__v', 'post', 'post_details', 'postDetails', 'postdetails',
        // hide all ID fields
        'candidate_id', 'candidateId', 'state_id', 'stateId', 'division_id', 'divisionId',
        'parliament_id', 'parliamentId', 'assembly_id', 'assemblyId', 'block_id', 'blockId',
        'booth_id', 'boothId', 'election_year_id', 'electionYearId', 'party_id', 'partyId',
        'user_id', 'userId', 'volunteer_id', 'volunteerId', 'constituency_id', 'constituencyId'
    ]);
    const allKeys = Object.keys(data).filter((k) => !HIDDEN_KEYS.has(k));
    
    // move metadata fields to the end in specific order
    const METADATA_KEYS = new Set(['created_by', 'updated_by', 'created_at', 'updated_at']);
    const DESCRIPTION_KEYS = new Set(['description']);
    
    const regularKeys = allKeys.filter(k => !METADATA_KEYS.has(k) && !DESCRIPTION_KEYS.has(k));
    const descriptionKeys = allKeys.filter(k => DESCRIPTION_KEYS.has(k));
    
    // Specific order for metadata: Created By, Updated By, Created At, Updated At
    const orderedMetadataKeys = ['created_by', 'updated_by', 'created_at', 'updated_at'].filter(k => allKeys.includes(k));
    
    const keys = [...regularKeys, ...descriptionKeys, ...orderedMetadataKeys];

    return (
        <Grid container spacing={3}>
            {keys.map((key) => (
                <Grid item xs={12} md={4} key={key}>
                    <Typography variant="subtitle2" color="text.secondary">{humanize(key)}</Typography>
                    <Box sx={{ mt: 0.5 }}>{renderValue(data[key])}</Box>
                </Grid>
            ))}
        </Grid>
    );
};

export default DetailRenderer;
