import { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Stack,
    Paper,
    LinearProgress
} from '@mui/material';
import { DocumentUpload, TickCircle, CloseCircle } from 'iconsax-react';

export default function DivisionPolygonUpload({ open, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type
        if (!selectedFile.name.endsWith('.json')) {
            setError('Please select a valid JSON file');
            setFile(null);
            return;
        }

        // Validate file size (max 10MB)
        if (selectedFile.size > 50 * 1024 * 1024) { // Increased to 50MB matching backend
            setError('File size must be less than 50MB');
            setFile(null);
            return;
        }

        setFile(selectedFile);
        setError('');
    };

    const validateGeoJSON = (data) => {
        // Check required fields
        if (!data.type || data.type !== 'FeatureCollection') {
            throw new Error('Invalid GeoJSON: type must be "FeatureCollection"');
        }

        // Basic validation - names might vary so we skip specific 'name' checks on root object for flexibility
        // if (!data.name || typeof data.name !== 'string') {
        //     throw new Error('Invalid GeoJSON: name field is required and must be a string');
        // }

        if (!Array.isArray(data.features) || data.features.length === 0) {
            throw new Error('Invalid GeoJSON: features array is required and must not be empty');
        }

        // Validate each feature
        data.features.forEach((feature, index) => {
            if (feature.type !== 'Feature') {
                throw new Error(`Feature ${index}: type must be "Feature"`);
            }

            if (!feature.geometry) {
                // Warning only or skip?
                // throw new Error(`Feature ${index}: geometry is required`);
            }

            // if (!feature.properties) {
            //     throw new Error(`Feature ${index}: properties are required`);
            // }
        });

        return true;
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        setUploadProgress(0);

        try {
            // Read file
            const fileContent = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsText(file);
            });

            setUploadProgress(30);

            // Parse JSON
            let geoJsonData;
            try {
                geoJsonData = JSON.parse(fileContent);
            } catch (err) {
                throw new Error('Invalid JSON format: ' + err.message);
            }

            setUploadProgress(50);

            // Validate GeoJSON structure
            validateGeoJSON(geoJsonData);

            setUploadProgress(70);

            // Send to backend
            const token = localStorage.getItem('serviceToken');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(
                `${import.meta.env.VITE_APP_API_URL}/divisions/upload-polygon`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(geoJsonData)
                }
            );

            setUploadProgress(90);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
            }

            const result = await response.json();

            setUploadProgress(100);
            setSuccess(result.message || `✓ Division polygon "${geoJsonData.name || 'File'}" uploaded successfully!`);
            if (result.errors && result.errors.length > 0) {
                setError(`Some polygons failed: ${result.errors.join(', ')}`);
            }
            setFile(null);

            // Reset form after 2 seconds
            setTimeout(() => {
                setFile(null);
                setSuccess('');
                setUploadProgress(0);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                onSuccess?.();
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload polygon data');
            setUploadProgress(0);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setFile(null);
            setError('');
            setSuccess('');
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Upload Division Polygon (GeoJSON)</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 2 }}>
                    {/* File Input */}
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: '2px dashed',
                            borderColor: 'primary.main',
                            backgroundColor: 'action.hover',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                borderColor: 'primary.dark',
                                backgroundColor: 'action.selected'
                            }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            disabled={loading}
                        />
                        <DocumentUpload size={32} color="primary" style={{ marginBottom: 8 }} />
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            {file ? file.name : 'Click to select JSON file'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            or drag and drop a GeoJSON file here
                        </Typography>
                    </Paper>

                    {/* File Info */}
                    {file && (
                        <Box sx={{ p: 2, backgroundColor: 'info.lighter', borderRadius: 1 }}>
                            <Typography variant="body2">
                                <strong>File:</strong> {file.name}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
                            </Typography>
                        </Box>
                    )}

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" icon={<CloseCircle />}>
                            {error}
                        </Alert>
                    )}

                    {/* Success Alert */}
                    {success && (
                        <Alert severity="success" icon={<TickCircle />}>
                            {success}
                        </Alert>
                    )}

                    {/* Progress Bar */}
                    {loading && uploadProgress > 0 && (
                        <Box>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                                {uploadProgress}% - {
                                    uploadProgress < 30 ? 'Reading file...' :
                                        uploadProgress < 50 ? 'Parsing JSON...' :
                                            uploadProgress < 70 ? 'Validating data...' :
                                                uploadProgress < 90 ? 'Uploading...' :
                                                    'Finalizing...'
                                }
                            </Typography>
                        </Box>
                    )}

                    {/* Instructions */}
                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'warning.lighter' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            📋 Expected JSON Format:
                        </Typography>
                        <Typography variant="caption" component="pre" sx={{
                            overflow: 'auto',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace'
                        }}>
                            {`{
  "type": "FeatureCollection",
  "name": "DivisionName",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Polygon", "coordinates": [...] },
      "properties": {
        "DIVNAME": "DivisionName", // or Name, NAME
        ...
      }
    }
  ]
}`}
                        </Typography>
                    </Paper>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleUpload}
                    variant="contained"
                    disabled={!file || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <DocumentUpload />}
                >
                    {loading ? 'Uploading...' : 'Upload'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
