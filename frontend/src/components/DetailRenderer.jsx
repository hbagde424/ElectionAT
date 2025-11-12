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
        // Prefer common explicit display fields for populated refs
        // e.g. election_year -> { year: 2024 }, booths -> { booth_number }, panchayat/village/falliya
        if (value.year !== undefined && value.year !== null) {
            return String(value.year);
        }
        if (value.booth_number !== undefined && value.booth_number !== null) {
            // Show booth name and number together
            if (value.name) {
                return `${value.name} (Booth #${value.booth_number})`;
            }
            return `Booth #${value.booth_number}`;
        }
        if (value.panchayat_name) {
            return value.panchayat_name;
        }
        if (value.village_name) {
            return value.village_name;
        }
        if (value.falliya_name) {
            return value.falliya_name;
        }
        // common fallback: populated refs often have name or username
        if (value.name) {
            return value.name;
        }
        if (value.username) {
            return value.username;
        }
        if (value._id) {
            return value._id;
        }
        // otherwise show compact JSON
        return <Box sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{JSON.stringify(value, null, 2)}</Box>;
    }
    return String(value);
};

const DetailRenderer = ({ data }) => {
    if (!data) return <Typography>No data</Typography>;

    // hide common internal/id fields and post details
    // BUT show populated reference fields (they will be objects with name/username)
    const HIDDEN_KEYS = new Set([
        'id', '_id', '__v', 'post', 'post_details', 'postDetails', 'postdetails'
    ]);
    
    const allKeys = Object.keys(data).filter((k) => {
        if (HIDDEN_KEYS.has(k)) return false;
        
        // Hide *_id fields only if they are primitive (string/ObjectId), not populated objects
        if (k.endsWith('_id') || k.endsWith('Id')) {
            const value = data[k];
            // If it's a string or null/undefined, hide it
            if (typeof value === 'string' || value === null || value === undefined) {
                return false;
            }
            // If it's an object (populated), show it
            if (typeof value === 'object') {
                return true;
            }
            return false;
        }
        
        return true;
    });
    
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
