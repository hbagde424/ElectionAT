// src/contexts/MapDataContext.js
import { createContext, useState, useEffect, useContext } from 'react';
import { mapService } from '../utils/api';
import { useAuth } from './JWTContext';

// Create context
const MapDataContext = createContext();

export const MapDataProvider = ({ children }) => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn } = useAuth();

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const response = await mapService.getMapData();
      setMapData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchMapData();
    }
  }, [isLoggedIn]);

  const value = {
    mapData,
    loading,
    error,
    refresh: fetchMapData
  };

  return (
    <MapDataContext.Provider value={value}>
      {children}
    </MapDataContext.Provider>
  );
};


export const useMapData = () => {
  const context = useContext(MapDataContext);
  if (context === undefined) {
    throw new Error('useMapData must be used within a MapDataProvider');
  }
  return context;
};

// Named export for the context itself
export { MapDataContext };