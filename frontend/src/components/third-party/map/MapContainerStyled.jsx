// material-ui
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

// ==============================|| MAP BOX - CONTAINER STYLED ||============================== //

const MapContainerStyled = styled(Box)(() => ({
  zIndex: 0,
  // Allow the parent container to control the map height (responsive).
  // Use 100% so Map fills the parent Box; provide a sensible minHeight for fallbacks.
  height: '100%',
  minHeight: 400,
  width: '100%',
  overflow: 'hidden',
  position: 'relative',
  borderRadius: 4,
  '& .mapboxgl-ctrl-logo, .mapboxgl-ctrl-bottom-right': {
    display: 'none'
  }
}));

export default MapContainerStyled;

