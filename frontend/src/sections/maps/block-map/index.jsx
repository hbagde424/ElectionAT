import PropTypes from 'prop-types';
import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { Box, Typography, CircularProgress } from '@mui/material';

function BlockMap({ themes, onRegionClick, ...other }) {
  const theme = useTheme();
  const [selectTheme, setSelectTheme] = useState('outdoors');
  const [blockData, setBlockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/block-polygons`);
        if (!res.ok) throw new Error('Failed to fetch block polygons');
        const data = await res.json();
        // Merge all documents' features into a single FeatureCollection
        const features = [];
        if (Array.isArray(data.data)) {
          data.data.forEach(doc => {
            if (doc && doc.features && Array.isArray(doc.features)) {
              features.push(...doc.features);
            }
          });
        }
        setBlockData({ type: 'FeatureCollection', features });
      } catch (e) {
        console.error('BlockMap error:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBlocks();
  }, []);

  const handleFeatureClick = async (e) => {
    if (!e.features?.length) return;
    const feature = e.features[0];
    const props = feature.properties || {};
    setPopupInfo({
      longitude: e.lngLat.lng,
      latitude: e.lngLat.lat,
      properties: props
    });

    // Try to resolve block _id by searching blocks API and trigger onRegionClick
    if (onRegionClick) {
      try {
        const blockName = props.BlockName || props.Name || props.name || '';
        if (blockName) {
          const resp = await fetch(`${import.meta.env.VITE_APP_API_URL}/blocks?search=${encodeURIComponent(blockName)}`);
          if (resp.ok) {
            const body = await resp.json();
            const arr = Array.isArray(body.data) ? body.data : [];
            const best = arr.find(b => (b.name || '').toLowerCase() === blockName.toLowerCase()) || arr[0];
            const id = best?._id || best?.id || null;
            if (id) {
              onRegionClick({ level: 'block', id });
            }
          }
        }
      } catch (err) {
        console.warn('Could not resolve block id for onRegionClick', err);
      }
    }
  };

  const getLayerStyle = {
    'fill-color': theme.palette.success.main,
    'fill-opacity': 0.45,
    'fill-outline-color': '#000000',
    'fill-antialias': true
  };

  const labelLayout = {
    'text-field': [
      'coalesce',
      ['get', 'BlockName'],
      ['get', 'Name'],
      ['get', 'name'],
      ''
    ],
    'text-size': 10,
    'text-allow-overlap': false,
    'text-anchor': 'center',
    'text-justify': 'center'
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <Map
        ref={mapRef}
        initialViewState={{ latitude: 23.4707, longitude: 77.9455, zoom: 6.5 }}
        mapStyle={themes?.[selectTheme]}
        interactiveLayerIds={['block-layer']}
        onClick={handleFeatureClick}
        {...other}
      >
        <MapControl />
        <Source id="india-source" type="geojson" data="/india.geojson">
          <Layer id="india-fill" type="fill" paint={{ 'fill-color': '#e0e0e0', 'fill-opacity': 0.07 }} />
          <Layer id="india-outline" type="line" paint={{ 'line-color': '#003366', 'line-width': 1 }} />
        </Source>

        {blockData && (
          <Source id="block-source" type="geojson" data={blockData}>
            <Layer id="block-layer" type="fill" paint={getLayerStyle} />
            <Layer id="block-outline" type="line" paint={{ 'line-color': '#000000', 'line-width': 1 }} />
            <Layer id="block-labels" type="symbol" layout={labelLayout} paint={{ 'text-color': '#000' }} />
          </Source>
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            closeButton={true}
            onClose={() => setPopupInfo(null)}
            anchor="bottom"
          >
            <div style={{ minWidth: 220 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>{popupInfo.properties.BlockName || popupInfo.properties.Name || 'Block'}</h4>
              {popupInfo.properties.AC_NAME && <p style={{ margin: 0 }}><strong>Assembly:</strong> {popupInfo.properties.AC_NAME}</p>}
              {popupInfo.properties.DIST_NAME && <p style={{ margin: 0 }}><strong>District:</strong> {popupInfo.properties.DIST_NAME}</p>}
              {popupInfo.properties.DIVISION_NAME && <p style={{ margin: 0 }}><strong>Division:</strong> {popupInfo.properties.DIVISION_NAME}</p>}
              <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>Clicking filtered lists to this block.</p>
            </div>
          </Popup>
        )}

        {loading && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" sx={{ mt: 2 }}>Loading Blocks...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, backgroundColor: 'rgba(255,0,0,0.15)', padding: 2, borderRadius: 1 }}>
            <Typography color="error">Error: {error}</Typography>
          </Box>
        )}
      </Map>
    </Box>
  );
}

export default memo(BlockMap);

BlockMap.propTypes = {
  themes: PropTypes.object,
  onRegionClick: PropTypes.func,
  other: PropTypes.any
};
