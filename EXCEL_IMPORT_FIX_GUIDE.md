# Excel Import/Export Complete Field Mapping Guide

## Overview
This document defines the standardized pattern for Excel template generation and CSV export across all CRUD pages, ensuring complete model field coverage for bulk imports.

## Standard Pattern (Based on Booth/Block Working Implementation)

### 1. Excel Template Generation (`handleDownloadExcelTemplate`)
```javascript
const handleDownloadExcelTemplate = async () => {
    try {
        const XLSX = await import('xlsx');
        const templateData = [
            {
                // ALL MODEL FIELDS with sample data
                // Use codes for geography (state_no, division_code, parliament_no, AC_NO, block_no, booth_number)
                // Include all text, number, enum fields
                // Include optional fields with empty values
            }
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, 'entity-template.xlsx');
    } catch (error) {
        console.error('Error generating template:', error);
        alert('Failed to download template. Please try again.');
    }
};
```

### 2. CSV Export (`handleExport` / `handleDownloadCsv`)
```javascript
const exportData = response.data.data.map(item => ({
    // Primary ID
    'ID': item._id || '',
    // All text fields
    'Field Name': item.field_name || '',
    // All enum fields
    'Status': item.status || '',
    // Geographic hierarchy - both ID and Name
    'State ID': item.state_id?._id || (item.state_id || ''),
    'State Name': item.state_id?.name || '',
    'Division ID': item.division_id?._id || (item.division_id || ''),
    'Division Name': item.division_id?.name || '',
    // ... repeat for parliament, assembly, block, booth, panchayat, village, falliya
    // Populated references
    'Party ID': item.party_id?._id || (item.party_id || ''),
    'Party Name': item.party_id?.name || '',
    // Metadata
    'Created By': item.created_by?.username || '',
    'Updated By': item.updated_by?.username || '',
    'Created At': item.created_at ? new Date(item.created_at).toISOString() : '',
    'Updated At': item.updated_at ? new Date(item.updated_at).toISOString() : ''
}));
```

### 3. Import Handler (`handleImportFile`)
- Already working via backend import endpoints
- Frontend normalizes Excel headers (lowercase, replace spaces with underscore)
- Backend resolves geographic codes via importHelpers

---

## Model-Specific Field Maps

### Candidate Model
**Required**: name, caste, party_id (optional), created_by
**Optional**: criminal_cases, assets, liabilities, education, photo, description
**Template Sample**:
```javascript
{
    name: 'Rajesh Kumar',
    caste: 'General',
    criminal_cases: '0',
    assets: '5000000',
    liabilities: '1000000',
    education: 'Graduate',
    photo: '',
    description: 'Experienced candidate'
}
```

### CasteList Model
**Required**: category, caste, state_id, division_id, parliament_id, assembly_id
**Optional**: block_id, booth_id, percentage, description
**Geographic Codes**: state_no, division_code, parliament_no, AC_NO, block_no, booth_number
**Template Sample**:
```javascript
{
    category: 'SC',
    caste: 'Chamar',
    percentage: '15',
    state_no: '23',
    division_code: '1',
    parliament_no: '101',
    AC_NO: '1',
    block_no: '1',
    booth_number: '1',
    description: 'Sample caste entry'
}
```

### Event Model
**Required**: name, type, status, start_date, end_date, location, state_id through booth_id
**Optional**: panchayat_id, village_id, falliya_id, year, description
**Enum**: type (event/campaign/activity), status (done/incomplete/cancelled/postponed)
**Template Sample**:
```javascript
{
    name: 'Jan Sabha',
    type: 'campaign',
    status: 'done',
    description: 'Public meeting',
    start_date: '2024-01-15',
    end_date: '2024-01-15',
    location: 'Community Hall, Gwalior',
    state_no: '23',
    division_code: '1',
    parliament_no: '101',
    AC_NO: '1',
    block_no: '1',
    booth_number: '1',
    year: 2024
}
```

### Falliya Model
**Required**: falliya_name, state_id through village_id
**Optional**: location, latitude, longitude, male_count, female_count, others_count, total_count
**Template Sample**:
```javascript
{
    falliya_name: 'Ward 1',
    location: 'Near Temple',
    latitude: '26.2183',
    longitude: '78.1828',
    male_count: '500',
    female_count: '450',
    others_count: '0',
    total_count: '950',
    state_no: '23',
    division_code: '1',
    parliament_no: '101',
    AC_NO: '1',
    block_no: '1',
    booth_number: '1',
    panchayat_name: 'Panchayat 1',
    village_name: 'Village 1'
}
```

### Gender Model
**Required**: male, female, others, state_id through booth_id
**Optional**: panchayat_id, village_id, falliya_id, year, description
**Template Sample**:
```javascript
{
    male: '500',
    female: '450',
    others: '0',
    year: 2024,
    description: 'Gender statistics',
    state_no: '23',
    division_code: '1',
    parliament_no: '101',
    AC_NO: '1',
    block_no: '1',
    booth_number: '1'
}
```

