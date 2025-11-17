/**
 * USAGE EXAMPLES FOR useFilterOptionsFromData HOOK
 * ================================================
 * 
 * This document shows how to use the custom filter hook in different CRUD pages
 */

// ============================================================================
// EXAMPLE 1: Simple Usage - Booth Votes Page
// ============================================================================
/*
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

// In your component:
const [allVotes, setAllVotes] = useState([]);

// Fetch all data on mount
useEffect(() => {
  const fetchFilters = async () => {
    const data = await fetchAllDataForFilters('/booth-votes', {
      // Add hierarchy filters if needed
      state_id: userHierarchy?.state?._id,
      division_id: userHierarchy?.division?._id
    });
    setAllVotes(data);
  };
  fetchFilters();
}, []);

// Extract filter options from data
const filterOptions = useFilterOptionsFromData(allVotes, {
  candidates: { 
    field: 'candidate', 
    nameField: 'name' 
  },
  booths: { 
    field: 'booth', 
    nameField: 'name' 
  },
  assemblies: { 
    field: 'assembly', 
    nameField: 'name' 
  },
  parties: { 
    field: 'candidate.party_id', // Can access nested fields
    nameField: 'name' 
  }
});

// Use in JSX:
<MenuItem value="">All Candidates</MenuItem>
{filterOptions.candidates?.map((candidate) => (
  <MenuItem key={candidate._id} value={candidate._id}>
    {candidate.name}
  </MenuItem>
))}
*/


// ============================================================================
// EXAMPLE 2: With Cascading Filters - Booth Page
// ============================================================================
/*
const filterOptions = useFilterOptionsFromData(booths, {
  states: { 
    field: 'state_id', 
    nameField: 'name' 
  },
  divisions: { 
    field: 'division_id', 
    nameField: 'name',
    parentField: 'state_id' // For cascading
  },
  parliaments: { 
    field: 'parliament_id', 
    nameField: 'name',
    parentField: 'division_id'
  },
  assemblies: { 
    field: 'assembly_id', 
    nameField: 'name',
    parentField: 'parliament_id'
  },
  blocks: { 
    field: 'block_id', 
    nameField: 'name',
    parentField: 'assembly_id'
  }
});

// Use with cascading logic:
// <TextField select label="Division" disabled={!filters.state_id}>
//   <MenuItem value="">All Divisions</MenuItem>
//   {filterOptions.divisions
//     ?.filter(d => !filters.state_id || d.state_id?._id === filters.state_id)
//     .map((division) => (
//       <MenuItem key={division._id} value={division._id}>
//         {division.name}
//       </MenuItem>
//     ))}
// </TextField>
*/


// ============================================================================
// EXAMPLE 3: Combined Hook - Fetch + Extract in One Go
// ============================================================================
/*
import { useFetchAndExtractFilters } from 'hooks/useFilterOptionsFromData';

const { filterOptions, loading, error } = useFetchAndExtractFilters(
  '/booth-votes',
  {
    candidates: { field: 'candidate', nameField: 'name' },
    booths: { field: 'booth', nameField: 'name' },
    assemblies: { field: 'assembly', nameField: 'name' }
  },
  {
    // Hierarchy filters
    state_id: userHierarchy?.state?._id
  }
);

// Use directly:
// {loading ? <CircularProgress /> : (
//   filterOptions.candidates?.map(...)
// )}
*/


// ============================================================================
// EXAMPLE 4: Block/District Page with Custom Fields
// ============================================================================
/*
const filterOptions = useFilterOptionsFromData(blocks, {
  states: { 
    field: 'state_id', 
    nameField: 'name' 
  },
  divisions: { 
    field: 'division_id', 
    nameField: 'name',
    parentField: 'state_id'
  },
  parliaments: { 
    field: 'parliament_id', 
    nameField: 'name',
    parentField: 'division_id'
  },
  assemblies: { 
    field: 'assembly_id', 
    nameField: 'name',
    parentField: 'parliament_id'
  }
});
*/


// ============================================================================
// EXAMPLE 5: Candidates Page with Party Info
// ============================================================================
/*
const filterOptions = useFilterOptionsFromData(candidates, {
  parties: { 
    field: 'party_id', 
    nameField: 'name' 
    // abbreviation will be automatically included if present
  },
  assemblies: { 
    field: 'assembly_id', 
    nameField: 'name' 
  },
  electionYears: { 
    field: 'election_year_id', 
    nameField: 'year' 
  }
});
*/


// ============================================================================
// EXAMPLE 6: Manual Fetch with Custom Processing
// ============================================================================
/*
const [filterData, setFilterData] = useState([]);

useEffect(() => {
  const loadFilters = async () => {
    // Fetch with custom parameters
    const data = await fetchAllDataForFilters('/booth-votes', {
      minVotes: 100,
      year: '2024'
    });
    setFilterData(data);
  };
  loadFilters();
}, []);

const filterOptions = useFilterOptionsFromData(filterData, {
  candidates: { field: 'candidate', nameField: 'name' },
  booths: { field: 'booth', nameField: 'name' }
});
*/


// ============================================================================
// STEP-BY-STEP MIGRATION GUIDE
// ============================================================================

/**
 * BEFORE (Old Approach):
 * ----------------------

const [candidates, setCandidates] = useState([]);
const [booths, setBooths] = useState([]);

const fetchReferenceData = async () => {
  const candidatesRes = await fetch(`${API_URL}/candidates`);
  const candidatesData = await candidatesRes.json();
  if (candidatesData.success) setCandidates(candidatesData.data);
  
  const boothsRes = await fetch(`${API_URL}/booths`);
  const boothsData = await boothsRes.json();
  if (boothsData.success) setBooths(boothsData.data);
};

 */

/**
 * AFTER (New Approach):
 * ---------------------

// 1. Add import
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

// 2. Add state for all data
const [allVotes, setAllVotes] = useState([]);

// 3. Fetch all data
useEffect(() => {
  const fetchFilters = async () => {
    const data = await fetchAllDataForFilters('/booth-votes');
    setAllVotes(data);
  };
  fetchFilters();
}, []);

// 4. Extract filters
const filterOptions = useFilterOptionsFromData(allVotes, {
  candidates: { field: 'candidate', nameField: 'name' },
  booths: { field: 'booth', nameField: 'name' }
});

// 5. Use in JSX - Replace old state variables with filterOptions
// OLD: {candidates.map(...)}
// NEW: {filterOptions.candidates?.map(...)}

 */


// ============================================================================
// IMPORTANT NOTES
// ============================================================================
/**
 * 1. The hook automatically handles:
 *    - Duplicate removal (using Set with _id)
 *    - Null/undefined checks
 *    - Nested object access
 *    - Common fields (abbreviation, booth_number, year)
 * 
 * 2. Parent fields for cascading:
 *    - Always include parentField for hierarchical data
 *    - Filter in JSX based on parent selection
 * 
 * 3. Performance:
 *    - Hook uses memoization internally
 *    - Only re-computes when data changes
 *    - Safe to use with large datasets
 * 
 * 4. Type Safety:
 *    - Always use optional chaining: filterOptions.candidates?.map()
 *    - Hook returns empty arrays by default
 */
