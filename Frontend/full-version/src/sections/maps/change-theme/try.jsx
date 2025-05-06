import PropTypes from 'prop-types';
import { useState, useCallback, useEffect, memo } from 'react';
import Map, { Source, Layer, Popup, NavigationControl, GeolocateControl, ScaleControl } from 'react-map-gl';
import ControlPanel from './control-panel';

import mpData from './madhypradesh.json';
import divisionsData from './mp_divisions.json';
import districtsData from './district.json';
import assembliesData from './assembly.json';

// Mapbox token
const mapboxToken = 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';

function ChangeTheme({ themes, ...other }) {
  const [selectTheme, setSelectTheme] = useState('streets');
  const [geoData, setGeoData] = useState({
    mp: null,
    divisions: null,
    districts: null,
    assemblies: null
  });
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [clickedFeature, setClickedFeature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleChangeTheme = useCallback((value) => setSelectTheme(value), []);

  // Load all JSON data
  useEffect(() => {
    try {
      setGeoData({
        mp: mpData,
        divisions: divisionsData,
        districts: districtsData,
        assemblies: assembliesData
      });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // Safe property access helper
  const getProperty = (feature, propPath, defaultValue = 'N/A') => {
    if (!feature || !feature.properties) return defaultValue;
    return propPath.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : defaultValue), feature.properties);
  };

  // Style functions
  const getMpStyle = () => ({
    type: 'fill',
    paint: {
      'fill-color': 'blue',
      'fill-opacity': 0.5,
      'fill-outline-color': 'blue'
    }
  });

  const getDivisionStyle = () => ({
    type: 'fill',
    paint: {
      'fill-color': selectedDivision ? 'black' : 'orange',
      'fill-opacity': 0.5,
      'fill-outline-color': selectedDivision ? 'black' : 'orange'
    }
  });

  const getDistrictStyle = () => ({
    type: 'fill',
    paint: {
      'fill-color': selectedDistrict ? 'blue' : 'green',
      'fill-opacity': 0.5,
      'fill-outline-color': selectedDistrict ? 'blue' : 'green'
    }
  });

  const getAssemblyStyle = () => ({
    type: 'fill',
    paint: {
      'fill-color': 'red',
      'fill-opacity': 0.5,
      'fill-outline-color': 'red'
    }
  });

  // Event handlers with safe feature access
  const handleFeatureClick = (feature, layerId) => {
    if (!feature || !feature.properties) return;

    switch (layerId) {
      case 'division-layer':
        setSelectedDivision(feature);
        setSelectedDistrict(null);
        setClickedFeature(feature);
        break;
      case 'district-layer':
        setSelectedDistrict(feature);
        setClickedFeature(feature);
        break;
      case 'assembly-layer':
        setClickedFeature(feature);
        break;
      case 'mp-layer':
        setSelectedDivision(null);
        setSelectedDistrict(null);
        setClickedFeature(null);
        break;
      default:
        break;
    }
  };

  // Filter functions with safe property access
  const filterDistricts = (feature) => {
    if (!selectedDivision || !feature.properties) return false;
    return getProperty(feature, 'division') === getProperty(selectedDivision, 'name');
  };

  const filterAssemblies = (feature) => {
    if (!selectedDistrict || !feature.properties) return false;
    return getProperty(feature, 'district') === getProperty(selectedDistrict, 'name');
  };

  // Popup content generators with safe property access
  const getDivisionPopupContent = (feature) => {
    return `<b>Division Details:</b><br>
      <b>Name:</b> ${getProperty(feature, 'id')}<br>
      <b>Name:</b> ${getProperty(feature, 'dtname')}<br>
      <b>State:</b> ${getProperty(feature, 'stname')}<br>
      <b>State Code:</b> ${getProperty(feature, 'stcode11')}<br>
      <b>District Code:</b> ${getProperty(feature, 'dtcode11')}<br>
      <b>Year:</b> ${getProperty(feature, 'year_stat')}<br>
      <b>OBJECTID:</b> ${getProperty(feature, 'OBJECTID')}<br>
      <b>Dist LGD:</b> ${getProperty(feature, 'Dist_LGD')}<br>
      <b>State LGD:</b> ${getProperty(feature, 'State_LGD')}`;
  };

  const getDistrictPopupContent = (feature) => {
    return `<b>District Details:</b><br>
      <b>Name:</b> ${getProperty(feature, 'dtname')}<br>
      <b>State:</b> ${getProperty(feature, 'stname')}<br>
      <b>State Code:</b> ${getProperty(feature, 'stcode11')}<br>
      <b>District Code:</b> ${getProperty(feature, 'dtcode11')}<br>
      <b>Year:</b> ${getProperty(feature, 'year_stat')}<br>
      <b>OBJECTID:</b> ${getProperty(feature, 'OBJECTID')}<br>
      <b>Dist LGD:</b> ${getProperty(feature, 'Dist_LGD')}<br>
      <b>State LGD:</b> ${getProperty(feature, 'State_LGD')}`;
  };

  const getAssemblyPopupContent = (feature) => {
    return `<b>Assembly Details:</b><br>
      <b>ASSEMBLY_NAME:</b> ${getProperty(feature, 'AC_NAME')}<br>
      <b>PARLIAMENT_NAME:</b> ${getProperty(feature, 'PC_NAME')}<br>
      <b>DISTRICT_NAME:</b> ${getProperty(feature, 'DIST_NAME')}<br>
      <b>STATE_NAME:</b> ${getProperty(feature, 'ST_NAME')}<br>
      <b>ASSEMBLY_NO:</b> ${getProperty(feature, 'AC_NO')}<br>
      <b>STATUS:</b> ${getProperty(feature, 'STATUS')}<br>
      <b>dtcode:</b> ${getProperty(feature, 'dtcode11')}<br>
      <b>dtname:</b> ${getProperty(feature, 'dtname11')}`;
  };

  if (loading) return <div>Loading map data...</div>;
  if (error) return <div>Error loading map: {error}</div>;

  return (
    <>
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          latitude: 23.2599,
          longitude: 77.4126,
          zoom: 6,
          bearing: 0,
          pitch: 0
        }}
        mapStyle={themes?.[selectTheme]}
        {...other}
        interactiveLayerIds={['mp-layer', 'division-layer', 'district-layer', 'assembly-layer']}
        onMouseMove={(event) => {
          const feature = event.features && event.features[0];
          if (feature && feature.properties) {
            setHoverInfo({
              lngLat: event.lngLat,
              feature: feature
            });
          } else {
            setHoverInfo(null);
          }
        }}
        onClick={(event) => {
          const feature = event.features && event.features[0];
          const layerId = feature?.layer?.id;
          if (feature && layerId) {
            handleFeatureClick(feature, layerId);
          }
        }}
      >
        {/* Navigation Controls (Zoom buttons) */}
        <NavigationControl position="top-right" />

        {/* Geolocate Control (My Location button) */}
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showAccuracyCircle={false}
        />

        {/* Scale Control */}
        <ScaleControl position="bottom-right" />

        {/* Madhya Pradesh Layer */}
        {geoData.mp && (
          <Source id="mp-source" type="geojson" data={geoData.mp}>
            <Layer
              id="mp-layer"
              type="fill"
              paint={getMpStyle().paint}
            />
          </Source>
        )}

        {/* Divisions Layer */}
        {geoData.divisions && (
          <Source id="division-source" type="geojson" data={geoData.divisions}>
            <Layer
              id="division-layer"
              type="fill"
              paint={getDivisionStyle().paint}
            />
          </Source>
        )}

        {/* Districts Layer */}
        {geoData.districts && selectedDivision && (
          <Source id="district-source" type="geojson" data={{
            ...geoData.districts,
            features: geoData.districts.features.filter(filterDistricts)
          }}>
            <Layer
              id="district-layer"
              type="fill"
              paint={getDistrictStyle().paint}
            />
          </Source>
        )}

        {/* Assemblies Layer */}
        {geoData.assemblies && selectedDistrict && (
          <Source id="assembly-source" type="geojson" data={{
            ...geoData.assemblies,
            features: geoData.assemblies.features.filter(filterAssemblies)
          }}>
            <Layer
              id="assembly-layer"
              type="fill"
              paint={getAssemblyStyle().paint}
            />
          </Source>
        )}

        {/* Hover Popup */}
        {hoverInfo && (
          <Popup longitude={hoverInfo.lngLat.lng} latitude={hoverInfo.lngLat.lat} closeButton={false}>
            <div>
              {hoverInfo.feature.layer.id === 'division-layer' && (
                <div dangerouslySetInnerHTML={{ __html: getDivisionPopupContent(hoverInfo.feature) }} />
              )}
              {hoverInfo.feature.layer.id === 'district-layer' && (
                <div dangerouslySetInnerHTML={{ __html: getDistrictPopupContent(hoverInfo.feature) }} />
              )}
              {hoverInfo.feature.layer.id === 'assembly-layer' && (
                <div dangerouslySetInnerHTML={{ __html: getAssemblyPopupContent(hoverInfo.feature) }} />
              )}
            </div>
          </Popup>
        )}

        {/* Clicked Feature Popup */}
        {clickedFeature && (
          <Popup
            longitude={clickedFeature.geometry.coordinates[0][0][0]}
            latitude={clickedFeature.geometry.coordinates[0][0][1]}
            onClose={() => setClickedFeature(null)}
          >
            <div>
              {clickedFeature.layer.id === 'division-layer' && (
                <div dangerouslySetInnerHTML={{ __html: getDivisionPopupContent(clickedFeature) }} />
              )}
              {clickedFeature.layer.id === 'district-layer' && (
                <div dangerouslySetInnerHTML={{ __html: getDistrictPopupContent(clickedFeature) }} />
              )}
              {clickedFeature.layer.id === 'assembly-layer' && (
                <div dangerouslySetInnerHTML={{ __html: getAssemblyPopupContent(clickedFeature) }} />
              )}
            </div>
          </Popup>
        )}
      </Map>

      <ControlPanel themes={themes} selectTheme={selectTheme} onChangeTheme={handleChangeTheme} />
    </>
  );
}


export default memo(ChangeTheme);

ChangeTheme.propTypes = { themes: PropTypes.object, other: PropTypes.any };