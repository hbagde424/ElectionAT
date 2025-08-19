import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const GandhwaniMap = () => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const assemblyLayerRef = useRef(null);
    const blockLayerRef = useRef(null);
    const boothLayerRef = useRef(null);

    useEffect(() => {
        // Initialize map
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([22.3349, 74.7499], 10); // Centered on Gandhwani

            // Add base layers
            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18
            }).addTo(mapInstanceRef.current);

            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 18
            });

            // Add layer control
            const baseMaps = {
                "Street Map": osmLayer,
                "Satellite View": satelliteLayer
            };
            L.control.layers(baseMaps).addTo(mapInstanceRef.current);

            // Load Gandhwani data
            loadGandhwaniData();
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const resetMap = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.eachLayer(layer => {
                if (layer instanceof L.GeoJSON) {
                    mapInstanceRef.current.removeLayer(layer);
                }
            });
        }
    };

    const loadGandhwaniData = async () => {
        try {
            const response = await fetch('/mapwork/Gandhwani.json');
            const data = await response.json();

            resetMap();

            // Show blocks
            showBlocks(data);
        } catch (error) {
            console.error('Error loading Gandhwani data:', error);
        }
    };

    const showBlocks = (data) => {
        if (blockLayerRef.current) {
            mapInstanceRef.current.removeLayer(blockLayerRef.current);
        }

        blockLayerRef.current = L.geoJSON(data, {
            style: {
                color: 'gray',
                weight: 2,
                fillOpacity: 0
            },
            onEachFeature: (feature, layer) => {
                // Add tooltip with block name
                layer.bindTooltip(feature.properties.BlockName, {
                    permanent: false,
                    direction: 'top'
                });

                // Add popup with block details
                const content = `
                    <b>Block Details:</b><br>
                    <b>Block Name:</b> ${feature.properties.BlockName}<br>
                    <b>State Name:</b> ${feature.properties.ST_NAME}<br>
                    <b>District Name:</b> ${feature.properties.DIST_NAME}<br>
                    <b>Parliament Name:</b> ${feature.properties.PC_NAME}<br>
                    <b>District Name:</b> ${feature.properties.dtname11}
                `;
                layer.bindPopup(content);

                // Mouse events
                layer.on({
                    mouseover: () => layer.openPopup(),
                    mouseout: () => layer.closePopup(),
                    click: () => showBooths(data, feature.properties.BlockName)
                });
            }
        }).addTo(mapInstanceRef.current);

        if (blockLayerRef.current) {
            mapInstanceRef.current.fitBounds(blockLayerRef.current.getBounds());
        }
    };

    const showBooths = (data, blockName) => {
        if (boothLayerRef.current) {
            mapInstanceRef.current.removeLayer(boothLayerRef.current);
        }

        const filteredBooths = {
            type: 'FeatureCollection',
            features: data.features.filter(f => f.properties.BlockName === blockName)
        };

        boothLayerRef.current = L.geoJSON(filteredBooths, {
            style: {
                color: 'blue',
                weight: 2,
                fillOpacity: 0
            },
            onEachFeature: (feature, layer) => {
                // Add tooltip with booth name
                layer.bindTooltip(feature.properties.BoothName, {
                    permanent: false,
                    direction: 'top'
                });

                // Add popup with booth details
                const content = `
                    <b>Booth Details:</b><br>
                    <b>Block Name:</b> ${feature.properties.BlockName}<br>
                    <b>Booth Name:</b> ${feature.properties.BoothName}<br>
                    <b>State Name:</b> ${feature.properties.ST_NAME}<br>
                    <b>District Name:</b> ${feature.properties.DIST_NAME}<br>
                    <b>Parliament Name:</b> ${feature.properties.PC_NAME}<br>
                    <b>District Name:</b> ${feature.properties.dtname11}<br>
                    <b>Booth No:</b> ${feature.properties.BoothNo}
                `;
                layer.bindPopup(content);

                // Mouse events
                layer.on({
                    mouseover: () => layer.openPopup(),
                    mouseout: () => layer.closePopup()
                });
            }
        }).addTo(mapInstanceRef.current);

        if (boothLayerRef.current) {
            mapInstanceRef.current.fitBounds(boothLayerRef.current.getBounds());
        }
    };

    return (
        <div ref={mapRef} style={{ height: '100vh', width: '100%' }} />
    );
};

export default GandhwaniMap;

