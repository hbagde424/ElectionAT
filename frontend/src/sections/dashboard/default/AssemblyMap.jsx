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

function AssemblyMap({ onRegionClick }) {
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

            // Load all assembly constituencies
            loadAllAssemblyData();
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

    const loadAllAssemblyData = async () => {
        try {
            console.log('Starting to load assembly data...');
            setIsLoading(true);
            
            const allAssemblyFeatures = [];
            
            // Create all fetch promises at once for parallel loading
            const fetchPromises = [];
            for (let pcNumber = 1; pcNumber <= 29; pcNumber++) {
                const promise = fetch(`${import.meta.env.VITE_APP_API_URL}/assembly-polygons/parliament/${pcNumber}`)
                    .then(async (assemblyResponse) => {
                        if (assemblyResponse.ok) {
                            const assemblies = await assemblyResponse.json();
                            
                            if (assemblies && assemblies.success && assemblies.data && assemblies.data[0] && 
                                assemblies.data[0].type === "FeatureCollection" && 
                                assemblies.data[0].features && assemblies.data[0].features.length > 0) {
                                
                                // Transform features to match HierarchicalMap format
                                const transformedFeatures = assemblies.data[0].features.map(feature => ({
                                    type: 'Feature',
                                    properties: {
                                        id: feature.properties.PC_ID?.toString() || feature.properties.id || '',
                                        name: feature.properties.AC_NAME || feature.properties.name || '',
                                        displayName: `${feature.properties.AC_NO || ''}-${feature.properties.AC_NAME || feature.properties.name || ''} `,
                                        acNo: feature.properties.AC_NO?.toString() || feature.properties.acNo || '',
                                        pcName: feature.properties.PC_NAME || feature.properties.pcName || '',
                                        pcNo: pcNumber.toString(),
                                        district: feature.properties.ST_NAME || feature.properties.district || '',
                                        division: feature.properties.DIVISION_NAME || feature.properties.division || '',
                                        category: feature.properties.category || 'GEN',
                                        lastElectionYear: feature.properties.lastElectionYear || '2023',
                                        winner: feature.properties.winner || feature.properties.winningParty || 'Others',
                                        margin: feature.properties.margin || '',
                                        totalVoters: feature.properties.totalVoters || ''
                                    },
                                    geometry: feature.geometry
                                }));
                                
                                // console.log(`Loaded ${transformedFeatures.length} assemblies from PC ${pcNumber}`);
                                return transformedFeatures;
                            }
                        } else {
                            console.log(`Failed to fetch assembly data for PC ${pcNumber} - Status: ${assemblyResponse.status}`);
                        }
                        return [];
                    })
                    .catch(error => {
                        console.warn(`Error loading assemblies for PC ${pcNumber}:`, error.message);
                        return [];
                    });
                    
                fetchPromises.push(promise);
            }
            
            // Wait for all requests to complete
            console.log('Fetching all assembly data in parallel...');
            const results = await Promise.all(fetchPromises);
            
            // Combine all results
            results.forEach(features => {
                if (features.length > 0) {
                    allAssemblyFeatures.push(...features);
                }
            });

            console.log(`Finished loading. Total assembly features found: ${allAssemblyFeatures.length}`);
            
            if (allAssemblyFeatures.length > 0) {
                const assemblyGeoJSON = {
                    type: 'FeatureCollection',
                    features: allAssemblyFeatures
                };
                showAssemblyBoundaries(assemblyGeoJSON);
            } else {
                console.log('No assembly features found after trying all PC numbers');
            }
            
        } catch (error) {
            console.error('Error loading assembly data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const showAssemblyBoundaries = (data) => {
        resetLayer();

        // Array of colors for different assembly constituencies
        const assemblyColors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
            '#F06292', '#AED581', '#FFB74D', '#BA68C8', '#4DB6AC',
            '#81C784', '#FFD54F', '#FF8A65', '#A1C4FD', '#C2E9FB',
            '#FDBB2D', '#22C1C3', '#E056FD', '#F093FB', '#F5576C',
            '#4FACFE', '#00F2FE', '#FA709A', '#FEE140', '#24FE41',
            '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'
        ];

        const style = (feature) => {
            // Get a color based on AC_NO or use index-based coloring
            const acNo = parseInt(feature.properties.acNo || feature.properties.AC_NO || 0);
            const colorIndex = acNo % assemblyColors.length;
            const color = assemblyColors[colorIndex];
            
            let weight = 2;
            let fillOpacity = 0.4;

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
                const popupContent = generateAssemblyPopupContent(feature);
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
                type: 'assembly',
                name: feature.properties.name || feature.properties.Name,
                data: feature.properties
            });
        }
    };

    const generateAssemblyPopupContent = (feature) => {
        const properties = feature.properties;
        let content = `<div>
            <h4 style="margin: 0 0 10px 0; color: #333;">${properties.Name || properties.name || ''}</h4>`;

        content += `<p><strong>Assembly No:</strong> ${properties.acNo || properties.AC_NO || 'N/A'}</p>`;
        
        if (properties.pcName) {
            content += `<p><strong>Parliamentary:</strong> ${properties.pcName}</p>`;
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
                        Assembly Constituencies Map - All Assembly Constituencies of Madhya Pradesh
                        {isLoading && <span style={{ color: '#007bff', marginLeft: '10px' }}>Loading...</span>}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default AssemblyMap;