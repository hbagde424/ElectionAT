import React, { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import Map, { Source, Layer } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const PolygonMap = ({ polygon, height = 300, mapboxToken, title = 'Map' }) => {
    const mapRef = useRef(null);

    if (!polygon || !mapboxToken) {
        return (
            <Box sx={{ 
                height, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                bgcolor: '#f5f5f5'
            }}>
                <Typography variant="body2" color="text.secondary">
                    {!mapboxToken ? 'Map token not configured' : 'No polygon data available'}
                </Typography>
            </Box>
        );
    }

    // Convert single Feature to FeatureCollection if needed
    const geoJsonData = polygon.type === 'Feature' 
        ? { type: 'FeatureCollection', features: [polygon] }
        : polygon;

    return (
        <Box sx={{ 
            height, 
            borderRadius: 1, 
            overflow: 'hidden',
            border: '1px solid #e0e0e0'
        }}>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: 78.5,
                    latitude: 23,
                    zoom: 5
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/light-v9"
                mapboxAccessToken={mapboxToken}
                onLoad={(event) => {
                    // Fit bounds to show all features
                    if (geoJsonData?.features?.length > 0) {
                        try {
                            const bounds = new mapboxgl.LngLatBounds();
                            geoJsonData.features.forEach(feature => {
                                if (feature.geometry?.coordinates) {
                                    const coords = feature.geometry.coordinates;
                                    if (feature.geometry.type === 'Polygon' && coords[0]) {
                                        coords[0].forEach(([lng, lat]) => {
                                            bounds.extend([lng, lat]);
                                        });
                                    } else if (feature.geometry.type === 'MultiPolygon') {
                                        coords.forEach(polygon => {
                                            polygon[0]?.forEach(([lng, lat]) => {
                                                bounds.extend([lng, lat]);
                                            });
                                        });
                                    }
                                }
                            });
                            
                            if (event.target && bounds.getNorthEast() && bounds.getSouthWest()) {
                                event.target.fitBounds(bounds, { padding: 20 });
                            }
                        } catch (e) {
                            console.warn('Could not fit bounds:', e);
                        }
                    }
                }}
            >
                <Source id="polygon-source" type="geojson" data={geoJsonData}>
                    <Layer
                        id="polygon-fill"
                        type="fill"
                        paint={{
                            'fill-color': '#088',
                            'fill-opacity': 0.4
                        }}
                    />
                    <Layer
                        id="polygon-outline"
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
};

export default PolygonMap;
