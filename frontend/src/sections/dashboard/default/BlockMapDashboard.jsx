import { useEffect, useState, useRef, useMemo } from 'react';
import { Box, Typography, Alert, Drawer, Stack, Chip, CircularProgress, Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import IconButton from 'components/@extended/IconButton';
import { usePermissions } from 'contexts/PermissionContext';

export default function BlockMapDashboard() {
    const { userHierarchy } = usePermissions();
    const [blockGeoJSON, setBlockGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [expandedSections, setExpandedSections] = useState({});
    const [mapZoom, setMapZoom] = useState(7);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

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
            const fieldsToSkip = ['_id', 'id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'createdAt', 'updatedAt', '__v', 'block_id'];
            
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

    const toggleSection = (sectionName) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    const fetchBlockDetailsByPolygon = async (blockId, blockName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            if (blockId) {
                try {
                    // Fetch block details and related data
                    const endpoints = [
                        { key: 'block', url: `/blocks/${blockId}` },
                        { key: 'booths', url: `/booths?block=${blockId}&all=true` },
                        { key: 'blockVotes', url: `/block-votes?block=${blockId}&all=true` },
                        { key: 'boothVotes', url: `/booth-votes?block=${blockId}&all=true` },
                        { key: 'events', url: `/events?block=${blockId}&all=true` },
                        { key: 'visits', url: `/visits?block=${blockId}&all=true` },
                        { key: 'influencers', url: `/influencers?block=${blockId}&all=true` },
                        { key: 'partyActivities', url: `/party-activities?block=${blockId}&all=true` },
                        { key: 'localIssues', url: `/local-issues?block=${blockId}&all=true` },
                        { key: 'bla', url: `/bla?block=${blockId}&all=true` },
                        { key: 'blo', url: `/blo?block=${blockId}&all=true` },
                        { key: 'genders', url: `/genders?block=${blockId}&all=true` },
                        { key: 'codings', url: `/codings?block=${blockId}&all=true` },
                        { key: 'casteLists', url: `/caste-lists?block=${blockId}&all=true` },
                        { key: 'governments', url: `/governments?block=${blockId}&all=true` }
                    ];

                    const results = await Promise.allSettled(
                        endpoints.map(({ url }) =>
                            fetch(`${import.meta.env.VITE_APP_API_URL}${url}`, { headers }).then(r => r.json())
                        )
                    );

                    const details = {};
                    endpoints.forEach(({ key }, idx) => {
                        const result = results[idx];
                        if (result.status === 'fulfilled' && result.value?.success) {
                            if (key === 'block') {
                                details[key] = result.value.data;
                            } else {
                                const data = result.value.data || [];
                                details[key] = { count: data.length, data: data.slice(0, 5) };
                            }
                        } else {
                            if (key === 'block') {
                                details[key] = null;
                            } else {
                                details[key] = { count: 0, data: [] };
                            }
                        }
                    });

                    if (details.block) {
                        setDrawerData({ loading: false, blockName: blockName, blockNo: details.block.block_no, details });
                    } else {
                        setDrawerData({ loading: false, blockName: blockName, details: null, error: 'Block not found' });
                    }
                } catch (e) {
                    console.warn('Failed to fetch block details:', e);
                    setDrawerData({ loading: false, blockName: blockName, details: null, error: 'Failed to load block details' });
                }
            } else {
                setDrawerData({ loading: false, blockName: blockName, details: null, error: 'Invalid block ID' });
            }
        } catch (err) {
            console.error('Failed to fetch block details by polygon:', err);
            setDrawerData({ loading: false, blockName: blockName, details: null, error: err.message });
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

    const loadBlockPolygons = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/blocks?limit=5000`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            
            if (!json.success || !Array.isArray(json.data)) {
                throw new Error('Invalid response format');
            }

            let blocksToUse = json.data;
            if (userHierarchy?.block) {
                blocksToUse = json.data.filter(b => String(b._id) === String(userHierarchy.block._id || userHierarchy.block));
            } else if (userHierarchy?.assembly) {
                blocksToUse = json.data.filter(b => String(b.assembly_id?._id || b.assembly_id) === String(userHierarchy.assembly._id || userHierarchy.assembly));
            } else if (userHierarchy?.parliament) {
                blocksToUse = json.data.filter(b => String(b.parliament_id?._id || b.parliament_id) === String(userHierarchy.parliament._id || userHierarchy.parliament));
            } else if (userHierarchy?.division) {
                blocksToUse = json.data.filter(b => String(b.division_id?._id || b.division_id) === String(userHierarchy.division._id || userHierarchy.division));
            } else if (userHierarchy?.state) {
                blocksToUse = json.data.filter(b => String(b.state_id?._id || b.state_id) === String(userHierarchy.state._id || userHierarchy.state));
            }

            const features = [];
            blocksToUse.forEach(block => {
                if (block.polygon) {
                    if (block.polygon.type === 'Feature') {
                        features.push({
                            ...block.polygon,
                            properties: {
                                ...block.polygon.properties,
                                block_id: block._id,
                                block_name: block.name,
                                block_no: block.block_no
                            }
                        });
                    } else if (block.polygon.type === 'FeatureCollection' && Array.isArray(block.polygon.features)) {
                        block.polygon.features.forEach(feat => {
                            features.push({
                                ...feat,
                                properties: {
                                    ...feat.properties,
                                    block_id: block._id,
                                    block_name: block.name,
                                    block_no: block.block_no
                                }
                            });
                        });
                    }
                }
            });

            if (!features.length) {
                setMapError('No blocks with polygon data available');
                setBlockGeoJSON(null);
            } else {
                const geoJSON = { type: 'FeatureCollection', features };
                setBlockGeoJSON(geoJSON);
                setMapError('');
                setTimeout(() => zoomToFeatures(features), 100);
            }
        } catch (e) {
            console.error('Failed to load block polygons:', e);
            setMapError(`Failed to load polygon data: ${e.message}`);
            setBlockGeoJSON(null);
        }
    };

    useEffect(() => {
        loadBlockPolygons();
    }, [userHierarchy]);

    return (
        <Box sx={{ p: 2, pb: 0 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Block Map</Typography>
            {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
            {!blockGeoJSON && !mapError && (
                <Alert severity="info" sx={{ mb: 1 }}>Loading map data...</Alert>
            )}
            <MapContainerStyled sx={{ minHeight: 400 }}>
                {mapboxToken ? (
                    <Map
                        ref={mapRef}
                        mapboxAccessToken={mapboxToken}
                        initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 7 }}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        interactiveLayerIds={blockGeoJSON ? ['block-fill'] : []}
                        onZoom={(e) => setMapZoom(e.viewState.zoom)}
                        onClick={(e) => {
                            if (!blockGeoJSON) return;
                            try {
                                const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY };
                                let features = e.features || [];
                                if ((!features || features.length === 0) && map && point) {
                                    features = map.queryRenderedFeatures([point.x, point.y], { layers: ['block-fill'] }) || [];
                                }
                                const f = features.find(f => f.layer && f.layer.id === 'block-fill') || features[0];
                                if (f) {
                                    const props = f.properties || {};
                                    const blockId = props.block_id || '';
                                    const blockName = props.block_name || '';
                                    setDrawerData({ loading: true, blockName: blockName, details: null });
                                    setDrawerOpen(true);
                                    fetchBlockDetailsByPolygon(blockId, blockName);
                                }
                            } catch (err) {
                                console.warn('Map click handler error:', err);
                            }
                        }}
                    >
                        <MapControl />
                        {blockGeoJSON && (
                            <Source id="block-polygons" type="geojson" data={blockGeoJSON}>
                                <Layer id="block-fill" type="fill" paint={{ 'fill-color': '#4CAF50', 'fill-opacity': 0.22 }} />
                                <Layer id="block-outline" type="line" paint={{ 'line-color': '#388E3C', 'line-width': 2 }} />
                            </Source>
                        )}
                        {blockGeoJSON && mapZoom > 6 && (() => {
                            const labelFeatures = [];
                            blockGeoJSON.features.forEach((feature) => {
                                if (!feature.geometry) return;
                                
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
                                            name: feature.properties?.block_name || '', 
                                            blockNo: String(feature.properties?.block_no || '') 
                                        } 
                                    });
                                }
                            });
                            
                            return labelFeatures.length > 0 ? (
                                <Source id="block-labels-source" type="geojson" data={{ type: 'FeatureCollection', features: labelFeatures }}>
                                    <Layer 
                                        id="block-label-layer" 
                                        type="symbol" 
                                        layout={{ 
                                            'text-field': ['concat', ['get', 'name'], '\n', ['get', 'blockNo']], 
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
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Block Details</Typography>
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
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Block Name</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{drawerData.details.block?.name || 'N/A'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Block Number</Typography>
                                        <Chip label={drawerData.details.block?.block_no || 'N/A'} size="small" color="primary" />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Type</Typography>
                                        <Typography variant="body2">{drawerData.details.block?.type || 'N/A'}</Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <Box sx={{ p: 2, backgroundColor: '#f3e5f5', borderRadius: 1, borderLeft: '4px solid #7b1fa2' }}>
                                <Typography variant="subtitle2" sx={{ color: '#6a1b9a', fontWeight: 600, mb: 1 }}>Hierarchy</Typography>
                                <Stack spacing={1}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>State</Typography>
                                        <Chip label={drawerData.details.block?.state_id?.name || 'N/A'} size="small" variant="outlined" />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Division</Typography>
                                        <Chip label={drawerData.details.block?.division_id?.name || 'N/A'} size="small" variant="outlined" />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Parliament</Typography>
                                        <Chip label={drawerData.details.block?.parliament_id?.name || 'N/A'} size="small" variant="outlined" />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Assembly</Typography>
                                        <Chip label={drawerData.details.block?.assembly_id?.name || 'N/A'} size="small" variant="outlined" />
                                    </Box>
                                </Stack>
                            </Box>

                            {renderDataSection('Booths', drawerData.details.booths, 'booths', '#e8f5e9', '#388e3c', '#2e7d32')}
                            {renderDataSection('Block Votes', drawerData.details.blockVotes, 'blockVotes', '#fff3e0', '#f57c00', '#e65100')}
                            {renderDataSection('Booth Votes', drawerData.details.boothVotes, 'boothVotes', '#fce4ec', '#c2185b', '#880e4f')}
                            {renderDataSection('Events', drawerData.details.events, 'events', '#e0f2f1', '#00796b', '#004d40')}
                            {renderDataSection('Visits', drawerData.details.visits, 'visits', '#f3e5f5', '#7b1fa2', '#4a148c')}
                            {renderDataSection('Influencers', drawerData.details.influencers, 'influencers', '#e1f5fe', '#0277bd', '#01579b')}
                            {renderDataSection('Party Activities', drawerData.details.partyActivities, 'partyActivities', '#fff9c4', '#f57f17', '#f57f17')}
                            {renderDataSection('Local Issues', drawerData.details.localIssues, 'localIssues', '#e8eaf6', '#3f51b5', '#283593')}
                            {renderDataSection('BLA', drawerData.details.bla, 'bla', '#fce4ec', '#e91e63', '#880e4f')}
                            {renderDataSection('BLO', drawerData.details.blo, 'blo', '#f1f8e9', '#689f38', '#33691e')}
                            {renderDataSection('Genders', drawerData.details.genders, 'genders', '#fff3e0', '#ff6f00', '#e65100')}
                            {renderDataSection('Codings', drawerData.details.codings, 'codings', '#e0f7fa', '#00acc1', '#006064')}
                            {renderDataSection('Caste Lists', drawerData.details.casteLists, 'casteLists', '#fce4ec', '#d81b60', '#880e4f')}
                            {renderDataSection('Governments', drawerData.details.governments, 'governments', '#f3e5f5', '#8e24aa', '#4a148c')}
                        </Stack>
                    ) : null}
                </Box>
            </Drawer>
        </Box>
    );
}
