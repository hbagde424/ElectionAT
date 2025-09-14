import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl, Box,
    FormControlLabel, Switch
} from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function FAQModal({
    open,
    modalToggler,
    faq,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'General Questions',
        is_active: true,
        order_index: 0
    });
    const [submitted, setSubmitted] = useState(false);

    const categoryOptions = [
        'General Questions',
        'Account & Login',
        'Data & Analytics',
        'Technical Support',
        'Other'
    ];

    useEffect(() => {
        if (faq) {
            setFormData({
                question: faq.question || '',
                answer: faq.answer || '',
                category: faq.category || 'General Questions',
                is_active: faq.is_active !== undefined ? faq.is_active : true,
                order_index: faq.order_index || 0
            });
        } else {
            setFormData({
                question: '',
                answer: '',
                category: 'General Questions',
                is_active: true,
                order_index: 0
            });
        }
    }, [faq]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAnswerChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            answer: value
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);

        // Validation
        if (!formData.question || !formData.answer) {
            return;
        }

        const method = faq ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = faq
            ? `${import.meta.env.VITE_APP_API_URL}/faqs/${faq._id}`
            : `${import.meta.env.VITE_APP_API_URL}/faqs`;

        // Get user ID from context or localStorage
        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = faq ? { updated_by: userId } : { created_by: userId };
        const submitData = {
            ...formData,
            ...userTracking,
            order_index: parseInt(formData.order_index) || 0,
            answer: typeof formData.answer === 'string' ? formData.answer : ''
        };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (res.ok) {
                modalToggler(false);
                refresh();
            } else {
                const errorData = await res.json();
                console.error('Failed to submit FAQ:', errorData);
                alert('Failed to save FAQ. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting FAQ:', error);
            alert('An error occurred while saving the FAQ.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{faq ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>

                    {/* Question */}
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Question <span style={{ color: 'red' }}>*</span></InputLabel>
                            <TextField
                                name="question"
                                value={formData.question}
                                onChange={handleChange}
                                fullWidth
                                required
                                multiline
                                rows={2}
                                error={submitted && !formData.question}
                                helperText={submitted && !formData.question ? 'Question is required' : ''}
                                placeholder="Enter the FAQ question"
                            />
                        </Stack>
                    </Grid>

                    {/* Category and Order */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Category <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth required>
                                <Select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    {categoryOptions.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Order Index</InputLabel>
                            <TextField
                                name="order_index"
                                value={formData.order_index}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                inputProps={{ min: 0 }}
                                placeholder="Display order (0 for default)"
                            />
                        </Stack>
                    </Grid>

                    {/* Status Toggle */}
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    color="primary"
                                />
                            }
                            label="Active Status"
                        />
                    </Grid>

                    {/* Answer (Rich Text) */}
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Answer <span style={{ color: 'red' }}>*</span></InputLabel>
                            <ReactQuill
                                theme="snow"
                                value={formData.answer}
                                onChange={handleAnswerChange}
                                placeholder="Enter the detailed answer (supports HTML formatting)"
                                style={{ minHeight: 200 }}
                                modules={{
                                    toolbar: [
                                        [{ 'header': [1, 2, 3, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                        [{ 'color': [] }, { 'background': [] }],
                                        ['link', 'code-block'],
                                        ['clean']
                                    ]
                                }}
                            />
                            {submitted && !formData.answer && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>
                                    Answer is required
                                </Box>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {faq ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}