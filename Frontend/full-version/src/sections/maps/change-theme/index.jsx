import PropTypes from 'prop-types';
import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';

// Third-party
import ControlPanel from './control-panel';
import MapControl from 'components/third-party/map/MapControl';

// Sample JSON Data
import mpDivisions from './mp_divisions.json';
import parliamentData from './parliament.json';
import districtData from './district.json';
import assemblyData from './assembly.json';

const mapboxToken = 'YOUR_MAPBOX_ACCESS_TOKEN_HERE';

// Base Layer Styles
const baseStyles = {
  division: {
    type: 'fill',
    paint: {
      'fill-color': 'orange',
      'fill-opacity': 0.5,
      'fill-outline-color': '#000'
    }
  },
  parliament: {
    type: 'fill',
    paint: {
      'fill-color': 'purple',
      'fill-opacity': 0.5,
      'fill-outline-color': '#000'
    }
  },
  district: {
    type: 'fill',
    paint: {
      'fill-color': 'green',
      'fill-opacity': 0.5,
      'fill-outline-color': '#000'
    }
  },
  assembly: {
    type: 'fill',
    paint: {
      'fill-color': '',
      'fill-opacity': 0.5,
      'fill-outline-color': '#000'
    }
  }
};

// Highlight styles
const highlightStyles = {
  division: {
    type: 'line',
    paint: {
      'line-color': 'black',
      'line-width': 3
    }
  },
  parliament: {
    type: 'line',
    paint: {
      'line-color': 'blue',
      'line-width': 3
    }
  },
  district: {
    type: 'line',
    paint: {
      'line-color': 'green',
      'line-width': 3
    }
  },
  assembly: {
    type: 'line',
    paint: {
      'line-color': 'red',
      'line-width': 3
    }
  }
};

