import { useState, useEffect } from 'react';

/**
 * Custom hook to extract unique filter options from data
 * This ensures filter dropdowns only show values that exist in the current dataset
 * 
 * @param {Array} data - The data array to extract filter options from
 * @param {Object} config - Configuration object specifying which fields to extract
 * @returns {Object} Object containing arrays of unique filter options
 * 
 * Example usage:
 * const filterOptions = useFilterOptionsFromData(booths, {
 *   states: { field: 'state_id', nameField: 'name' },
 *   divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
 *   blocks: { field: 'block_id', nameField: 'name' }
 * });
 */
export const useFilterOptionsFromData = (data, config = {}) => {
  const [filterOptions, setFilterOptions] = useState({});

  useEffect(() => {
    if (!data || data.length === 0) {
      // Reset all configured options to empty arrays
      const emptyOptions = {};
      Object.keys(config).forEach(key => {
        emptyOptions[key] = [];
      });
      setFilterOptions(emptyOptions);
      return;
    }

    const extractedOptions = {};

    // Process each configured field
    Object.entries(config).forEach(([optionKey, fieldConfig]) => {
      const { field, nameField = 'name', parentField = null } = fieldConfig;
      const uniqueItems = [];
      const itemIds = new Set();

      data.forEach(item => {
        const fieldValue = item[field];
        
        if (fieldValue && fieldValue._id && !itemIds.has(fieldValue._id)) {
          itemIds.add(fieldValue._id);
          
          const option = {
            _id: fieldValue._id,
            [nameField]: fieldValue[nameField] || fieldValue.name
          };

          // Include parent reference if specified (for cascading filters)
          if (parentField && item[parentField]) {
            option[parentField] = item[parentField];
          }

          // Copy additional fields if they exist
          if (fieldValue.abbreviation) option.abbreviation = fieldValue.abbreviation;
          if (fieldValue.booth_number) option.booth_number = fieldValue.booth_number;
          if (fieldValue.year) option.year = fieldValue.year;

          uniqueItems.push(option);
        }
      });

      extractedOptions[optionKey] = uniqueItems;
    });

    setFilterOptions(extractedOptions);
  }, [data, JSON.stringify(config)]); // Use JSON.stringify for deep comparison of config

  return filterOptions;
};

/**
 * Fetch all available data for populating filters
 * This function fetches data with a high limit to get all records for filter options
 * 
 * @param {string} endpoint - API endpoint to fetch from (e.g., '/booths', '/booth-votes')
 * @param {Object} hierarchyFilters - Optional hierarchy filters to apply
 * @returns {Promise<Array>} Array of data items
 */
export const fetchAllDataForFilters = async (endpoint, hierarchyFilters = {}) => {
  try {
    const token = localStorage.getItem('serviceToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const apiUrl = import.meta.env.VITE_APP_API_URL || 'https://myhostmanager.co.in/backend/api';
    
    // Build query params from hierarchy filters
    const queryParams = new URLSearchParams();
    queryParams.append('page', '1');
    queryParams.append('limit', '10000');
    
    Object.entries(hierarchyFilters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const url = `${apiUrl}${endpoint}?${queryParams.toString()}`;
    const res = await fetch(url, { headers });
    const json = await res.json();

    if (json.success && json.data) {
      return json.data;
    }
    return [];
  } catch (error) {
    console.error(`Failed to fetch data from ${endpoint}:`, error);
    return [];
  }
};

/**
 * Hook that combines data fetching and filter extraction
 * Use this when you want to fetch data and extract filters in one go
 * 
 * @param {string} endpoint - API endpoint
 * @param {Object} config - Filter configuration
 * @param {Object} hierarchyFilters - Hierarchy filters to apply
 * @returns {Object} { filterOptions, loading, error }
 */
export const useFetchAndExtractFilters = (endpoint, config, hierarchyFilters = {}) => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAllDataForFilters(endpoint, hierarchyFilters);
        setAllData(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching filter data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, JSON.stringify(hierarchyFilters)]);

  const filterOptions = useFilterOptionsFromData(allData, config);

  return { filterOptions, loading, error, allData };
};

export default useFilterOptionsFromData;
