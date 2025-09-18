import React, { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';

// Project Imports
import MainCard from 'components/MainCard';

// Add custom styles for permanent labels
const customStyles = `
    .permanent-label {
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
        font-weight: bold;
        color: #333;
        text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;
        font-size: 14px;
    }
`;

function DistrictMap({ onRegionClick }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const currentLayerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Function to handle fullscreen toggle
    const toggleFullscreen = () => {
        const element = document.documentElement;
        if (!isFullscreen) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    // Function to handle finding user location
    const handleFindLocation = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.locate({ setView: true, maxZoom: 16 });
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    useEffect(() => {
        // Add custom styles to document
        const styleElement = document.createElement('style');
        styleElement.textContent = customStyles;
        document.head.appendChild(styleElement);

        // Initialize map
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([23.4707, 77.9455], 6); // Centered on MP

            // Add location found event handler
            mapInstanceRef.current.on('locationfound', (e) => {
                const radius = e.accuracy / 2;
                L.marker(e.latlng).addTo(mapInstanceRef.current).bindPopup("You are within " + radius + " meters from this point").openPopup();
                L.circle(e.latlng, radius).addTo(mapInstanceRef.current);
                setUserLocation(e.latlng);
            });

            // Add location error handler
            mapInstanceRef.current.on('locationerror', (e) => {
                alert(e.message);
            });

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

            // Load all district polygons
            loadAllDistrictData();
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            // Clean up custom styles
            const styleElement = document.querySelector('style');
            if (styleElement && styleElement.textContent === customStyles) {
                styleElement.remove();
            }
        };
    }, []);

    const resetLayer = () => {
        if (currentLayerRef.current) {
            mapInstanceRef.current.removeLayer(currentLayerRef.current);
            currentLayerRef.current = null;
        }
    };

    const loadAllDistrictData = async () => {
        try {
            console.log('Starting to load district data...');
            setIsLoading(true);
            
            // Load all district polygons with pagination
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/district-polygons?limit=100`);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }

            const districtData = await response.json();
            console.log('District API Response:', districtData);
            
            // Check if we have the expected structure
            if (districtData && districtData.polygons && Array.isArray(districtData.polygons) && districtData.polygons.length > 0) {
                // Handle the case where we have multiple FeatureCollection documents
                const allDistrictFeatures = [];
                
                districtData.polygons.forEach((districtPolygon, polygonIndex) => {
                    console.log(`Processing district polygon ${polygonIndex}:`, districtPolygon);
                    console.log(`Original features count: ${districtPolygon.features ? districtPolygon.features.length : 0}`);
                    
                    // Check if this polygon has the FeatureCollection structure
                    if (districtPolygon.type === 'FeatureCollection' && 
                        districtPolygon.features && 
                        Array.isArray(districtPolygon.features) && 
                        districtPolygon.features.length > 0) {
                        
                        // Transform all features without filtering - handle invalid ones gracefully
                        const transformedFeatures = districtPolygon.features
                            .map((feature, featureIndex) => {
                                // Use properties from the feature, mapping the correct field names
                                const props = feature.properties || {};
                                
                                // Check if geometry exists, if not create a placeholder
                                let geometry = feature.geometry;
                                if (!geometry || !geometry.coordinates || !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
                                    console.warn(`Feature at index ${featureIndex} has invalid geometry:`, feature);
                                    // Create a dummy point geometry so it doesn't break the map
                                    geometry = {
                                        type: "Point",
                                        coordinates: [77.9455, 23.4707] // Center of MP
                                    };
                                }
                                
                                return {
                                    type: 'Feature',
                                    properties: {
                                        id: props.dtname?.toLowerCase().replace(/\s+/g, '-') || `district-${polygonIndex}-${featureIndex}`,
                                        name: props.dtname || `District-${featureIndex}`,
                                        displayName: props.dtname || `District-${featureIndex}`,
                                        district: props.dtname || '',
                                        state: props.stname || 'Madhya Pradesh',
                                        stateCode: props.stcode11 || '23',
                                        districtCode: props.dtcode11 || '',
                                        year: props.year_stat || '2011',
                                        districtLGD: props.Dist_LGD || '',
                                        stateLGD: props.State_LGD || '',
                                        objectId: props.OBJECTID || '',
                                        shapeLength: props.Shape_Length || '',
                                        shapeArea: props.Shape_Area || '',
                                        isValidGeometry: !!(feature.geometry && feature.geometry.coordinates && Array.isArray(feature.geometry.coordinates) && feature.geometry.coordinates.length > 0)
                                    },
                                    geometry: geometry
                                };
                            });
                        
                        console.log(`Processing all ${transformedFeatures.length} features (including ${transformedFeatures.filter(f => !f.properties.isValidGeometry).length} with invalid geometry)`);
                        allDistrictFeatures.push(...transformedFeatures);
                        console.log(`Added ${transformedFeatures.length} features from polygon ${polygonIndex}`);
                    }
                });

                console.log(`Total district features loaded: ${allDistrictFeatures.length}`);

                if (allDistrictFeatures.length > 0) {
                    const districtGeoJSON = {
                        type: 'FeatureCollection',
                        features: allDistrictFeatures
                    };
                    showDistrictBoundaries(districtGeoJSON);
                } else {
                    console.warn('No district features found after processing');
                    alert('No district features found in the data');
                }
            } else {
                console.warn('Unexpected API response structure:', districtData);
                alert('Unexpected data structure received from the API');
            }
        } catch (error) {
            console.error('Error loading district data:', error);
            alert(`Failed to load district data: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const showDistrictBoundaries = (data) => {
        resetLayer();

        // Validate data structure
        if (!data || !data.features || !Array.isArray(data.features) || data.features.length === 0) {
            console.error('Invalid GeoJSON data provided to showDistrictBoundaries:', data);
            alert('Invalid district data structure');
            return;
        }

        console.log('Rendering district boundaries with features:', data.features.length);

        // Array of colors for different districts
        const districtColors = [
            '#FF5722', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
            '#00BCD4', '#8BC34A', '#FFEB3B', '#795548', '#607D8B',
            '#F44336', '#009688', '#3F51B5', '#FFC107', '#673AB7',
            '#CDDC39', '#FF6F00', '#1976D2', '#388E3C', '#7B1FA2',
            '#0097A7', '#689F38', '#F57F17', '#5D4037', '#455A64',
            '#D32F2F', '#00796B', '#303F9F', '#F9A825', '#512DA8',
            '#AFD135', '#FF8F00', '#1565C0', '#2E7D32', '#6A1B9A',
            '#00ACC1', '#827717', '#E65100', '#424242', '#37474F',
            '#C62828', '#00695C', '#283593', '#FF6F00', '#4A148C',
            '#8BC34A', '#FF5722', '#1976D2', '#388E3C', '#7B1FA2',
            '#0097A7', '#827717'
        ];

        const style = (feature) => {
            // Get a color based on district code or name hash
            const districtCode = feature.properties.districtCode || feature.properties.dtcode11 || '';
            const districtName = feature.properties.district || feature.properties.dtname || '';
            
            // Create a hash from district name or code for consistent coloring
            let hash = 0;
            const identifier = districtCode || districtName;
            for (let i = 0; i < identifier.length; i++) {
                hash = ((hash << 5) - hash + identifier.charCodeAt(i)) & 0xffffffff;
            }
            const colorIndex = Math.abs(hash) % districtColors.length;
            const color = districtColors[colorIndex];
            
            let weight = 2;
            let fillOpacity = 0.4;

            return {
                color: color,
                weight: weight,
                fillOpacity: fillOpacity,
                fillColor: color
            };
        };

        try {
            currentLayerRef.current = L.geoJSON(data, {
                style: style,
                onEachFeature: (feature, layer) => {
                    // Add permanent label - use displayName if available, otherwise name
                    const labelText = feature.properties.displayName || feature.properties.name || '';
                    layer.bindTooltip(labelText, {
                        permanent: true,
                        direction: 'center',
                        className: 'permanent-label',
                        offset: [0, 0],
                        opacity: 0.9
                    });

                    // Add popup with details
                    const popupContent = generateDistrictPopupContent(feature);
                    layer.bindPopup(popupContent);

                    // Click handler
                    layer.on('click', () => handleLayerClick(feature));

                    // Hover effects
                    layer.on({
                        mouseover: (e) => {
                            const layer = e.target;
                            layer.setStyle({
                                weight: 3,
                                color: '#666',
                                fillOpacity: 0.3
                            });
                            layer.bringToFront();
                        },
                        mouseout: (e) => {
                            if (currentLayerRef.current) {
                                currentLayerRef.current.resetStyle(e.target);
                            }
                        }
                    });
                }
            }).addTo(mapInstanceRef.current);

            // Fit bounds to show all features with error handling
            if (currentLayerRef.current && currentLayerRef.current.getBounds && currentLayerRef.current.getBounds().isValid()) {
                mapInstanceRef.current.fitBounds(currentLayerRef.current.getBounds());
                console.log('Successfully fitted bounds for district map');
            } else {
                console.warn('Could not fit bounds, using default view');
                mapInstanceRef.current.setView([23.4707, 77.9455], 6);
            }
        } catch (error) {
            console.error('Error rendering district boundaries:', error);
            alert(`Failed to render district boundaries: ${error.message}`);
        }
    };

    const handleLayerClick = (feature) => {
        // Call the onRegionClick prop with region data
        if (onRegionClick) {
            onRegionClick({
                type: 'district',
                name: feature.properties.name || feature.properties.Name,
                data: feature.properties
            });
        }
    };

    const generateDistrictPopupContent = (feature) => {
        const properties = feature.properties;
        let content = `<div>
            <h4 style="margin: 0 0 10px 0; color: #333;">${properties.name || 'Unknown District'}</h4>`;

        content += `<p><strong>District:</strong> ${properties.district || 'N/A'}</p>`;
        
        if (properties.state) {
            content += `<p><strong>State:</strong> ${properties.state}</p>`;
        }
        
        if (properties.stateCode) {
            content += `<p><strong>State Code:</strong> ${properties.stateCode}</p>`;
        }
        
        if (properties.districtCode) {
            content += `<p><strong>District Code:</strong> ${properties.districtCode}</p>`;
        }
        
        if (properties.year) {
            content += `<p><strong>Census Year:</strong> ${properties.year}</p>`;
        }
        
        if (properties.districtLGD) {
            content += `<p><strong>District LGD:</strong> ${properties.districtLGD}</p>`;
        }
        
        if (properties.shapeArea) {
            const areaInSqKm = (parseFloat(properties.shapeArea) / 1000000).toFixed(2);
            content += `<p><strong>Area:</strong> ${areaInSqKm} sq km</p>`;
        }
        
        // Show geometry status
        if (!properties.isValidGeometry) {
            content += `<p style="color: orange;"><strong>⚠️ Note:</strong> Invalid geometry data - showing placeholder</p>`;
        }

        content += '</div>';
        return content;
    };

    return (
        <div>
            <div style={{ position: 'relative' }}>
                <div
                    style={{
                        height: '600px',
                        position: 'relative'
                    }}
                    className="map-container"
                    ref={mapRef}
                ></div>
                {/* Map Controls */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    zIndex: 1000
                }}>
                    <button
                        onClick={handleFindLocation}
                        style={{
                            padding: '8px',
                            backgroundColor: 'white',
                            border: '2px solid rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '34px',
                            height: '34px'
                        }}
                        title="Find my location"
                    >
                        <FontAwesomeIcon icon={faLocationDot} />
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        style={{
                            padding: '8px',
                            backgroundColor: 'white',
                            border: '2px solid rgba(0,0,0,0.2)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '34px',
                            height: '34px'
                        }}
                        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                        <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                    </button>
                </div>
            </div>
            {/* Information Panel */}
            <div style={{ padding: '10px', background: '#f5f5f5', marginTop: '10px' }}>
                <div style={{
                    padding: '8px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <span style={{ fontWeight: '500' }}>
                        District Map - All Districts of Madhya Pradesh
                        {isLoading && <span style={{ color: '#007bff', marginLeft: '10px' }}>Loading...</span>}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default DistrictMap;