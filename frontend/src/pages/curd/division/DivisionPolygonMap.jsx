import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function DivisionPolygonMap({ divisionId }) {
  const mapRef = useRef(null);
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!divisionId) {
      setError('Division ID is required');
      setLoading(false);
      return;
    }

    const fetchDivisionPolygon = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('serviceToken');
        
        // Fetch the division document which contains the geometry
        const response = await fetch(
          `${import.meta.env.VITE_APP_API_URL}/divisions/${divisionId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch division: ${response.status}`);
        }

        const data = await response.json();
        console.log('Division data received:', data);

        // Check if division has geometry
        if (data.data && data.data.geometry) {
          const geometry = data.data.geometry;
          
          // Convert the geometry to a GeoJSON Feature
          const geoJsonFeature = {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: geometry,
                properties: {
                  name: data.data.name,
                  ...data.data.properties
                }
              }
            ]
          };
          
          console.log('GeoJSON Feature created:', geoJsonFeature);
          setGeoJsonData(geoJsonFeature);
        } else {
          setError('No polygon geometry found for this division');
        }
      } catch (err) {
        console.error('Error fetching division polygon:', err);
        setError(err.message || 'Failed to load polygon data');
      } finally {
        setLoading(false);
      }
    };

    fetchDivisionPolygon();
  }, [divisionId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          {error}
        </Alert>
        {/* Show map anyway, centered on India */}
        <Box sx={{ width: '100%', height: 500, borderRadius: 1, overflow: 'hidden', mt: 2 }}>
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: 78.9629,
              latitude: 20.5937,
              zoom: 5
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/light-v11"
            mapboxAccessToken={import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN}
          />
        </Box>
      </Box>
    );
  }

  if (!geoJsonData) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No polygon map available for this division
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 500, borderRadius: 1, overflow: 'hidden', mt: 2 }}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 78.9629,
          latitude: 20.5937,
          zoom: 5
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN}
      >
        <Source id="division-polygon" type="geojson" data={geoJsonData}>
          <Layer
            id="division-fill"
            type="fill"
            paint={{
              'fill-color': '#088',
              'fill-opacity': 0.4
            }}
          />
          <Layer
            id="division-outline"
            type="line"
            paint={{
              'line-color': '#088',
              'line-width': 2
            }}
          />
        </Source>
      </Map>
    </Box>
  );
}
