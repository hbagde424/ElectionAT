import { useEffect, useState, useRef, useMemo } from 'react';
import { Box, Typography, Alert, Drawer, Stack, Chip, CircularProgress, Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import IconButton from 'components/@extended/IconButton';
import { usePermissions } from 'contexts/PermissionContext';

export default function BoothMapDashboard() {
    const { userHierarchy } = usePermissions();
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [boothDataMap, setBoothDataMap] = useState({});
    const [expandedSections, setExpandedSections] = useState({});
    const [mapZoom, setMapZoom] = useState(8);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    const toggleSection = (sectionName) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    const renderDataSection = (title, data, sectionKey, bgColor, borderColor, textColor) => {
        if (!data?.count || data.count === 0) return null;
        
        const getDisplayValue = (value) => {
            if (value === null || value === undefined) return 'N/A';
            if (typeof value === 'object') {
                if (value.name) return value.name;
                if (value.title) return value.title;
                if (value.description) return value.description;
                if (value.username) return value.username;
                return null;
            }
            return String(value).substring(0, 100);
        };

        const filterAndFormatData = (item) => {
            const fieldsToSkip = ['_id', 'id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'createdAt', 'updatedAt', '__v', 'booth_id'];
            
            return Object.entries(item)
                .filter(([key, value]) => {
                    if (key.includes('_id') || key.includes('Id') || fieldsToSkip.includes(key)) return false;
                    if (key.startsWith('_')) return false;
                    if (typeof value === 'object' && !value?.name && !value?.title && !value?.description && !value?.username) return false;
                    return true;
                })
                .slice(0, 8)
                .map(([key, value]) => ({
                    key: key.replace(/_/g, ' ').toUpperCase(),
                    value: getDisplayValue(value)
                }))
                .filter(item => item.value !== null);
        };
        
        return (
            <Box key={sectionKey} sx={{ backgroundColor: bgColor, borderRadius: 1, borderLeft: `4px solid ${borderColor}`, overflow: 'hidden', mt: 2 }}>
                <Box
                    onClick={() => toggleSection(sectionKey)}
                    sx={{ p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { backgroundColor: bgColor, opacity: 0.8 } }}
                >
                    <Typography variant="subtitle2" sx={{ color: textColor, fontWeight: 600 }}>{title} ({data.count})</Typography>
                    <ExpandMoreIcon sx={{ transform: expandedSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                </Box>
                <Collapse in={expandedSections[sectionKey]}>
                    <Box sx={{ p: 2, pt: 0, borderTop: `1px solid ${borderColor}` }}>
                        {data.data.map((item, idx) => {
                            const formattedData = filterAndFormatData(item);
                            return (
                                <Box key={idx} sx={{ mb: 2, pb: 1.5, borderBottom: idx < data.data.length - 1 ? `1px solid ${bgColor}` : 'none' }}>
                                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 1 }}>Record {idx + 1}</Typography>
                                    <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                                        {formattedData.length > 0 ? (
                                            formattedData.map(({ key, value }) => (
                                                <Box key={key} sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1, alignItems: 'flex-start' }}>
                                                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, wordBreak: 'break-word' }}>
                                                        {key}:
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#333', wordBreak: 'break-word' }}>
                                                        {value}
                                                    </Typography>
                                                </Box>
                                            ))
                                        ) : (
                                            <Typography variant="caption" sx={{ color: '#999' }}>No data available</Typography>
                                        )}
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Box>
                </Collapse>
            </Box>
        );
    };

    const fetchBoothDetailsByPolygon = async (boothId, boothName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const endpoints = [
                { key: 'boothVotes', url: `/booth-votes?booth=${boothId}&all=true` },
                { key: 'boothSurveys', url: `/booth-surveys?booth=${boothId}&all=true` },
                { key: 'boothVolunteers', url: `/booth-volunteers?booth=${boothId}&all=true` },
                { key: 'boothDemographics', url: `/booth-demographics?booth=${boothId}&all=true` },
                { key: 'events', url: `/events?booth=${boothId}&all=true` },
                { key: 'visits', url: `/visits?booth=${boothId}&all=true` },
                { key: 'influencers', url: `/influencers?booth=${boothId}&all=true` },
                { key: 'partyActivities', url: `/party-activities?booth=${boothId}&all=true` },
                { key: 'localIssues', url: `/local-issues?booth=${boothId}&all=true` },
                { key: 'winningParties', url: `/winning-parties?booth=${boothId}&all=true` },
                { key: 'bla', url: `/bla?booth=${boothId}&all=true` },
                { key: 'blo', url: `/blo?booth=${boothId}&all=true` },
                { key: 'genders', url: `/genders?booth=${boothId}&all=true` },
                { key: 'codings', url: `/codings?booth=${boothId}&all=true` },
                { key: 'casteLists', url: `/caste-lists?booth=${boothId}&all=true` },
                { key: 'governments', url: `/governments?booth=${boothId}&all=true` },
                { key: 'panchayats', url: `/panchayats?booth=${boothId}&all=true` },
                { key: 'falliyas', url: `/falliyas?booth=${boothId}&all=true` },
                { key: 'localNews', url: `/local-news?booth=${boothId}&all=true` }
            ];

            const results = await Promise.allSettled(
                endpoints.map(({ url }) =>
                    fetch(`${import.meta.env.VITE_APP_API_URL}${url}`, { headers }).then(r => r.json())
                )
            );

            const details = { booth: boothDataMap[boothId] };
            endpoints.forEach(({ key }, idx) => {
                const result = results[idx];
                if (result.status === 'fulfilled' && result.value?.success) {
                    const data = result.value.data || [];
                    details[key] = { count: data.length, data: data.slice(0, 5) };
                } else {
                    details[key] = { count: 0, data: [] };
                }
            });

            setDrawerData({ loading: false, boothName, details, error: null });
        } catch (error) {
            console.error('Failed to fetch booth details:', error);
            setDrawerData({ loading: false, boothName, details: null, error: 'Failed to load details' });
        }
    };

    const calculateBounds = (features) => {
        let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
        
        features.forEach(feature => {
            if (!feature.geometry) return;
            
            const extractCoords = (coords) => {
                if (Array.isArray(coords[0])) {
                    coords.forEach(c => extractCoords(c));
                } else {
                    minLng = Math.min(minLng, coords[0]);
                    maxLng = Math.max(maxLng, coords[0]);
                    minLat = Math.min(minLat, coords[1]);
                    maxLat = Math.max(maxLat, coords[1]);
                }
            };
            
            if (feature.geometry.type === 'Polygon') {
                extractCoords(feature.geometry.coordinates);
            } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(poly => extractCoords(poly));
            }
        });
        
        return minLng !== Infinity ? { minLng, maxLng, minLat, maxLat } : null;
    };

    const zoomToFeatures = (features) => {
        if (!mapRef.current || features.length === 0) return;
        
        const bounds = calculateBounds(features);
        if (!bounds) return;
        
        const map = typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current;
        if (map && map.fitBounds) {
            map.fitBounds(
                [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
                { padding: 50, duration: 1000 }
            );
        }
    };

    const loadBoothPolygons = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?limit=5000`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            
            if (!json.success || !Array.isArray(json.data)) {
                throw new Error('Invalid response format');
            }

            const boothMap = {};
            json.data.forEach(booth => {
                boothMap[booth._id] = booth;
            });
            setBoothDataMap(boothMap);

            let boothsToUse = json.data;
            if (userHierarchy?.booth) {
                boothsToUse = json.data.filter(b => String(b._id) === String(userHierarchy.booth._id || userHierarchy.booth));
            } else if (userHierarchy?.block) {
                boothsToUse = json.data.filter(b => String(b.block_id?._id || b.block_id) === String(userHierarchy.block._id || userHierarchy.block));
            } else if (userHierarchy?.assembly) {
                boothsToUse = json.data.filter(b => String(b.assembly_id?._id || b.assembly_id) === String(userHierarchy.assembly._id || userHierarchy.assembly));
            } else if (userHierarchy?.parliament) {
                boothsToUse = json.data.filter(b => String(b.parliament_id?._id || b.parliament_id) === String(userHierarchy.parliament._id || userHierarchy.parliament));
            } else if (userHierarchy?.division) {
                boothsToUse = json.data.filter(b => String(b.division_id?._id || b.division_id) === String(userHierarchy.division._id || userHierarchy.division));
            } else if (userHierarchy?.state) {
                boothsToUse = json.data.filter(b => String(b.state_id?._id || b.state_id) === String(userHierarchy.state._id || userHierarchy.state));
            }

            const features = [];
            boothsToUse.forEach(booth => {
                if (booth.polygon) {
                    if (booth.polygon.type === 'Feature') {
                        features.push({
                            ...booth.polygon,
                            properties: { booth_id: booth._id }
                        });
                    } else if (booth.polygon.type === 'FeatureCollection' && Array.isArray(booth.polygon.features)) {
                        booth.polygon.features.forEach(feat => {
                            features.push({
                                ...feat,
                                properties: { booth_id: booth._id }
                            });
                        });
                    }
                }
            });

            if (!features.length) {
                setMapError('No booths with polygon data available');
                setBoothGeoJSON(null);
            } else {
                const geoJSON = { type: 'FeatureCollection', features };
                setBoothGeoJSON(geoJSON);
                setMapError('');
                setTimeout(() => zoomToFeatures(features), 100);
            }
        } catch (e) {
            console.error('Failed to load booth polygons:', e);
            setMapError(`Failed to load polygon data: ${e.message}`);
            setBoothGeoJSON(null);
        }
    };

    useEffect(() => {
        loadBoothPolygons();
    }, [userHierarchy]);

    return (
        <Box sx={{ p: 2, pb: 0 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Booth Map</Typography>
            {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
            {!boothGeoJSON && !mapError && (
                <Alert severity="info" sx={{ mb: 1 }}>Loading map data...</Alert>
            )}
            <MapContainerStyled sx={{ minHeight: 400 }}>
                {mapboxToken ? (
                    <Map
                        ref={mapRef}
                        mapboxAccessToken={mapboxToken}
                        initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 8 }}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        interactiveLayerIds={boothGeoJSON ? ['booth-fill'] : []}
                        onZoom={(e) => setMapZoom(e.viewState.zoom)}
                        onClick={(e) => {
                            if (!boothGeoJSON) return;
                            try {
                                const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY };
                                let features = e.features || [];
                                if ((!features || features.length === 0) && map && point) {
                                    features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                }
                                const f = features.find(f => f.layer && f.layer.id === 'booth-fill') || features[0];
                                if (f) {
                                    const props = f.properties || {};
                                    const boothId = props.booth_id || '';
                                    const boothData = boothDataMap[boothId];
                                    const boothName = boothData?.name || boothData?.booth_name || '';
                                    setDrawerData({ loading: true, boothName: boothName, details: null });
                                    setDrawerOpen(true);
                                    fetchBoothDetailsByPolygon(boothId, boothName);
                                }
                            } catch (err) {
                                console.warn('Map click handler error:', err);
                            }
                        }}
                    >
                        <MapControl />
                        {boothGeoJSON && (
                            <Source id="booth-polygons" type="geojson" data={boothGeoJSON}>
                                <Layer id="booth-fill" type="fill" paint={{ 'fill-color': '#00BCD4', 'fill-opacity': 0.22 }} />
                                <Layer id="booth-outline" type="line" paint={{ 'line-color': '#0097A7', 'line-width': 2 }} />
                            </Source>
                        )}
                        {boothGeoJSON && boothDataMap && mapZoom > 8 && (() => {
                            const labelFeatures = [];
                            boothGeoJSON.features.forEach((feature) => {
                                const boothId = feature.properties?.booth_id;
                                const boothData = boothDataMap[boothId];
                                if (!boothData || !feature.geometry) return;
                                
                                let center = null;
                                if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates.length > 0) {
                                    const coords = feature.geometry.coordinates[0];
                                    if (coords.length > 0) {
                                        const lngs = coords.map(c => c[0]);
                                        const lats = coords.map(c => c[1]);
                                        center = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
                                    }
                                } else if (feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates.length > 0) {
                                    const coords = feature.geometry.coordinates[0][0];
                                    if (coords && coords.length > 0) {
                                        const lngs = coords.map(c => c[0]);
                                        const lats = coords.map(c => c[1]);
                                        center = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
                                    }
                                }
                                
                                if (center) {
                                    labelFeatures.push({ 
                                        type: 'Feature', 
                                        geometry: { type: 'Point', coordinates: center }, 
                                        properties: { 
                                            name: boothData.name || boothData.booth_name || '', 
                                            boothNo: String(boothData.booth_number || boothData.booth_no || '') 
                                        } 
                                    });
                                }
                            });
                            
                            return labelFeatures.length > 0 ? (
                                <Source id="booth-labels-source" type="geojson" data={{ type: 'FeatureCollection', features: labelFeatures }}>
                                    <Layer 
                                        id="booth-label-layer" 
                                        type="symbol" 
                                        layout={{ 
                                            'text-field': ['concat', ['get', 'name'], '\n', ['get', 'boothNo']], 
                                            'text-size': 9, 
                                            'text-allow-overlap': false, 
                                            'text-anchor': 'center', 
                                            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                                            'text-offset': [0, 0]
                                        }} 
                                        paint={{ 
                                            'text-color': '#000', 
                                            'text-halo-color': '#ffffff', 
                                            'text-halo-width': 2 
                                        }} 
                                    />
                                </Source>
                            ) : null;
                        })()}
                    </Map>
                ) : (
                    <Alert severity="error">Mapbox token not configured</Alert>
                )}
            </MapContainerStyled>

            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 500 } } }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Booth Details</Typography>
                    <IconButton onClick={() => setDrawerOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{ p: 2, overflowY: 'auto', height: 'calc(100% - 60px)' }}>
                    {drawerData?.loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </Box>
                    ) : drawerData?.error ? (
                        <Alert severity="error">{drawerData.error}</Alert>
                    ) : drawerData?.details ? (
                        <Stack spacing={2}>
                            <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, borderLeft: '4px solid #1976d2' }}>
                                <Typography variant="subtitle2" sx={{ color: '#1565c0', fontWeight: 600, mb: 1 }}>Basic Information</Typography>
                                <Stack spacing={1}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Booth Name</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{drawerData.details.booth?.name || drawerData.details.booth?.booth_name || 'N/A'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Booth Number</Typography>
                                        <Chip label={drawerData.details.booth?.booth_number || drawerData.details.booth?.booth_no || 'N/A'} size="small" color="primary" />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Location</Typography>
                                        <Typography variant="body2">{drawerData.details.booth?.location || 'N/A'}</Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            {renderDataSection('Booth Votes', drawerData.details.boothVotes, 'boothVotes', '#e0f2f1', '#00796b', '#004d40')}
                            {renderDataSection('Booth Surveys', drawerData.details.boothSurveys, 'boothSurveys', '#fff3e0', '#f57c00', '#e65100')}
                            {renderDataSection('Booth Volunteers', drawerData.details.boothVolunteers, 'boothVolunteers', '#fce4ec', '#c2185b', '#880e4f')}
                            {renderDataSection('Booth Demographics', drawerData.details.boothDemographics, 'boothDemographics', '#f3e5f5', '#7b1fa2', '#4a148c')}
                            {renderDataSection('Events', drawerData.details.events, 'events', '#e1f5fe', '#0277bd', '#01579b')}
                            {renderDataSection('Visits', drawerData.details.visits, 'visits', '#fff9c4', '#f57f17', '#f57f17')}
                            {renderDataSection('Influencers', drawerData.details.influencers, 'influencers', '#e8eaf6', '#3f51b5', '#283593')}
                            {renderDataSection('Party Activities', drawerData.details.partyActivities, 'partyActivities', '#fce4ec', '#e91e63', '#880e4f')}
                            {renderDataSection('Local Issues', drawerData.details.localIssues, 'localIssues', '#f1f8e9', '#689f38', '#33691e')}
                            {renderDataSection('Winning Parties', drawerData.details.winningParties, 'winningParties', '#fff3e0', '#ff6f00', '#e65100')}
                            {renderDataSection('BLA', drawerData.details.bla, 'bla', '#e0f7fa', '#00acc1', '#006064')}
                            {renderDataSection('BLO', drawerData.details.blo, 'blo', '#fce4ec', '#d81b60', '#880e4f')}
                            {renderDataSection('Genders', drawerData.details.genders, 'genders', '#f3e5f5', '#8e24aa', '#4a148c')}
                            {renderDataSection('Codings', drawerData.details.codings, 'codings', '#e8f5e9', '#43a047', '#1b5e20')}
                            {renderDataSection('Caste Lists', drawerData.details.casteLists, 'casteLists', '#e1f5fe', '#039be5', '#01579b')}
                            {renderDataSection('Governments', drawerData.details.governments, 'governments', '#fce4ec', '#ec407a', '#880e4f')}
                            {renderDataSection('Panchayats', drawerData.details.panchayats, 'panchayats', '#f3e5f5', '#ab47bc', '#4a148c')}
                            {renderDataSection('Falliyas', drawerData.details.falliyas, 'falliyas', '#fff3e0', '#ffa726', '#e65100')}
                            {renderDataSection('Local News', drawerData.details.localNews, 'localNews', '#e0f2f1', '#26a69a', '#004d40')}
                        </Stack>
                    ) : null}
                </Box>
            </Drawer>
        </Box>
    );
}
