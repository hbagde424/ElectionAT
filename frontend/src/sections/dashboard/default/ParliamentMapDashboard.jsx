import { useEffect, useState, useRef, useMemo } from 'react';
import { Box, Typography, Alert, Drawer, Stack, Chip, CircularProgress, Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import IconButton from 'components/@extended/IconButton';
import { usePermissions } from 'contexts/PermissionContext';

export default function ParliamentMapDashboard() {
    const { userHierarchy } = usePermissions();
    const [parliamentGeoJSON, setParliamentGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [parliamentDataMap, setParliamentDataMap] = useState({});
    const [expandedSections, setExpandedSections] = useState({});
    const [mapZoom, setMapZoom] = useState(5);
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
            const fieldsToSkip = ['_id', 'id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'createdAt', 'updatedAt', '__v', 'parliament_id'];
            
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

    const fetchParliamentDetailsByPolygon = async (parliamentId, parliamentName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const endpoints = [
                { key: 'assemblies', url: `/assemblies?parliament=${parliamentId}&all=true` },
                { key: 'blocks', url: `/blocks?parliament=${parliamentId}&all=true` },
                { key: 'booths', url: `/booths?parliament=${parliamentId}&all=true` },
                { key: 'candidates', url: `/candidates?parliament=${parliamentId}&all=true` },
                { key: 'parliamentVotes', url: `/parliament-votes?parliament=${parliamentId}&all=true` },
                { key: 'assemblyVotes', url: `/assembly-votes?parliament=${parliamentId}&all=true` },
                { key: 'boothVotes', url: `/booth-votes?parliament=${parliamentId}&all=true` },
                { key: 'blockVotes', url: `/block-votes?parliament=${parliamentId}&all=true` },
                { key: 'events', url: `/events?parliament=${parliamentId}&all=true` },
                { key: 'visits', url: `/visits?parliament=${parliamentId}&all=true` },
                { key: 'influencers', url: `/influencers?parliament=${parliamentId}&all=true` },
                { key: 'partyActivities', url: `/party-activities?parliament=${parliamentId}&all=true` },
                { key: 'localIssues', url: `/local-issues?parliament=${parliamentId}&all=true` },
                { key: 'winningParties', url: `/winning-parties?parliament=${parliamentId}&all=true` },
                { key: 'bla', url: `/bla?parliament=${parliamentId}&all=true` },
                { key: 'blo', url: `/blo?parliament=${parliamentId}&all=true` },
                { key: 'genders', url: `/genders?parliament=${parliamentId}&all=true` },
                { key: 'codings', url: `/codings?parliament=${parliamentId}&all=true` },
                { key: 'casteLists', url: `/caste-lists?parliament=${parliamentId}&all=true` },
                { key: 'governments', url: `/governments?parliament=${parliamentId}&all=true` }
            ];

            const results = await Promise.allSettled(
                endpoints.map(({ url }) =>
                    fetch(`${import.meta.env.VITE_APP_API_URL}${url}`, { headers }).then(r => r.json())
                )
            );

            const details = { parliament: parliamentDataMap[parliamentId] };
            endpoints.forEach(({ key }, idx) => {
                const result = results[idx];
                if (result.status === 'fulfilled' && result.value?.success) {
                    const data = result.value.data || [];
                    details[key] = { count: data.length, data: data.slice(0, 5) };
                } else {
                    details[key] = { count: 0, data: [] };
                }
            });

            setDrawerData({ loading: false, parliamentName, details, error: null });
        } catch (error) {
            console.error('Failed to fetch parliament details:', error);
            setDrawerData({ loading: false, parliamentName, details: null, error: 'Failed to load details' });
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

    const loadParliamentPolygons = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?limit=5000`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            
            if (!json.success || !Array.isArray(json.data)) {
                throw new Error('Invalid response format');
            }

            const parliamentMap = {};
            json.data.forEach(parliament => {
                parliamentMap[parliament._id] = parliament;
            });
            setParliamentDataMap(parliamentMap);

            const features = [];
            json.data.forEach(parliament => {
                if (parliament.polygon) {
                    if (parliament.polygon.type === 'Feature') {
                        features.push({
                            ...parliament.polygon,
                            properties: { 
                                parliament_id: parliament._id,
                                parliament_name: parliament.name 
                            }
                        });
                    } else if (parliament.polygon.type === 'FeatureCollection' && Array.isArray(parliament.polygon.features)) {
                        parliament.polygon.features.forEach(feat => {
                            features.push({
                                ...feat,
                                properties: { 
                                    parliament_id: parliament._id,
                                    parliament_name: parliament.name 
                                }
                            });
                        });
                    }
                }
            });

            if (!features.length) {
                setMapError('No parliaments with polygon data available');
                setParliamentGeoJSON(null);
            } else {
                const geoJSON = { type: 'FeatureCollection', features };
                setParliamentGeoJSON(geoJSON);
                setMapError('');
                setTimeout(() => zoomToFeatures(features), 100);
            }
        } catch (e) {
            console.error('Failed to load parliament polygons:', e);
            setMapError(`Failed to load polygon data: ${e.message}`);
            setParliamentGeoJSON(null);
        }
    };

    useEffect(() => {
        loadParliamentPolygons();
    }, [userHierarchy]);

    return (
        <Box sx={{ p: 2, pb: 0 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Parliament Map</Typography>
            {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
            {!parliamentGeoJSON && !mapError && (
                <Alert severity="info" sx={{ mb: 1 }}>Loading map data...</Alert>
            )}
            <MapContainerStyled sx={{ minHeight: 400 }}>
                {mapboxToken ? (
                    <Map
                        ref={mapRef}
                        mapboxAccessToken={mapboxToken}
                        initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 5 }}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        interactiveLayerIds={parliamentGeoJSON ? ['parliament-fill'] : []}
                        onZoom={(e) => setMapZoom(e.viewState.zoom)}
                        onClick={(e) => {
                            if (!parliamentGeoJSON) return;
                            try {
                                const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY };
                                let features = e.features || [];
                                if ((!features || features.length === 0) && map && point) {
                                    features = map.queryRenderedFeatures([point.x, point.y], { layers: ['parliament-fill'] }) || [];
                                }
                                const f = features.find(f => f.layer && f.layer.id === 'parliament-fill') || features[0];
                                if (f) {
                                    const props = f.properties || {};
                                    const parliamentId = props.parliament_id || '';
                                    const parliamentName = props.parliament_name || '';
                                    setDrawerData({ loading: true, parliamentName: parliamentName, details: null });
                                    setDrawerOpen(true);
                                    fetchParliamentDetailsByPolygon(parliamentId, parliamentName);
                                }
                            } catch (err) {
                                console.warn('Map click handler error:', err);
                            }
                        }}
                    >
                        <MapControl />
                        {parliamentGeoJSON && (
                            <Source id="parliament-polygons" type="geojson" data={parliamentGeoJSON}>
                                <Layer id="parliament-fill" type="fill" paint={{ 'fill-color': '#FF5722', 'fill-opacity': 0.22 }} />
                                <Layer id="parliament-outline" type="line" paint={{ 'line-color': '#E64A19', 'line-width': 2 }} />
                            </Source>
                        )}
                        {parliamentGeoJSON && parliamentDataMap && mapZoom > 5 && (() => {
                            const labelFeatures = [];
                            parliamentGeoJSON.features.forEach((feature) => {
                                const parliamentId = feature.properties?.parliament_id;
                                const parliamentData = parliamentDataMap[parliamentId];
                                if (!parliamentData || !feature.geometry) return;
                                
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
                                            name: parliamentData.name || '', 
                                            parliamentNo: String(parliamentData.parliament_no || '') 
                                        } 
                                    });
                                }
                            });
                            
                            return labelFeatures.length > 0 ? (
                                <Source id="parliament-labels-source" type="geojson" data={{ type: 'FeatureCollection', features: labelFeatures }}>
                                    <Layer 
                                        id="parliament-label-layer" 
                                        type="symbol" 
                                        layout={{ 
                                            'text-field': ['concat', ['get', 'name'], '\n', ['get', 'parliamentNo']], 
                                            'text-size': 10, 
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
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Parliament Details</Typography>
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
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Parliament Name</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{drawerData.details.parliament?.name || 'N/A'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>PC Number</Typography>
                                        <Chip label={drawerData.details.parliament?.parliament_no || 'N/A'} size="small" color="primary" />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Category</Typography>
                                        <Typography variant="body2">{drawerData.details.parliament?.category || 'N/A'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Regional Type</Typography>
                                        <Typography variant="body2">{drawerData.details.parliament?.regional_type || 'N/A'}</Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            {renderDataSection('Assemblies', drawerData.details.assemblies, 'assemblies', '#e8f5e9', '#388e3c', '#2e7d32')}
                            {renderDataSection('Blocks', drawerData.details.blocks, 'blocks', '#fff3e0', '#f57c00', '#e65100')}
                            {renderDataSection('Booths', drawerData.details.booths, 'booths', '#fce4ec', '#c2185b', '#880e4f')}
                            {renderDataSection('Candidates', drawerData.details.candidates, 'candidates', '#e0f2f1', '#00796b', '#004d40')}
                            {renderDataSection('Parliament Votes', drawerData.details.parliamentVotes, 'parliamentVotes', '#f3e5f5', '#7b1fa2', '#4a148c')}
                            {renderDataSection('Assembly Votes', drawerData.details.assemblyVotes, 'assemblyVotes', '#e1f5fe', '#0277bd', '#01579b')}
                            {renderDataSection('Booth Votes', drawerData.details.boothVotes, 'boothVotes', '#fff9c4', '#f57f17', '#f57f17')}
                            {renderDataSection('Block Votes', drawerData.details.blockVotes, 'blockVotes', '#e8eaf6', '#3f51b5', '#283593')}
                            {renderDataSection('Events', drawerData.details.events, 'events', '#fce4ec', '#e91e63', '#880e4f')}
                            {renderDataSection('Visits', drawerData.details.visits, 'visits', '#f1f8e9', '#689f38', '#33691e')}
                            {renderDataSection('Influencers', drawerData.details.influencers, 'influencers', '#fff3e0', '#ff6f00', '#e65100')}
                            {renderDataSection('Party Activities', drawerData.details.partyActivities, 'partyActivities', '#e0f7fa', '#00acc1', '#006064')}
                            {renderDataSection('Local Issues', drawerData.details.localIssues, 'localIssues', '#fce4ec', '#d81b60', '#880e4f')}
                            {renderDataSection('Winning Parties', drawerData.details.winningParties, 'winningParties', '#f3e5f5', '#8e24aa', '#4a148c')}
                            {renderDataSection('BLA', drawerData.details.bla, 'bla', '#e8f5e9', '#43a047', '#1b5e20')}
                            {renderDataSection('BLO', drawerData.details.blo, 'blo', '#e1f5fe', '#039be5', '#01579b')}
                            {renderDataSection('Genders', drawerData.details.genders, 'genders', '#fce4ec', '#ec407a', '#880e4f')}
                            {renderDataSection('Codings', drawerData.details.codings, 'codings', '#f3e5f5', '#ab47bc', '#4a148c')}
                            {renderDataSection('Caste Lists', drawerData.details.casteLists, 'casteLists', '#fff3e0', '#ffa726', '#e65100')}
                            {renderDataSection('Governments', drawerData.details.governments, 'governments', '#e0f2f1', '#26a69a', '#004d40')}
                        </Stack>
                    ) : null}
                </Box>
            </Drawer>
        </Box>
    );
}
