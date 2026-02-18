import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Alert, CircularProgress } from '@mui/material';

export default function AssemblyPolygonUpload({ open, onClose, onSuccess }) {
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
            const geoJsonData = JSON.parse(text);

            const token = localStorage.getItem('serviceToken');
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies/upload-polygon`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(geoJsonData)
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    message: data.message,
                    errors: data.errors
                });
                if (onSuccess) onSuccess();
            } else {
                setResult({
                    success: false,
                    message: data.message || 'Upload failed',
                    errors: data.errors
                });
            }
        } catch (error) {
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
            <DialogTitle>Upload Assembly Polygons</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Upload a GeoJSON file containing assembly polygons. The file should have AC_NO or name properties to match existing assemblies.
                    </Typography>

                    <Button variant="outlined" component="label" fullWidth>
                        {file ? file.name : 'Select GeoJSON File'}
                        <input type="file" hidden accept=".json,.geojson" onChange={handleFileChange} />
                    </Button>

                    {result && (
                        <Alert severity={result.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                            {result.message}
                            {result.errors && result.errors.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption">Errors:</Typography>
                                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                                        {result.errors.slice(0, 5).map((error, index) => (
                                            <li key={index}>
                                                <Typography variant="caption">{error}</Typography>
                                            </li>
                                        ))}
                                        {result.errors.length > 5 && (
                                            <li>
                                                <Typography variant="caption">... and {result.errors.length - 5} more</Typography>
                                            </li>
                                        )}
                                    </ul>
                                </Box>
                            )}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={uploading}>
                    Close
                </Button>
                <Button variant="contained" onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? <CircularProgress size={20} /> : 'Upload'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
