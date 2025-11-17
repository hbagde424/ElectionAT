# Implementation Guide: useFilterOptionsFromData Hook for All CRUD Pages

## ✅ Files Already Implemented
1. **Booth-votes.jsx** - ✓ Complete
2. **booth.jsx** - ✓ Complete  
3. **booth-survey.jsx** - ✓ Complete

---

## 📋 Implementation Checklist for Remaining Files

### Step 1: Add Import (at top of file)
```javascript
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';
```

### Step 2: Add State for All Data
```javascript
// Add this with other useState declarations
const [allData, setAllData] = useState([]); // Replace 'Data' with your entity name
```

### Step 3: Create Fetch Function
```javascript
// Add this after other functions
const fetchAllDataForFilters = async () => {
  try {
    const hierarchyFilters = {};
    // Add hierarchy filters if needed
    if (userHierarchy) {
      const highestLevel = getUserHighestLevel();
      if (highestLevel) {
        const entityId = userHierarchy[highestLevel]?._id || userHierarchy[highestLevel];
        if (entityId) {
          hierarchyFilters[`${highestLevel}_id`] = entityId;
        }
      }
    }
    
    const data = await fetchAllDataForFilters('/your-endpoint', hierarchyFilters);
    setAllData(data);
  } catch (error) {
    console.error('Failed to fetch data for filters:', error);
  }
};
```

### Step 4: Extract Filter Options
```javascript
// Add this after state declarations
const filterOptions = useFilterOptionsFromData(allData, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
  blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
  booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' }
});
```

### Step 5: Update useEffect
```javascript
useEffect(() => {
  fetchAllDataForFilters(); // Call on mount
  // ... other initialization
}, []);
```

### Step 6: Update JSX (Replace all filter dropdowns)
```javascript
// OLD:
{states.map((state) => ...)}

// NEW:
{filterOptions.states?.map((state) => ...)}

// Apply to: divisions, parliaments, assemblies, blocks, booths, parties, candidates, etc.
```

### Step 7: Simplify fetchReferenceData
```javascript
// Remove fetches for filter data, keep only modal-specific data
const fetchReferenceData = async () => {
  // Keep only: users, electionYears, or other modal-specific data
  // Remove: states, divisions, parliaments, assemblies, blocks, booths
};
```

---

## 📁 File-Specific Implementation Details

### 1. **block.jsx**
**Endpoint:** `/blocks`
**Config:**
```javascript
const filterOptions = useFilterOptionsFromData(allBlocks, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' }
});
```

### 2. **BoothDemographic.jsx**
**Endpoint:** `/booth-demographics`
**Config:**
```javascript
const filterOptions = useFilterOptionsFromData(allDemographics, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
  blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
  booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' }
});
```

### 3. **CandidateListPage.jsx**
**Endpoint:** `/candidates`
**Config:**
```javascript
const filterOptions = useFilterOptionsFromData(allCandidates, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
  parties: { field: 'party_id', nameField: 'name' }
});
```

### 4. **caste-list.jsx**
**Endpoint:** `/caste-list`
**Config:**
```javascript
const filterOptions = useFilterOptionsFromData(allCastes, {
  states: { field: 'state', nameField: 'name' },
  divisions: { field: 'division', nameField: 'name', parentField: 'state' },
  parliaments: { field: 'parliament', nameField: 'name', parentField: 'division' },
  assemblies: { field: 'assembly', nameField: 'name', parentField: 'parliament' },
  blocks: { field: 'block', nameField: 'name', parentField: 'assembly' },
  booths: { field: 'booth', nameField: 'name', parentField: 'block' }
});
```

### 5. **district.jsx**
**Endpoint:** `/districts`
**Config:**
```javascript
const filterOptions = useFilterOptionsFromData(allDistricts, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' }
});
```

### 6. **events.jsx**
**Endpoint:** `/events`
**Config:**
```javascript
const filterOptions = useFilterOptionsFromData(allEvents, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
  blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
  booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' },
  panchayats: { field: 'panchayat_id', nameField: 'name', parentField: 'booth_id' },
  villages: { field: 'village_id', nameField: 'name', parentField: 'panchayat_id' }
});
```

### 7. **Gender.jsx**
**Endpoint:** `/gender`
**Config:**
```javascript
const filterOptions = useFilterOptionsFromData(allGender, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
  blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
  booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' },
  panchayats: { field: 'panchayat_id', nameField: 'name', parentField: 'booth_id' },
  villages: { field: 'village_id', nameField: 'name', parentField: 'panchayat_id' },
  falliyas: { field: 'falliya_id', nameField: 'name', parentField: 'village_id' }
});
```

### 8. **Booth-volunteer.jsx**
**Endpoint:** `/booth-volunteers`
**Config:**
```javascript
const filterOptions = useFilterOptionsFromData(allVolunteers, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
  blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
  booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' },
  parties: { field: 'party_id', nameField: 'name' }
});
```

### 9. **VisitListPage.jsx**
**Endpoint:** `/visits`
**Config:**
```javascript
const filterOptions = useFilterOptionsFromData(allVisits, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
  blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
  booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' },
  candidates: { field: 'candidate_id', nameField: 'name' }
});
```

