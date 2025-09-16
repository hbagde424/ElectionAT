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

function ParliamentMap({ onRegionClick }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const currentLayerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

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

            // Load all parliamentary constituencies
            loadAllParliamentData();
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

    const loadAllParliamentData = async () => {
        try {
            // Load all parliamentary constituencies
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-polygons`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const parliamentData = await response.json();
            if (parliamentData && parliamentData.length > 0) {
                // Combine all parliamentary features
                const allParliamentFeatures = [];
                parliamentData.forEach(parliamentConstituency => {
                    if (parliamentConstituency.features && parliamentConstituency.features.length > 0) {
                        // Transform features to match HierarchicalMap format
                        const transformedFeatures = parliamentConstituency.features.map(feature => ({
                            type: 'Feature',
                            properties: {
                                id: feature.properties.PC_ID?.toString() || feature.properties.id || '',
                                name: feature.properties.PC_NAME || feature.properties.name || '',
                                displayName: `${feature.properties.PC_NO || ''}-${feature.properties.PC_NAME || feature.properties.name || ''} `,
                                pcNo: feature.properties.PC_NO?.toString() || feature.properties.pcNo || '',
                                divisionName: feature.properties.DIVISION_NAME || feature.properties.divisionName || '',
                                district: feature.properties.ST_NAME || feature.properties.district || '',
                                category: feature.properties.category || 'GEN',
                                lastElectionYear: feature.properties.lastElectionYear || '2023',
                                winner: feature.properties.winner || feature.properties.winningParty || 'Others',
                                margin: feature.properties.margin || '',
                                totalVoters: feature.properties.totalVoters || ''
                            },
                            geometry: feature.geometry
                        }));
                        allParliamentFeatures.push(...transformedFeatures);
                    }
                });

                if (allParliamentFeatures.length > 0) {
                    const parliamentGeoJSON = {
                        type: 'FeatureCollection',
                        features: allParliamentFeatures
                    };
                    showParliamentBoundaries(parliamentGeoJSON);
                } else {
                    console.log('No parliament features found');
                }
            } else {
                console.log('No parliament data found');
            }
        } catch (error) {
            console.error('Error loading parliament data:', error);
        }
    };

    const showParliamentBoundaries = (data) => {
        resetLayer();

        const style = (feature) => {
            let color = '#477fcdff';
            let weight = 2;
            let fillOpacity = 0.2;

            return {
                color: color,
                weight: weight,
                fillOpacity: fillOpacity,
                fillColor: color
            };
        };

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
                const popupContent = generateParliamentPopupContent(feature);
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
                        currentLayerRef.current.resetStyle(e.target);
                    }
                });
            }
        }).addTo(mapInstanceRef.current);

        // Fit bounds to show all features
        mapInstanceRef.current.fitBounds(currentLayerRef.current.getBounds());
    };

    const handleLayerClick = (feature) => {
        // Call the onRegionClick prop with region data
        if (onRegionClick) {
            onRegionClick({
                type: 'parliament',
                name: feature.properties.name || feature.properties.Name,
                data: feature.properties
            });
        }
    };

    const generateParliamentPopupContent = (feature) => {
        const properties = feature.properties;
        let content = `<div>
            <h4 style="margin: 0 0 10px 0; color: #333;">${properties.Name || properties.name || ''}</h4>`;

        content += `<p><strong>PC No:</strong> ${properties.pcNo || properties.PC_NO || 'N/A'}</p>`;
        
        if (properties.divisionName || properties.DIVISION_NAME) {
            content += `<p><strong>Division:</strong> ${properties.divisionName || properties.DIVISION_NAME}</p>`;
        }
        
        if (properties.totalVoters) {
            content += `<p><strong>Total Voters:</strong> ${properties.totalVoters}</p>`;
        }
        
        if (properties.winner || properties.winningParty) {
            content += `<p><strong>Winning Party:</strong> ${properties.winner || properties.winningParty}</p>`;
        }
        
        if (properties.margin) {
            content += `<p><strong>Victory Margin:</strong> ${properties.margin}</p>`;
        }
        
        if (properties.category) {
            content += `<p><strong>Category:</strong> ${properties.category}</p>`;
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
                        Parliamentary Constituencies Map - All Parliamentary Constituencies of Madhya Pradesh
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ParliamentMap;