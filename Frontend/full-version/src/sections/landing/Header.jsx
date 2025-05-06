import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import geoJsonData from './Polygons_FeaturesToJSON1.json';
import './Map.css';

// Material-UI imports
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import { Eye, EyeSlash } from 'iconsax-react';
import * as Yup from 'yup';
import { Formik } from 'formik';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

// Add these imports from your first component
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';
import { preload } from 'swr';
import { fetcher } from 'utils/axios';
// Add these imports
import axios from 'utils/axios';
const IndiaElectionMap = () => {
    const [constituencies, setConstituencies] = useState([]);
    const [hoveredConstituency, setHoveredConstituency] = useState(null);
    const [showLoginPopup, setShowLoginPopup] = useState(false);
    const [checked, setChecked] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate(); // Add this hook

    // Add auth hooks
    const { isLoggedIn, login } = useAuth();
    const scriptedRef = useScriptRef();

    // Add useEffect to handle redirection when logged in
    useEffect(() => {
        if (isLoggedIn) {
            fetchPolygons();
            navigate('/map'); // Redirect to dashboard when logged in
        }
    }, [isLoggedIn, navigate]);

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };



    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    // Function to generate consistent color for each state
    const getColorForState = (stateName) => {
        let hash = 0;
        for (let i = 0; i < stateName.length; i++) {
            hash = stateName.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }

        const hue = Math.abs(hash) % 360;
        const saturation = 60 + Math.abs(hash) % 30;
        const lightness = 40 + Math.abs(hash) % 30;

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    useEffect(() => {
        if (!geoJsonData?.features) return;

        const stateColorMap = {};
        geoJsonData.features.forEach(feature => {
            const props = feature.attributes || {};
            const popupInfo = props.PopupInfo || "";

            const popupData = {};
            popupInfo.split("<br>").forEach(line => {
                const [key, value] = line.split(": ").map(s => s.trim());
                if (key && value) popupData[key] = value;
            });

            const stateName = popupData.ST_NAME || props.ST_NAME || "Unknown";
            if (!stateColorMap[stateName]) {
                stateColorMap[stateName] = getColorForState(stateName);
            }
        });

        const processedData = geoJsonData.features.map(feature => {
            const props = feature.attributes || {};
            const popupInfo = props.PopupInfo || "";

            const popupData = {};
            popupInfo.split("<br>").forEach(line => {
                const [key, value] = line.split(": ").map(s => s.trim());
                if (key && value) popupData[key] = value;
            });

            const rings = feature.geometry?.rings || [];
            const svgPaths = rings.map(ring => {
                const points = ring.map(coord => {
                    const scaleFactor = 30;
                    const x = (coord[0] - 68) * scaleFactor;
                    const y = (1000 - (coord[1] - 8) * scaleFactor);
                    return `${x},${y}`;
                });
                return `M ${points.join(" L ")} Z`;
            });

            const stateName = popupData.ST_NAME || props.ST_NAME || "Unknown";

            return {
                id: props.PC_CODE || props.OID || Math.random().toString(36).substring(2),
                name: popupData.PC_NAME || props.PC_NAME || "Unknown",
                state: stateName,
                st_code: popupData.ST_CODE || "N/A",
                pc_code: popupData.PC_CODE || "N/A",
                res: popupData.Res || "N/A",
                oid: props.OID,
                folderPath: props.FolderPath,
                shape_length: props.Shape_Length,
                shape_area: props.Shape_Area,
                paths: svgPaths,
                color: stateColorMap[stateName]
            };
        });

        setConstituencies(processedData);
    }, []);

    const handleLogin = async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
            const response = await axios.post('/auth/login', {
                email: values.email,
                password: values.password
            });

            // Call your auth context login
            await login(response.data.token, response.data.user);

            if (scriptedRef.current) {
                setStatus({ success: true });
                setSubmitting(false);
                setShowLoginPopup(false);

                // Fetch polygons after login
                fetchPolygons();
            }
        } catch (err) {
            console.error(err);
            if (scriptedRef.current) {
                setStatus({ success: false });
                setErrors({ submit: err.response?.data?.message || 'Login failed' });
                setSubmitting(false);
            }
        }
    };


    // Add this function to fetch polygons
    const fetchPolygons = async () => {
        try {
            const response = await axios.get('/map/polygons');
            const polygons = response.data.data;

            // Process the polygons to match your frontend format
            const processedData = polygons.map(polygon => {
                // Convert the GeoJSON coordinates to your SVG path format
                const paths = polygon.geometry.coordinates.map(ring => {
                    const points = ring.map(coord => {
                        const scaleFactor = 30;
                        const x = (coord[0] - 68) * scaleFactor;
                        const y = (1000 - (coord[1] - 8) * scaleFactor);
                        return `${x},${y}`;
                    });
                    return `M ${points.join(" L ")} Z`;
                });

                return {
                    id: polygon.properties.id,
                    name: polygon.properties.name,
                    state: polygon.properties.state || "Unknown",
                    paths: paths,
                    color: getColorForState(polygon.properties.state || "Unknown")
                    // Add other properties as needed
                };
            });

            setConstituencies(processedData);
        } catch (err) {
            console.error('Error fetching polygons:', err);
        }
    };

    return (
        <div className="app-container">
            {/* Map Container */}
            <div className="map-container">
                <svg viewBox="0 0 800 1000" className="map-svg">
                    {constituencies.map((constituency) => (
                        <path
                            key={constituency.id}
                            className={`map-path ${hoveredConstituency?.id === constituency.id ? 'hovered' : ''}`}
                            d={constituency.paths[0]}
                            fill={constituency.color}
                            onMouseEnter={() => setHoveredConstituency(constituency)}
                            onMouseLeave={() => setHoveredConstituency(null)}
                            onClick={() => setShowLoginPopup(true)}
                        />
                    ))}
                </svg>

                {/* Info Box */}
                {hoveredConstituency && (
                    <div className="info-box">
                        <strong>{hoveredConstituency.name}</strong><br />
                        <b>State:</b> {hoveredConstituency.state}<br />
                        <b>ST Code:</b> {hoveredConstituency.st_code}<br />
                        <b>PC Code:</b> {hoveredConstituency.pc_code}<br />
                        <b>Reserved:</b> {hoveredConstituency.res}<br />
                        <b>OID:</b> {hoveredConstituency.oid}<br />
                        <b>Shape Length:</b> {hoveredConstituency.shape_length}<br />
                        <b>Shape Area:</b> {hoveredConstituency.shape_area}
                    </div>
                )}
            </div>

            {/* Login Popup using Material-UI Dialog */}
            <Dialog open={showLoginPopup} onClose={() => setShowLoginPopup(false)}>
                <DialogTitle>Login</DialogTitle>
                <DialogContent>
                    <Formik
                        initialValues={{ email: 'info@phoenixcoded.co', password: '123456', submit: null }}
                        validationSchema={Yup.object().shape({
                            email: Yup.string().email('Must be a valid email').max(255).required('Email is required'),
                            password: Yup.string().max(255).required('Password is required')
                        })}
                        onSubmit={handleLogin}
                    >
                        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
                            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Stack spacing={1}>
                                            <InputLabel htmlFor="email-login">Email Address</InputLabel>
                                            <OutlinedInput
                                                id="email-login"
                                                type="email"
                                                value={values.email}
                                                name="email"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                placeholder="Enter email address"
                                                fullWidth
                                                error={Boolean(touched.email && errors.email)}
                                            />
                                        </Stack>
                                        {touched.email && errors.email && (
                                            <FormHelperText error id="standard-weight-helper-text-email-login">
                                                {errors.email}
                                            </FormHelperText>
                                        )}
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Stack spacing={1}>
                                            <InputLabel htmlFor="password-login">Password</InputLabel>
                                            <OutlinedInput
                                                fullWidth
                                                error={Boolean(touched.password && errors.password)}
                                                id="password-login"
                                                type={showPassword ? 'text' : 'password'}
                                                value={values.password}
                                                name="password"
                                                onBlur={handleBlur}
                                                onChange={handleChange}
                                                endAdornment={
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="toggle password visibility"
                                                            onClick={handleClickShowPassword}
                                                            onMouseDown={handleMouseDownPassword}
                                                            edge="end"
                                                            color="secondary"
                                                        >
                                                            {showPassword ? <Eye /> : <EyeSlash />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                }
                                                placeholder="Enter password"
                                            />
                                        </Stack>
                                        {touched.password && errors.password && (
                                            <FormHelperText error id="standard-weight-helper-text-password-login">
                                                {errors.password}
                                            </FormHelperText>
                                        )}
                                    </Grid>

                                    <Grid item xs={12} sx={{ mt: -1 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={checked}
                                                        onChange={(event) => setChecked(event.target.checked)}
                                                        name="checked"
                                                        color="primary"
                                                        size="small"
                                                    />
                                                }
                                                label={<Typography variant="body2">Keep me signed in</Typography>}
                                            />
                                            <Link variant="body2" href="#" color="text.primary">
                                                Forgot Password?
                                            </Link>
                                        </Stack>
                                    </Grid>
                                    {errors.submit && (
                                        <Grid item xs={12}>
                                            <FormHelperText error>{errors.submit}</FormHelperText>
                                        </Grid>
                                    )}
                                    <Grid item xs={12}>
                                        <Button
                                            disableElevation
                                            disabled={isSubmitting}
                                            fullWidth
                                            size="large"
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                        >
                                            Login
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Formik>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default IndiaElectionMap;