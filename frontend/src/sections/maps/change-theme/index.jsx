import PropTypes from 'prop-types';
import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';

// third-party
import Map, { Source, Layer, Popup } from 'react-map-gl';

// project-imports
import ControlPanel from './control-panel';
import MapControl from 'components/third-party/map/MapControl';

// ==============================|| MAPBOX - HIERARCHICAL MAP ||============================== //

function ChangeTheme({ themes, ...other }) {
  const theme = useTheme();
  const [selectTheme, setSelectTheme] = useState('satellite');
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [currentLevel, setCurrentLevel] = useState('state');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [popupInfo, setPopupInfo] = useState(null);
  const mapRef = useRef(null);

  // Load initial state data
  useEffect(() => {
    loadStateData();
  }, []);

  const loadStateData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/state-polygons`);
      if (!response.ok) throw new Error('Failed to fetch state data');
      const data = await response.json();

      if (data.success && data.data?.length > 0) {
        setGeoJsonData(data.data[0]);
        setCurrentLevel('state');
        setSelectedFeature(null);
        setNavigationHistory([]);
      }
    } catch (error) {
      console.error('Error loading state data:', error);
    }
  };

  const loadDivisionData = async (stateId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/division-polygons`);
      if (!response.ok) throw new Error('Failed to fetch division data');
      const data = await response.json();

      if (data.features?.length > 0) {
        setGeoJsonData(data);
        setCurrentLevel('division');
      }
    } catch (error) {
      console.error('Error loading division data:', error);
    }
  };

  const loadParliamentaryData = async (divisionName) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-polygons/name/${divisionName}`);
      if (!response.ok) throw new Error('Failed to fetch parliamentary data');
      const data = await response.json();

      if (data?.length > 0 && data[0].features) {
        setGeoJsonData(data[0]);
        setCurrentLevel('parliamentary');
      }
    } catch (error) {
      console.error('Error loading parliamentary data:', error);
    }
  };

  const loadAssemblyData = async (vsCode) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/assembly-polygons/parliament/${vsCode}`);
      if (!response.ok) throw new Error('Failed to fetch assembly data');
      const data = await response.json();

      if (data?.data?.[0]?.features) {
        setGeoJsonData(data.data[0]);
        setCurrentLevel('assembly');
      }
    } catch (error) {
      console.error('Error loading assembly data:', error);
    }
  };

  const loadBlockData = async (assemblyId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/block-polygons/booth/${assemblyId}`);
      if (!response.ok) throw new Error('Failed to fetch block data');
      const data = await response.json();

      if (data.success && data.data?.length > 0) {
        setGeoJsonData(data.data[0]);
        setCurrentLevel('block');
      }
    } catch (error) {
      console.error('Error loading block data:', error);
    }
  };

  const loadBoothData = async (BlockNumber) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${BlockNumber}`);
      if (!response.ok) throw new Error('Failed to fetch booth data');
      const data = await response.json();

      if (data.success && data.features) {
        setGeoJsonData(data);
        setCurrentLevel('booth');
      }
    } catch (error) {
      console.error('Error loading booth data:', error);
    }
  };

  const handleFeatureClick = (e) => {
    if (!e.features?.length) return;
    const feature = e.features[0];
    setSelectedFeature(feature);
    setPopupInfo({
      longitude: e.lngLat.lng,
      latitude: e.lngLat.lat,
      properties: feature.properties
    });

    // Store current state in history before changing
    setNavigationHistory(prev => [...prev, {
      level: currentLevel,
      feature: selectedFeature,
      id: feature.properties.id,
      name: feature.properties.name
    }]);

    // Drill down based on current level
    switch (currentLevel) {
      case 'state':
        loadDivisionData(feature.properties.id);
        break;
      case 'division':
        loadParliamentaryData(feature.properties.name);
        break;
      case 'parliamentary':
        loadAssemblyData(feature.properties.pcNo);
        break;
      case 'assembly':
        loadBlockData(feature.properties.acNo);
        break;
      case 'block':
        const BlockNumber = feature.properties.BlockNumber || feature.properties.blockCode;
        if (BlockNumber) loadBoothData(BlockNumber);
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    if (navigationHistory.length > 0) {
      const previousState = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));

      switch (previousState.level) {
        case 'state':
          loadStateData();
          break;
        case 'division':
          loadDivisionData(previousState.id);
          break;
        case 'parliamentary':
          loadParliamentaryData(previousState.name);
          break;
        case 'assembly':
          loadAssemblyData(previousState.id);
          break;
        case 'block':
          loadBlockData(previousState.id);
          break;
        default:
          break;
      }
    }
  };

  const getLayerStyle = (level) => {
    const baseStyle = {
      'fill-opacity': 0.5,
      'fill-outline-color': theme.palette.text.primary,
      'fill-antialias': true
    };

    switch (level) {
      case 'state':
        return {
          ...baseStyle,
          'fill-color': theme.palette.primary.main,
          'fill-opacity': 0.3
        };
      case 'division':
        return {
          ...baseStyle,
          'fill-color': [
            'match',
            ['get', 'name'],
            'BHOPAL', '#ff0000',
            'CHAMBAL', '#00ffee',
            'GWALIOR', '#00d0ff',
            'INDORE', '#00fc86',
            'JABALPUR', '#ff0000',
            'NARMADAPURAM', '#b200f8',
            'REWA', '#ffcc00',
            'SAGAR', '#ff7700',
            'SHAHDOL', '#00ff6a',
            'UJJAIN', '#0086df',
            '#3388ff'
          ],
          'fill-opacity': 0.4
        };
      case 'parliamentary':
        return {
          ...baseStyle,
          'fill-color': theme.palette.error.main,
          'fill-opacity': 0.3
        };
      case 'assembly':
        return {
          ...baseStyle,
          'fill-color': theme.palette.warning.main,
          'fill-opacity': 0.4
        };
      case 'block':
        return {
          ...baseStyle,
          'fill-color': theme.palette.success.main,
          'fill-opacity': 0.5
        };
      case 'booth':
        return {
          ...baseStyle,
          'fill-color': theme.palette.info.main,
          'fill-opacity': 0.7
        };
      default:
        return baseStyle;
    }
  };

  const generatePopupContent = (properties, level) => {
    let content = `<div><strong>${properties.name || ''}</strong>`;

    switch (level) {
      case 'state':
        content += `<p>State: ${properties.Name || ''}</p>`;
        break;
      case 'division':
        content += `<p>Division: ${properties.name || ''}</p>`;
        if (properties.districts) {
          content += `<p>Districts: ${properties.districts.join(', ')}</p>`;
        }
        break;
      case 'parliamentary':
        content += `<p>Parliamentary: ${properties.name || ''}</p>`;
        break;
      case 'assembly':
        content += `<p>Assembly: ${properties.name || ''}</p>`;
        break;
      case 'block':
        content += `<p>Block: ${properties.name || ''}</p>`;
        break;
      case 'booth':
        content += `<p>Booth: ${properties.name || ''}</p>`;
        break;
    }

    content += `<p style="color:#666;font-size:0.8em">Click to zoom in</p></div>`;
    return content;
  };

  const handleChangeTheme = useCallback((value) => setSelectTheme(value), []);

  return (
    <>
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 23.4707,
          longitude: 77.9455,
          zoom: 6,
          bearing: 0,
          pitch: 0
        }}
        mapStyle={themes?.[selectTheme]}
        interactiveLayerIds={['data']}
        onClick={handleFeatureClick}
        {...other}
      >
        <MapControl />

        {geoJsonData && (
          <Source type="geojson" data={geoJsonData}>
            <Layer
              id="data"
              type="fill"
              paint={getLayerStyle(currentLevel)}
            />
            <Layer
              id="outline"
              type="line"
              paint={{
                'line-color': theme.palette.text.primary,
                'line-width': currentLevel === 'booth' ? 1 : 2
              }}
            />
          </Source>
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            closeButton={false}
            onClose={() => setPopupInfo(null)}
            anchor="bottom"
          >
            <div dangerouslySetInnerHTML={{
              __html: generatePopupContent(popupInfo.properties, currentLevel)
            }} />
          </Popup>
        )}
      </Map>

      <ControlPanel themes={themes} selectTheme={selectTheme} onChangeTheme={handleChangeTheme} />

      {/* Navigation controls */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={handleBack}
          disabled={navigationHistory.length === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: navigationHistory.length === 0 ? '#ccc' : theme.palette.primary.main,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: navigationHistory.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ← Back
        </button>
        <button
          onClick={loadStateData}
          disabled={currentLevel === 'state'}
          style={{
            padding: '8px 16px',
            backgroundColor: currentLevel === 'state' ? '#ccc' : theme.palette.secondary.main,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: currentLevel === 'state' ? 'not-allowed' : 'pointer'
          }}
        >
          Reset to State
        </button>
        {selectedFeature && (
          <div style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: '4px',
            marginLeft: '10px'
          }}>
            Current: {selectedFeature.properties.name} ({currentLevel})
          </div>
        )}
      </div>
    </>
  );
}

export default memo(ChangeTheme);

ChangeTheme.propTypes = { themes: PropTypes.object, other: PropTypes.any };
