# Filter Options from Data - Custom React Hook

## Overview
Yeh custom hook filter dropdowns me **sirf wahi data show karta hai jo table me available hai**, rather than fetching all data from database.

## Benefits
✅ **Better UX**: Users ko sirf relevant options dikhte hain  
✅ **Performance**: Ek hi API call se filters populate ho jate hain  
✅ **Consistency**: Filters always match table data  
✅ **Reusable**: Har CRUD page me easily use kar sakte hain  
✅ **Hierarchy Support**: User permissions/hierarchy ko respect karta hai

---

## Quick Start

### 1. Import the Hook
```javascript
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';
```

### 2. Fetch All Data (One Time)
```javascript
const [allData, setAllData] = useState([]);

useEffect(() => {
  const fetchFilters = async () => {
    const data = await fetchAllDataForFilters('/booth-votes', {
      // Optional: Add hierarchy filters
      state_id: userHierarchy?.state?._id
    });
    setAllData(data);
  };
  fetchFilters();
}, []);
```

### 3. Extract Filter Options
```javascript
const filterOptions = useFilterOptionsFromData(allData, {
  candidates: { field: 'candidate', nameField: 'name' },
  booths: { field: 'booth', nameField: 'name' },
  assemblies: { field: 'assembly', nameField: 'name' }
});
```

### 4. Use in JSX
```javascript
<TextField select label="Candidate">
  <MenuItem value="">All Candidates</MenuItem>
  {filterOptions.candidates?.map((candidate) => (
    <MenuItem key={candidate._id} value={candidate._id}>
      {candidate.name}
    </MenuItem>
  ))}
</TextField>
```

---

## Common Use Cases

### Booth Votes Page
```javascript
const filterOptions = useFilterOptionsFromData(allVotes, {
  candidates: { field: 'candidate', nameField: 'name' },
  booths: { field: 'booth', nameField: 'name' },
  assemblies: { field: 'assembly', nameField: 'name' },
  parties: { field: 'candidate.party_id', nameField: 'name' }
});
```

### Booth Page (with Cascading)
```javascript
const filterOptions = useFilterOptionsFromData(booths, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
  blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' }
});
```

### Candidates Page
```javascript
const filterOptions = useFilterOptionsFromData(candidates, {
  parties: { field: 'party_id', nameField: 'name' },
  assemblies: { field: 'assembly_id', nameField: 'name' },
  electionYears: { field: 'election_year_id', nameField: 'year' }
});
```

---

## Configuration Options

### Field Config Object
```javascript
{
  field: 'state_id',        // Required: Field name in data object
  nameField: 'name',        // Optional: Display field (default: 'name')
  parentField: 'division_id' // Optional: For cascading filters
}
```

### Common Fields Auto-Included
- `abbreviation` (for parties, etc.)
- `booth_number` (for booths)
- `year` (for election years)

---

## Migration Steps

### Old Approach (❌ Remove This)
```javascript
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
```

### New Approach (✅ Use This)
```javascript
// 1. Import
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

// 2. Single state for all data
const [allVotes, setAllVotes] = useState([]);

// 3. Single fetch
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

// 5. Update JSX
// OLD: {candidates.map(...)}
// NEW: {filterOptions.candidates?.map(...)}
```

---

## Advanced Features

### 1. Combined Hook (Fetch + Extract)
```javascript
const { filterOptions, loading, error } = useFetchAndExtractFilters(
  '/booth-votes',
  {
    candidates: { field: 'candidate', nameField: 'name' },
    booths: { field: 'booth', nameField: 'name' }
  },
  { state_id: userHierarchy?.state?._id }
);
```

### 2. Cascading Filters in JSX
```javascript
<TextField select label="Division" disabled={!filters.state_id}>
  <MenuItem value="">All Divisions</MenuItem>
  {filterOptions.divisions
    ?.filter(d => !filters.state_id || d.state_id?._id === filters.state_id)
    .map((division) => (
      <MenuItem key={division._id} value={division._id}>
        {division.name}
      </MenuItem>
    ))}
</TextField>
```

---

## Files Modified

### ✅ Already Updated
- ✅ `Booth-votes.jsx` - Booth votes page
- ✅ `booth.jsx` - Booth management page

### 📝 Ready to Update (Use the hook)
All other CRUD pages can use this hook by following the migration steps above:
- BLOListPage.jsx
- block.jsx
- BoothDemographic.jsx
- booth-survey.jsx
- CandidateListPage.jsx
- caste-list.jsx
- Coding.jsx
- district.jsx
- division.jsx
- ElectionType.jsx
- events.jsx
- FalliyaListPage.jsx
- Gender.jsx
- GovernmentSchema.jsx
- Influancer.jsx
- local-issue.jsx
- LocalDynamicsListPage.jsx
- PanchayatListPage.jsx
- parliament.jsx
- ParliamentCandidate.jsx
- PartyListPage.jsx
- PartyActivitiesListPage.jsx
- potentical.jsx
- SamitiListPage.jsx
- VillageListPage.jsx
- VisitListPage.jsx
- Booth-volunteer.jsx
- WinningPartiesList.jsx
- WinningCandidates.jsx
- work-status.jsx

---

## Important Notes

### ⚠️ Always Use Optional Chaining
```javascript
filterOptions.candidates?.map(...)  // ✅ Good
filterOptions.candidates.map(...)   // ❌ Bad - can crash if undefined
```

### ⚠️ Don't Override Filter Options
Once populated from data, don't re-fetch or override filter options unless data changes.

### ⚠️ Keep Reference Data for Modals
Some data (like election years, users) might be needed for modals but not for filters. Keep them separate:
```javascript
// For filters (from data)
const filterOptions = useFilterOptionsFromData(...);

// For modals (fetch separately)
const [electionYears, setElectionYears] = useState([]);
```

---

## Support & Questions

For detailed examples, see:
- `FILTER_HOOK_USAGE_EXAMPLES.js` - Comprehensive examples
- `useFilterOptionsFromData.js` - Hook implementation

Questions? Check the examples file for your specific use case!