function ChangeTheme({ themes, ...other }) {
  const [selectTheme, setSelectTheme] = useState('streets');
  const [hoverInfo, setHoverInfo] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedParliament, setSelectedParliament] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [filteredData, setFilteredData] = useState(mpDivisions);
  const [highlightedFeature, setHighlightedFeature] = useState(null);

  const handleChangeTheme = useCallback((theme) => {
    setSelectTheme(theme);
  }, []);

  // Filter logic
  useEffect(() => {
    if (!selectedDivision && !selectedParliament && !selectedDistrict) {
      setFilteredData(mpDivisions);
      setHighlightedFeature(null);
    } else if (selectedDivision && !selectedParliament && !selectedDistrict) {
      const filteredParliaments = {
        ...parliamentData,
        features: parliamentData.features.filter(f =>
          f.properties.division === selectedDivision.properties.name
        )
      };
      setFilteredData(filteredParliaments);
      setHighlightedFeature({ feature: selectedDivision, type: 'division' });
    } else if (selectedDivision && selectedParliament && !selectedDistrict) {
      const filteredDistricts = {
        ...districtData,
        features: districtData.features.filter(f =>
          f.properties.pc_name === selectedParliament.properties.pc_name
        )
      };
      setFilteredData(filteredDistricts);
      setHighlightedFeature({ feature: selectedParliament, type: 'parliament' });
    } else if (selectedDivision && selectedParliament && selectedDistrict) {
      const filteredAssemblies = {
        ...assemblyData,
        features: assemblyData.features.filter(f =>
          f.properties.district === selectedDistrict.properties.name
        )
      };
      setFilteredData(filteredAssemblies);
      setHighlightedFeature({ feature: selectedDistrict, type: 'district' });
    }
  }, [selectedDivision, selectedParliament, selectedDistrict]);

  const handleClick = useCallback((event) => {
    const feature = event.features && event.features[0];
    if (!feature) return;

    if (!selectedDivision) {
      setSelectedDivision(feature);
      setSelectedParliament(null);
      setSelectedDistrict(null);
    } else if (!selectedParliament) {
      setSelectedParliament(feature);
      setSelectedDistrict(null);
    } else if (!selectedDistrict) {
      setSelectedDistrict(feature);
    } else {
      setHighlightedFeature({ feature, type: 'assembly' });
    }
  }, [selectedDivision, selectedParliament, selectedDistrict]);

  const handleBackClick = useCallback(() => {
    if (selectedDistrict) {
      setSelectedDistrict(null);
    } else if (selectedParliament) {
      setSelectedParliament(null);
    } else if (selectedDivision) {
      setSelectedDivision(null);
    }
  }, [selectedDivision, selectedParliament, selectedDistrict]);

  // Stable active layer style
  const activeLayerStyle = useMemo(() => {
    let base;
    if (!selectedDivision) base = baseStyles.division;
    else if (!selectedParliament) base = baseStyles.parliament;
    else if (!selectedDistrict) base = baseStyles.district;
    else base = baseStyles.assembly;

    return { ...base, id: 'main-layer' };
  }, [selectedDivision, selectedParliament, selectedDistrict]);

  // Stable highlight layer
  const highlightLayerStyle = useMemo(() => {
    if (!highlightedFeature) return null;
    return {
      ...highlightStyles[highlightedFeature.type],
      id: 'highlight-layer'
    };
  }, [highlightedFeature]);

  const getPopupContent = (properties) => {
    if (!properties) return null;

    if (properties.layerType === 'division') {
      return (
        <div>
          <h4>Division Details</h4>
          <p><b>Name:</b> {properties.id}</p>
          <p><b>State:</b> {properties.stname}</p>
          <p><b>State Code:</b> {properties.stcode11}</p>
          <p><b>District Code:</b> {properties.dtcode11}</p>
          <p><b>Year:</b> {properties.year_stat}</p>
          <p><b>OBJECTID:</b> {properties.OBJECTID}</p>
          <p><b>Dist LGD:</b> {properties.Dist_LGD}</p>
          <p><b>State LGD:</b> {properties.State_LGD}</p>
        </div>
      );
    } else if (properties.layerType === 'district') {
      return (
        <div>
          <h4>District Details</h4>
          <p><b>Name:</b> {properties.dtname}</p>
          <p><b>State:</b> {properties.stname}</p>
          <p><b>State Code:</b> {properties.stcode11}</p>
          <p><b>District Code:</b> {properties.dtcode11}</p>
          <p><b>Year:</b> {properties.year_stat}</p>
          <p><b>OBJECTID:</b> {properties.OBJECTID}</p>
          <p><b>Dist LGD:</b> {properties.Dist_LGD}</p>
          <p><b>State LGD:</b> {properties.State_LGD}</p>
        </div>
      );
    } else if (properties.layerType === 'assembly') {
      return (
        <div>
          <h4>Assembly Details</h4>
          <p><b>ASSEMBLY_NAME:</b> {properties.AC_NAME}</p>
          <p><b>PARLIAMENT_NAME:</b> {properties.PC_NAME}</p>
          <p><b>DISTRICT_NAME:</b> {properties.DIST_NAME}</p>
          <p><b>STATE_NAME:</b> {properties.ST_NAME}</p>
          <p><b>ASSEMBLY_NO:</b> {properties.AC_NO}</p>
          <p><b>STATUS:</b> {properties.STATUS}</p>
          <p><b>dtcode:</b> {properties.dtcode11}</p>
          <p><b>dtname:</b> {properties.dtname11}</p>
        </div>
      );
    } else if (properties.layerType === 'parliament') {
      return (
        <div>
          <h4>Parliament Details</h4>
          <p><b>PC_NAME:</b> {properties.PC_NAME}</p>
          <p><b>PC_NO:</b> {properties.PC_NO}</p>
          <p><b>STATE_NAME:</b> {properties.ST_NAME}</p>
          <p><b>DISTRICT_NAME:</b> {properties.dtname}</p>
          <p><b>Division:</b> {properties.division}</p>
        </div>
      );
    }

    return null;
  };

  // Add layerType to properties for hover info
  const onHover = useCallback((event) => {
    const feature = event.features && event.features[0];
    if (feature) {
      const properties = {
        ...feature.properties,
        layerType: !selectedDivision ? 'division' : 
                   !selectedParliament ? 'parliament' : 
                   !selectedDistrict ? 'district' : 'assembly'
      };
      setHoverInfo({
        lngLat: event.lngLat,
        properties
      });
    } else {
      setHoverInfo(null);
    }
  }, [selectedDivision, selectedParliament, selectedDistrict]);

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
        interactiveLayerIds={['main-layer']}
        onClick={handleClick}
        onMouseMove={onHover}
      >
        <MapControl />

        {filteredData && (
          <>
            <Source id="polygon-source" type="geojson" data={filteredData}>
              <Layer {...activeLayerStyle} />
            </Source>

            {highlightedFeature && highlightLayerStyle && (
              <Source id="highlight-source" type="geojson" data={highlightedFeature.feature}>
                <Layer {...highlightLayerStyle} />
              </Source>
            )}
          </>
        )}

        {hoverInfo && (
          <Popup
            longitude={hoverInfo.lngLat.lng}
            latitude={hoverInfo.lngLat.lat}
            closeButton={false}
            closeOnClick={false}
            anchor="top"
          >
            {getPopupContent(hoverInfo.properties)}
          </Popup>
        )}
      </Map>

      <ControlPanel themes={themes} selectTheme={selectTheme} onChangeTheme={handleChangeTheme} />

      {(selectedDivision || selectedParliament || selectedDistrict) && (
        <button
          onClick={handleBackClick}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1000,
            padding: '8px 16px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
      )}
    </>
  );
}

export default memo(ChangeTheme);

ChangeTheme.propTypes = {
  themes: PropTypes.object,
  other: PropTypes.any
};