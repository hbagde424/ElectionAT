// material-ui
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

// ==============================|| MAP BOX - CONTAINER STYLED ||============================== //

const MapContainerStyled = styled(Box)({
  zIndex: 0,
  height: 576,
  overflow: 'hidden',
  position: 'relative',
  borderRadius: 4,
  '& .mapboxgl-ctrl-logo, .mapboxgl-ctrl-bottom-right': {
    display: 'none'
  },
  '& .mapboxgl-ctrl-attrib, .maplibregl-ctrl-attrib': {
    display: 'none !important'
  },
  '& a': {
    pointerEvents: 'none !important',
    cursor: 'default !important'
  },
  '& .mapboxgl-map a, & .maplibregl-map a': {
    pointerEvents: 'none !important'
  }
});

export default MapContainerStyled;

