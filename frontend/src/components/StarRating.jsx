import { Stack, Rating, Typography, Box } from '@mui/material';
import { Star1 } from 'iconsax-react';

/**
 * Star Rating Component for displaying and editing performance ratings
 * @param {number} value - Current rating value (0-5)
 * @param {function} onChange - Callback when rating changes (optional, for edit mode)
 * @param {boolean} readOnly - Whether the rating is read-only
 * @param {boolean} showLabel - Whether to show the numeric label
 */
export default function StarRating({ 
    value = 0, 
    onChange, 
    readOnly = false, 
    showLabel = true,
    size = 'medium'
}) {
    // Size mapping for icons
    const sizeMap = {
        small: 20,
        medium: 24,
        large: 28
    };
    const iconSize = sizeMap[size] || 24;

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <Rating
                value={value}
                onChange={(event, newValue) => {
                    if (onChange) {
                        onChange(newValue);
                    }
                }}
                readOnly={readOnly}
                precision={0.5}
                size={size}
                icon={
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#FFD700' }}>
                        <Star1 variant="Bold" size={iconSize} color="#FFD700" />
                    </Box>
                }
                emptyIcon={
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#D3D3D3' }}>
                        <Star1 variant="Outline" size={iconSize} color="#D3D3D3" />
                    </Box>
                }
                sx={{
                    '& .MuiRating-iconFilled': {
                        color: '#FFD700',
                    },
                    '& .MuiRating-iconHover': {
                        color: '#FFA500',
                    },
                    '& .MuiRating-iconEmpty': {
                        color: '#D3D3D3',
                    },
                    '& .MuiRating-icon': {
                        display: 'flex',
                        alignItems: 'center',
                    }
                }}
            />
            {showLabel && (
                <Typography variant="body2" color="text.secondary">
                    {value > 0 ? value.toFixed(1) : 'No rating'}
                </Typography>
            )}
        </Stack>
    );
}
