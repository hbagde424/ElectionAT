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

/**
 * Filter divisions based on user hierarchy
 * Returns all divisions if no hierarchy restrictions, otherwise filters based on highest level
 */
export const filterDivisionsByHierarchy = (divisions, userHierarchy) => {
  console.log('=== filterDivisionsByHierarchy ===');
  console.log('Divisions count:', divisions?.length);
  console.log('User hierarchy:', JSON.stringify(userHierarchy, null, 2));

  if (!divisions || divisions.length === 0) {
    console.log('No divisions, returning empty array');
    return [];
  }

  if (!userHierarchy) {
    console.log('No hierarchy, returning all divisions');
    return divisions;
  }

  // Check if user has ANY geographic restriction
  const hasRestriction = userHierarchy.division || userHierarchy.state;

  if (!hasRestriction) {
    console.log('No geographic restrictions, returning all divisions');
    return divisions;
  }

  // If user has division-level access, show only that division
  if (userHierarchy.division) {
    const divisionId = extractId(userHierarchy.division);
    console.log('🔐 Filtering by division ID:', divisionId);
    console.log('Sample division IDs:', divisions.slice(0, 3).map(d => {
      const id = extractId(d.properties?._id || d._id || d.id);
      return { 
        name: d.properties?.DIVISION_NAME || d.name, 
        id: id
      };
    }));
    
    const filtered = divisions.filter(d => {
      // Try multiple ID fields from properties
      const dId = extractId(d.properties?._id || d.properties?.id || d._id || d.id);
      const match = String(dId) === String(divisionId);
      if (match) {
        console.log('✅ MATCH FOUND:', d.properties?.DIVISION_NAME || d.name, dId);
      }
      return match;
    });
    console.log('🔐 Filtered result:', filtered.length, 'divisions');
    return filtered;
  }

  // If user has state-level access, show all divisions in that state
  if (userHierarchy.state) {
    const stateId = extractId(userHierarchy.state);
    console.log('🔐 Filtering by state ID:', stateId);
    const filtered = divisions.filter(d => {
      const sId = extractId(d.properties?.state_id || d.state_id);
      return String(sId) === String(stateId);
    });
    console.log('🔐 Filtered result:', filtered.length, 'divisions');
    return filtered;
  }

  // Fallback: return all
  console.log('Fallback: returning all divisions');
  return divisions;
};

/**
 * Filter parliaments based on user hierarchy
 * Returns all parliaments if no hierarchy restrictions, otherwise filters based on highest level
 */
export const filterParliamentsByHierarchy = (parliaments, userHierarchy) => {
  console.log('=== filterParliamentsByHierarchy ===');
  console.log('Parliaments count:', parliaments?.length);
  console.log('User hierarchy:', JSON.stringify(userHierarchy, null, 2));

  if (!parliaments || parliaments.length === 0) {
    console.log('No parliaments, returning empty array');
    return [];
  }

  if (!userHierarchy) {
    console.log('No hierarchy, returning all parliaments');
    return parliaments;
  }

  // Check if user has ANY geographic restriction
  const hasRestriction = userHierarchy.parliament || userHierarchy.division || 
                         userHierarchy.state || userHierarchy.assembly;

  if (!hasRestriction) {
    console.log('No geographic restrictions, returning all parliaments');
    return parliaments;
  }

  // If user has parliament-level access, show only that parliament
  if (userHierarchy.parliament) {
    const parliamentId = extractId(userHierarchy.parliament);
    console.log('Filtering by parliament ID:', parliamentId);
    console.log('Sample parliament IDs:', parliaments.slice(0, 3).map(p => ({ name: p.name, id: extractId(p._id) })));
    
    const filtered = parliaments.filter(p => {
      const pId = extractId(p._id);
      const match = pId === parliamentId;
      if (match) {
        console.log('MATCH FOUND:', p.name, pId);
      }
      return match;
    });
    console.log('Filtered result:', filtered.length, 'parliaments');
    return filtered;
  }

  // If user has division-level access, show all parliaments in that division
  if (userHierarchy.division) {
    const divisionId = extractId(userHierarchy.division);
    console.log('Filtering by division ID:', divisionId);
    const filtered = parliaments.filter(p => {
      const dId = extractId(p.division_id);
      return dId === divisionId;
    });
    console.log('Filtered result:', filtered.length, 'parliaments');
    return filtered;
  }

  // If user has state-level access, show all parliaments in that state
  if (userHierarchy.state) {
    const stateId = extractId(userHierarchy.state);
    console.log('Filtering by state ID:', stateId);
    const filtered = parliaments.filter(p => {
      const sId = extractId(p.state_id);
      return sId === stateId;
    });
    console.log('Filtered result:', filtered.length, 'parliaments');
    return filtered;
  }

  // If user has assembly-level access, find the parliament containing that assembly
  if (userHierarchy.assembly) {
    const assemblyId = extractId(userHierarchy.assembly);
    console.log('Filtering by assembly ID:', assemblyId);
    // This would require fetching assembly data to get parliament_id
    // For now, return all parliaments as fallback
    console.log('Assembly-level access: returning all parliaments');
    return parliaments;
  }

  // Fallback: return all
  console.log('Fallback: returning all parliaments');
  return parliaments;
};

