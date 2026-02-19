import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Typography, Alert, CircularProgress, List, ListItem, ListItemText
} from '@mui/material';

export default function ParliamentPolygonUpload({ open, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a GeoJSON file');
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            const text = await file.text();
            const geoJson = JSON.parse(text);

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments/upload-polygon`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(geoJson)
            });

            const data = await res.json();

            if (res.ok) {
                setResult({
                    success: true,
                    message: data.message,
                    errors: data.errors || []
                });
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setResult({
                    success: false,
                    message: data.message || 'Upload failed',
                    errors: data.errors || []
                });
            }
        } catch (error) {
            console.error('Error uploading polygon:', error);
            setResult({
                success: false,
                message: error.message || 'Failed to upload polygon'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResult(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Upload Parliament Polygons</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Upload a GeoJSON file containing parliament polygon data. The file should be a FeatureCollection or Feature with properties including parliament_no or name.
                    </Typography>

                    <Button variant="outlined" component="label" fullWidth>
                        {file ? file.name : 'Select GeoJSON File'}
                        <input type="file" hidden accept=".json,.geojson" onChange={handleFileChange} />
                    </Button>

                    {result && (
                        <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                            {result.message}
                            {result.errors && result.errors.length > 0 && (
                                <List dense sx={{ mt: 1 }}>
                                    {result.errors.slice(0, 5).map((error, index) => (
                                        <ListItem key={index} sx={{ py: 0 }}>
                                            <ListItemText
                                                primary={typeof error === 'string' ? error : error.message || JSON.stringify(error)}
                                                primaryTypographyProps={{ variant: 'caption' }}
                                            />
                                        </ListItem>
                                    ))}
                                    {result.errors.length > 5 && (
                                        <ListItem sx={{ py: 0 }}>
                                            <ListItemText
                                                primary={`... and ${result.errors.length - 5} more errors`}
                                                primaryTypographyProps={{ variant: 'caption' }}
                                            />
                                        </ListItem>
                                    )}
                                </List>
                            )}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={uploading}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    startIcon={uploading ? <CircularProgress size={20} /> : null}
                >
                    {uploading ? 'Uploading...' : 'Upload'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
