// Test component to verify API URL configuration
import React, { useState } from 'react';
import { Button, Typography, Box, Alert } from '@mui/material';

const ApiUrlTest = () => {
    const [testResult, setTestResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const testApiUrl = async () => {
        setIsLoading(true);
        setTestResult(null);

        try {
            // Test the environment variable
            const apiUrl = import.meta.env.VITE_APP_API_URL;

            // Test a simple API call
            const testEndpoint = `${apiUrl}/states`;

            const response = await fetch(testEndpoint);

            if (response.ok) {
                const data = await response.json();
                setTestResult({
                    success: true,
                    message: `API connection successful! Found ${data.length || 0} states.`,
                    url: testEndpoint,
                    data: data
                });
            } else {
                setTestResult({
                    success: false,
                    message: `API call failed with status: ${response.status}`,
                    url: testEndpoint,
                    error: response.statusText
                });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: 'API connection failed',
                url: `${import.meta.env.VITE_APP_API_URL}/states`,
                error: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 600 }}>
            <Typography variant="h5" gutterBottom>
                API URL Configuration Test
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
                Environment Variable: <code>{import.meta.env.VITE_APP_API_URL}</code>
            </Typography>

            <Button
                variant="contained"
                onClick={testApiUrl}
                disabled={isLoading}
                sx={{ mb: 2 }}
            >
                {isLoading ? 'Testing...' : 'Test API Connection'}
            </Button>

            {testResult && (
                <Alert
                    severity={testResult.success ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                >
                    <Typography variant="body2">
                        <strong>URL:</strong> {testResult.url}
                    </Typography>
                    <Typography variant="body2">
                        <strong>Result:</strong> {testResult.message}
                    </Typography>
                    {testResult.error && (
                        <Typography variant="body2">
                            <strong>Error:</strong> {testResult.error}
                        </Typography>
                    )}
                </Alert>
            )}

            {testResult?.success && testResult.data && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Sample Data:</Typography>
                    <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
                        {JSON.stringify(testResult.data.slice(0, 3), null, 2)}
                    </pre>
                </Box>
            )}
        </Box>
    );
};

export default ApiUrlTest;
