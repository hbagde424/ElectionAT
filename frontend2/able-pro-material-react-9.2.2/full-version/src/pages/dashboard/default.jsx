import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';

// Material-UI components
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

// Charts & Widgets
import EcommerceDataCard from 'components/cards/statistics/EcommerceDataCard';
import EcommerceDataChart from 'sections/widget/chart/EcommerceDataChart';
import RepeatCustomerRate from 'sections/widget/chart/RepeatCustomerRate';
import ProjectOverview from 'sections/widget/chart/ProjectOverview';
import ProjectRelease from 'sections/dashboard/default/ProjectRelease';
import AssignUsers from 'sections/widget/statistics/AssignUsers';
import Transactions from 'sections/widget/data/Transactions';
import TotalIncome from 'sections/widget/chart/TotalIncome';
import WelcomeBanner from 'sections/dashboard/default/WelcomeBanner';

// Icons
import { Eye, EyeSlash } from 'iconsax-react';

// Form & validation
import * as Yup from 'yup';
import { Formik } from 'formik';

// Custom hooks and utilities
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';
import axios from 'utils/axios';
import { fetcher } from 'utils/axios';
import { preload } from 'swr';

// Assets & Styles
import geoJsonData from './Polygons_FeaturesToJSON1.json';
import './Map.css';

// Icons
import { ArrowDown, ArrowUp, Book, Calendar, CloudChange, Wallet3 } from 'iconsax-react';

export default function DashboardDefault() {
  const [constituencies, setConstituencies] = useState([]);
  const [hoveredConstituency, setHoveredConstituency] = useState(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [checked, setChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const theme = useTheme();




  useEffect(() => {
    // You may want to call fetchPolygons on mount or after login
    fetchPolygons();
  }, []);

  const navigate = useNavigate(); // Add this hook

  // Add auth hooks
  const { isLoggedIn, login } = useAuth();
  const scriptedRef = useScriptRef();

  // Add useEffect to handle redirection when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchPolygons();
      // navigate('/map'); // Redirect to dashboard when logged in
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
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      <Grid item xs={12}>
        <WelcomeBanner />
      </Grid>

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

      {/* Row 1 */}
      <Grid item xs={12} sm={6} lg={3}>
        <EcommerceDataCard
          title="All Earnings"
          count="$3000"
          iconPrimary={<Wallet3 />}
          percentage={
            <Typography color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowUp size={16} style={{ transform: 'rotate(45deg)' }} /> 30.6%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.primary.main} />
        </EcommerceDataCard>
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <EcommerceDataCard
          title="Page Views"
          count="290+"
          color="warning"
          iconPrimary={<Book color={theme.palette.warning.dark} />}
          percentage={
            <Typography color="warning.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowDown size={16} style={{ transform: 'rotate(-45deg)' }} /> 30.6%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.warning.dark} />
        </EcommerceDataCard>
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <EcommerceDataCard
          title="Total Task"
          count="1,568"
          color="success"
          iconPrimary={<Calendar color={theme.palette.success.darker} />}
          percentage={
            <Typography color="success.darker" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowUp size={16} style={{ transform: 'rotate(45deg)' }} /> 30.6%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.success.darker} />
        </EcommerceDataCard>
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <EcommerceDataCard
          title="Download"
          count="$200"
          color="error"
          iconPrimary={<CloudChange color={theme.palette.error.dark} />}
          percentage={
            <Typography color="error.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowDown size={16} style={{ transform: 'rotate(45deg)' }} /> 30.6%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.error.dark} />
        </EcommerceDataCard>
      </Grid>

      {/* Row 2 */}
      <Grid item xs={12} md={8} lg={9}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <RepeatCustomerRate />
          </Grid>
          <Grid item xs={12}>
            <ProjectOverview />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} md={4} lg={3}>
        <Stack spacing={3}>
          <ProjectRelease />
          <AssignUsers />
        </Stack>
      </Grid>

      {/* Row 3 */}
      <Grid item xs={12} md={6}>
        <Transactions />
      </Grid>
      <Grid item xs={12} md={6}>
        <TotalIncome />
      </Grid>
    </Grid>
  );
}