### 10. **work-status.jsx**
**Endpoint:** `/work-status`
**Config:**
```javascript
const filterOptions = useFilterOptionsFromData(allWorkStatuses, {
  states: { field: 'state_id', nameField: 'name' },
  divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
  parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
  assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
  blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
  booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' },
  panchayats: { field: 'panchayat_id', nameField: 'name', parentField: 'booth_id' },
  villages: { field: 'village_id', nameField: 'name', parentField: 'panchayat_id' },
  falliyas: { field: 'falliya_id', nameField: 'name', parentField: 'village_id' }
});
```

---

## 🔍 Common Patterns

### Pattern 1: State → Division → Parliament → Assembly → Block → Booth
Most common hierarchy. Use this for:
- Booth-related pages
- Survey pages
- Demographics pages

### Pattern 2: Add Panchayat → Village → Falliya
Extended hierarchy for:
- Gender pages
- Government schema
- Work status
- Local issues

### Pattern 3: Party-based filters
For candidate/political pages:
- Add `parties: { field: 'party_id', nameField: 'name' }`
- Add `candidates: { field: 'candidate_id', nameField: 'name' }`

---

## ⚠️ Important Notes

1. **Always use optional chaining** in JSX: `filterOptions.states?.map()`
2. **Keep hierarchy filters** in fetchAllDataForFilters function
3. **Don't override filter options** after initial load
4. **Keep modal-specific data separate** (users, election years)
5. **Test cascading filters** to ensure parent-child relationships work

---

## 🚀 Quick Copy-Paste Template

```javascript
// 1. Import
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

// 2. Add state
const [allData, setAllData] = useState([]);

// 3. Fetch function
const fetchAllForFilters = async () => {
  try {
    const hierarchyFilters = {};
    if (userHierarchy) {
      const highestLevel = getUserHighestLevel();
      if (highestLevel) {
        const entityId = userHierarchy[highestLevel]?._id || userHierarchy[highestLevel];
        if (entityId) {
          hierarchyFilters[`${highestLevel}_id`] = entityId;
        }
      }
    }
    const data = await fetchAllDataForFilters('/YOUR-ENDPOINT', hierarchyFilters);
    setAllData(data);
  } catch (error) {
    console.error('Failed to fetch data for filters:', error);
  }
};

// 4. Extract options
const filterOptions = useFilterOptionsFromData(allData, {
  // Add your config here
});

// 5. Call on mount
useEffect(() => {
  fetchAllForFilters();
}, []);

// 6. Update JSX
{filterOptions.states?.map((state) => (...))}
```

---

## 📊 Progress Tracker

### Priority 1 (High Usage) - ✅ DONE
- [x] Booth-votes.jsx
- [x] booth.jsx
- [x] booth-survey.jsx

### Priority 2 (Common Pages) - TODO
- [ ] Booth-volunteer.jsx
- [ ] VisitListPage.jsx
- [ ] CandidateListPage.jsx
- [ ] events.jsx
- [ ] Gender.jsx
- [ ] work-status.jsx

### Priority 3 (Administrative) - TODO
- [ ] block.jsx
- [ ] district.jsx
- [ ] caste-list.jsx
- [ ] BoothDemographic.jsx

### Priority 4 (Others) - TODO
- [ ] BLOListPage.jsx
- [ ] Coding.jsx
- [ ] division.jsx
- [ ] ElectionType.jsx
- [ ] FalliyaListPage.jsx
- [ ] GovernmentSchema.jsx
- [ ] Influancer.jsx
- [ ] local-issue.jsx
- [ ] LocalDynamicsListPage.jsx
- [ ] PanchayatListPage.jsx
- [ ] parliament.jsx
- [ ] ParliamentCandidate.jsx
- [ ] PartyListPage.jsx
- [ ] PartyActivitiesListPage.jsx
- [ ] potentical.jsx
- [ ] SamitiListPage.jsx
- [ ] VillageListPage.jsx
- [ ] WinningPartiesList.jsx
- [ ] WinningCandidates.jsx

---

## 💡 Tips for Implementation

1. **Start with one file** - Test thoroughly
2. **Follow the pattern** - Once working, copy to similar files
3. **Check console** - Watch for errors during filter population
4. **Test cascading** - Ensure parent-child relationships work
5. **Verify data** - Make sure filters match table data

---

## 🆘 Troubleshooting

### Problem: Filters not showing
**Solution:** Check if `allData` is populated. Add console.log in useEffect.

### Problem: Optional chaining error
**Solution:** Always use `?.` when accessing filterOptions: `filterOptions.states?.map()`

### Problem: Cascading not working
**Solution:** Ensure `parentField` is correctly set in config

### Problem: Duplicate entries
**Solution:** Hook automatically handles duplicates via Set with _id

---

## ✅ Verification Checklist

After implementing in each file, verify:
- [ ] Import statement added
- [ ] State variable added
- [ ] Fetch function created
- [ ] filterOptions extracted with correct config
- [ ] useEffect calls fetch on mount
- [ ] All JSX filter dropdowns updated
- [ ] Optional chaining used everywhere
- [ ] Cascading filters work correctly
- [ ] No console errors
- [ ] Filters match table data
