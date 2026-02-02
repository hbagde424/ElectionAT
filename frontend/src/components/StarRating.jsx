import { Stack, Rating, Typography } from '@mui/material';
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
                icon={<Star1 variant="Bold" />}
                emptyIcon={<Star1 variant="Outline" />}
            />
            {showLabel && (
                <Typography variant="body2" color="text.secondary">
                    {value > 0 ? value.toFixed(1) : 'No rating'}
                </Typography>
            )}
        </Stack>
    );
}
