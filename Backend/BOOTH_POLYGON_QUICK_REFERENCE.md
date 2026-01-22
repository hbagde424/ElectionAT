# Booth Polygon - Quick Reference Guide

## ⚡ Quick Facts

| Aspect | Details |
|--------|---------|
| **Collection Name** | `boothpolygons` |
| **Total Documents** | 1 |
| **Total Booth Features** | 8+ (in features array) |
| **booth_id Field** | ❌ NOT POPULATED (defined but null) |
| **Data Format** | GeoJSON Feature Collection |
| **Geospatial Index** | ✅ 2dsphere on geometry.coordinates |

---

## 📊 Document Structure

```
boothpolygons (1 document)
│
├── _id: ObjectId
├── type: "Feature"
└── features: Array[
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[lon, lat], ...]]
      },
      properties: {
        BoothName, BoothNo, BlockName, BlockNumber,
        AC_NAME, AC_NO, PC_NAME, PC_NO,
        ST_NAME, ST_CODE, DIVISION_NAME, DIVISION_CODE
      }
    },
    ...
  ]
```

---

## 🔍 Available Fields in Each Booth

### Booth Information
- `BoothName` - Name of the booth
- `BoothNo` - Booth number (string)

### Administrative Hierarchy
- `BlockName` - Block name
- `BlockNumber` - Block number
- `AC_NAME` - Assembly Constituency name
- `AC_NO` - Assembly Constituency number
- `PC_NAME` - Parliamentary Constituency name
- `PC_NO` - Parliamentary Constituency number
- `ST_NAME` - State name
- `ST_CODE` - State code
- `DIVISION_NAME` - Division name
- `DIVISION_CODE` - Division code

### Geographic Data
- `geometry.coordinates` - Polygon coordinates in [longitude, latitude] format

---

## ⚠️ Critical Issues

### Issue 1: booth_id Not Populated
```
Status: ❌ MISSING
Field: booth_id (ObjectId reference to Booth collection)
Current Value: null/undefined
Impact: Cannot directly link to Booth records
Workaround: Use BoothNo + BlockNumber for joins
```

### Issue 2: Data Structure Mismatch
```
Schema Expects: Individual booth polygon documents
Actual Data: Feature Collection with multiple booths in one document
Impact: Schema doesn't match reality
Solution: Normalize data or update schema
```

---

## 💡 How to Access Booth Polygons

### Get All Booth Features
```javascript
const doc = await BoothPolygon.findOne({});
const allBooths = doc.features; // Array of booth features
```

### Find Specific Booth
```javascript
const doc = await BoothPolygon.findOne({});
const booth = doc.features.find(f => f.properties.BoothNo === "263");
```

### Filter by Block
```javascript
const doc = await BoothPolygon.findOne({});
const blockBooths = doc.features.filter(f => f.properties.BlockNumber === "2");
```

### Filter by Assembly Constituency
```javascript
const doc = await BoothPolygon.findOne({});
const acBooths = doc.features.filter(f => f.properties.AC_NO === 197);
```

---

## 🔗 Relationships

### Current State
```
BoothPolygon (features array)
├── BoothNo: "263"
├── BlockNumber: "2"
├── AC_NO: 197
└── booth_id: null ❌ (NOT LINKED)
```

### Recommended State
```
BoothPolygon (features array)
├── BoothNo: "263"
├── BlockNumber: "2"
├── AC_NO: 197
└── booth_id: ObjectId ✅ (LINKED to Booth collection)
```

---

## 📝 Sample Data

### Example Booth Feature
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[75.01208, 22.35208], [75.01254, 22.35211], ...]]
  },
  "properties": {
    "BoothName": "Gandhvani",
    "BoothNo": "263",
    "BlockName": "Gandhwani",
    "BlockNumber": "2",
    "AC_NAME": "Gandhwani (ST)",
    "AC_NO": 197,
    "PC_NAME": "DHAR (ST)",
    "PC_NO": 25,
    "ST_NAME": "MADHYA PRADESH",
    "ST_CODE": 23,
    "DIVISION_NAME": "Indore",
    "DIVISION_CODE": 4
  }
}
```

---

## 🛠️ Recommended Actions

### Priority 1: Populate booth_id
- [ ] Create migration script to match BoothNo with Booth collection
- [ ] Populate booth_id field for all booth features
- [ ] Verify referential integrity

### Priority 2: Normalize Data Structure
- [ ] Decide: Keep Feature Collection OR split into individual documents
- [ ] If splitting: Create migration to normalize data
- [ ] Update schema to match actual structure

### Priority 3: Add Indexes
- [ ] Index on `features.properties.BoothNo`
- [ ] Index on `features.properties.BlockNumber`
- [ ] Index on `features.properties.AC_NO`

### Priority 4: Update Documentation
- [ ] Update API docs with actual data structure
- [ ] Document access patterns
- [ ] Provide query examples

---

## 📋 Checklist for Developers

- [ ] Understand that booth_id is NOT currently populated
- [ ] Use BoothNo + BlockNumber for joins instead of booth_id
- [ ] Access booth data from features array, not top-level
- [ ] Remember data is in GeoJSON format
- [ ] Use geospatial queries for location-based searches
- [ ] Check for null/undefined booth_id in queries

---

## 🔗 Related Files

- **Model**: `Backend/models/boothPolygon.js`
- **Full Report**: `Backend/BOOTH_POLYGON_STRUCTURE_REPORT.md`
- **Query Script**: `Backend/queryBoothPolygon.js`

---

## 📞 Questions?

Refer to the full report for detailed analysis and recommendations.
