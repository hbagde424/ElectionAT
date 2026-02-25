/**
 * Utility functions for handling user hierarchy and geographic filtering
 */

/**
 * Extract ID from either an ObjectId string or an object with _id property
 */
export const extractId = (value) => {
  if (!value) return null;
  
  // If it's a string, return it as-is
  if (typeof value === 'string') {
    console.log('extractId: string value:', value);
    return value;
  }
  
  // If it's an object with _id, return the _id
  if (typeof value === 'object') {
    if (value._id) {
      const id = String(value._id);
      console.log('extractId: object with _id:', id);
      return id;
    }
    // If it's an object without _id, try to convert to string
    const str = String(value);
    console.log('extractId: object without _id, converted to string:', str);
    return str;
  }
  
  // For any other type, convert to string
  const str = String(value);
  console.log('extractId: other type, converted to string:', str);
  return str;
};

/**
 * Check if two IDs match (handles both string and object formats)
 */
export const idsMatch = (id1, id2) => {
  if (!id1 || !id2) return false;
  
  const extracted1 = extractId(id1);
  const extracted2 = extractId(id2);
  
  if (!extracted1 || !extracted2) {
    console.log('idsMatch: One of the IDs is null/undefined', { extracted1, extracted2 });
    return false;
  }
  
  const match = extracted1 === extracted2;
  console.log('idsMatch:', extracted1, '===', extracted2, '?', match);
  return match;
};

/**
 * Filter assemblies based on user hierarchy
 * Returns all assemblies if no hierarchy restrictions, otherwise filters based on highest level
 */
export const filterAssembliesByHierarchy = (assemblies, userHierarchy) => {
  console.log('=== filterAssembliesByHierarchy ===');
  console.log('Assemblies count:', assemblies?.length);
  console.log('User hierarchy:', JSON.stringify(userHierarchy, null, 2));

  if (!assemblies || assemblies.length === 0) {
    console.log('No assemblies, returning empty array');
    return [];
  }

  if (!userHierarchy) {
    console.log('No hierarchy, returning all assemblies');
    return assemblies;
  }

  // Check if user has ANY geographic restriction
  const hasRestriction = userHierarchy.assembly || userHierarchy.parliament || 
                         userHierarchy.division || userHierarchy.state;

  if (!hasRestriction) {
    console.log('No geographic restrictions, returning all assemblies');
    return assemblies;
  }

  // If user has assembly-level access, show only that assembly
  if (userHierarchy.assembly) {
    const assemblyId = extractId(userHierarchy.assembly);
    console.log('Filtering by assembly ID:', assemblyId);
    console.log('Sample assembly IDs:', assemblies.slice(0, 3).map(a => ({ name: a.name, id: extractId(a._id) })));
    
    const filtered = assemblies.filter(a => {
      const aId = extractId(a._id);
      const match = aId === assemblyId;
      if (match) {
        console.log('MATCH FOUND:', a.name, aId);
      }
      return match;
    });
    console.log('Filtered result:', filtered.length, 'assemblies');
    return filtered;
  }

  // If user has parliament-level access, show all assemblies in that parliament
  if (userHierarchy.parliament) {
    const parliamentId = extractId(userHierarchy.parliament);
    console.log('Filtering by parliament ID:', parliamentId);
    const filtered = assemblies.filter(a => {
      const pId = extractId(a.parliament_id);
      return pId === parliamentId;
    });
    console.log('Filtered result:', filtered.length, 'assemblies');
    return filtered;
  }

  // If user has division-level access, show all assemblies in that division
  if (userHierarchy.division) {
    const divisionId = extractId(userHierarchy.division);
    console.log('Filtering by division ID:', divisionId);
    const filtered = assemblies.filter(a => {
      const dId = extractId(a.division_id);
      return dId === divisionId;
    });
    console.log('Filtered result:', filtered.length, 'assemblies');
    return filtered;
  }

  // If user has state-level access, show all assemblies in that state
  if (userHierarchy.state) {
    const stateId = extractId(userHierarchy.state);
    console.log('Filtering by state ID:', stateId);
    const filtered = assemblies.filter(a => {
      const sId = extractId(a.state_id);
      return sId === stateId;
    });
    console.log('Filtered result:', filtered.length, 'assemblies');
    return filtered;
  }

  // Fallback: return all
  console.log('Fallback: returning all assemblies');
  return assemblies;
};