### Influencer Model
**Required**: name, contact_number, full_address, state_id through booth_id
**Optional**: alternate_number, email, panchayat_id, village_id, falliya_id, year, category, caste, party_id, status, description
**Enum**: category (Political Leader/Community Leader/etc), caste (General/OBC/SC/ST/etc), status (Active/Inactive)
**Template Sample**:
```javascript
{
    name: 'Ramesh Singh',
    contact_number: '9876543210',
    alternate_number: '9876543211',
    email: 'ramesh@example.com',
    full_address: '123 Main St, Gwalior',
    category: 'Political Leader',
    caste: 'General',
    status: 'Active',
    state_no: '23',
    division_code: '1',
    parliament_no: '101',
    AC_NO: '1',
    block_no: '1',
    booth_number: '1',
    year: 2024,
    description: 'Local influencer'
}
```

### LocalIssue Model
**Required**: issue_name, department, category, state_id through booth_id
**Optional**: description, status, priority, panchayat_id, village_id, falliya_id, year
**Enum**: category (Social Issue/Crime Issue/etc), status (Reported/In Progress/Resolved/Rejected), priority (Low/Medium/High/Critical)
**Template Sample**:
```javascript
{
    issue_name: 'Road Repair',
    department: 'Public Works',
    category: 'Social Issue',
    description: 'Main road needs repair',
    status: 'Reported',
    priority: 'High',
    state_no: '23',
    division_code: '1',
    parliament_no: '101',
    AC_NO: '1',
    block_no: '1',
    booth_number: '1',
    year: 2024
}
```

### Village Model
**Required**: village_name, state_id through panchayat_id
**Optional**: location, latitude, longitude, male_count, female_count, others_count, total_count
**Template Sample**:
```javascript
{
    village_name: 'Ramnagar',
    location: 'Near Highway',
    latitude: '26.2183',
    longitude: '78.1828',
    male_count: '5000',
    female_count: '4500',
    others_count: '0',
    total_count: '9500',
    state_no: '23',
    division_code: '1',
    parliament_no: '101',
    AC_NO: '1',
    block_no: '1',
    booth_number: '1',
    panchayat_name: 'Panchayat 1'
}
```

### BoothVolunteer Model
**Required**: name, state_id through booth_id
**Optional**: phone, party_id, role, status, description, year
**Template Sample**:
```javascript
{
    name: 'Suresh Kumar',
    phone: '9876543210',
    role: 'Coordinator',
    status: 'Active',
    state_no: '23',
    division_code: '1',
    parliament_no: '101',
    AC_NO: '1',
    block_no: '1',
    booth_number: '1',
    year: 2024,
    description: 'Experienced volunteer'
}
```

### WorkStatus Model
**Required**: work_name, status, state_id through booth_id
**Optional**: total_budget, spent_amount, start_date, completion_date, panchayat_id, village_id, falliya_id, year, description
**Enum**: status (Planned/In Progress/Completed/On Hold/Cancelled)
**Template Sample**:
```javascript
{
    work_name: 'Road Construction',
    status: 'In Progress',
    total_budget: '5000000',
    spent_amount: '2000000',
    start_date: '2024-01-01',
    completion_date: '2024-12-31',
    state_no: '23',
    division_code: '1',
    parliament_no: '101',
    AC_NO: '1',
    block_no: '1',
    booth_number: '1',
    year: 2024,
    description: 'Main road construction project'
}
```

---

## Implementation Checklist

For each CRUD page:
1. ✅ **Excel Template**: Include ALL model fields with sample data
2. ✅ **CSV Export**: Include ID + all fields + populated names + metadata
3. ✅ **Import Handler**: Uses normalized keys + backend resolves geography
4. ✅ **Backend Import**: Maps ALL fields from row to model (check controller)
5. ✅ **Test**: Download template → fill → import → verify all fields saved

---

## Priority Pages for Immediate Fix

Based on user request and model complexity:

1. **BLO** ✅ (Already fixed - comprehensive export)
2. **Candidate** - Missing assets, liabilities, education, description
3. **CasteList** - Missing percentage field
4. **Event** - Complete but verify year field
5. **Falliya** - Need population counts in template
6. **Gender** - Complete but verify all geography
7. **Influencer** - Missing category, caste, party, social media
8. **LocalIssue** - Missing department, category, priority, status
9. **Village** - Need population counts
10. **WorkStatus** - Missing budget fields, dates

---

## Next Steps

1. Apply multi-replace batch fix to top 10 pages
2. Test each import end-to-end
3. Document any backend import endpoint gaps
4. Create standard test dataset for QA

