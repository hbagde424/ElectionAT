# Booth Polygon Data Structure Report

## Executive Summary
The booth polygon collection has been analyzed to understand its data structure and field composition. This report documents the findings from querying the `boothpolygons` collection in MongoDB.

---

## Database Connection Details
- **Database**: electionAT
- **Collection**: boothpolygons
- **Connection**: mongodb://localhost:27017/electionAT

---

## Booth Polygon Model Definition

### File Location
`Backend/models/boothPolygon.js`

### Schema Structure

```javascript
{
  type: String (enum: ['Feature']),
  geometry: {
    type: String (enum: ['Polygon']),
    coordinates: [[[Number]]] // GeoJSON format
  },
  properties: {
    BoothName: String (required),
    BoothNo: String (required),
    BlockName: String (required),
    BlockNumber: String (required),
    AC_NAME: String (required),
    AC_NO: Number (required),
    PC_NAME: String (required),
    PC_NO: Number (required),
    ST_NAME: String (required),
    ST_CODE: Number (required),
    DIVISION_NAME: String (required),
    DIVISION_CODE: Number (required)
  },
  BlockNumber: String (required),
  booth_id: ObjectId (ref: 'Booth', optional),
  election_year: ObjectId (ref: 'ElectionYear', required),
  timestamps: true (createdAt, updatedAt)
}
```

---

## Key Findings

### 1. **booth_id Field Status**
- **Field Exists**: ✅ YES (defined in schema)
- **Field Populated**: ❌ NO (not populated in actual documents)
- **Current Status**: The field is defined as optional (`required: false`) but is currently `null` or `undefined` in all documents

### 2. **Collection Statistics**
- **Total Documents**: 1
- **Documents with booth_id (not null)**: 0
- **Documents without booth_id field**: 1
- **Documents with booth_id = null**: 1

### 3. **Actual Document Structure**

The actual documents in the collection follow a **GeoJSON Feature Collection** format:

```json
{
  "_id": ObjectId,
  "type": "Feature",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lon, lat], [lon, lat], ...]]
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
    },
    // ... more features
  ]
}
```

### 4. **Top-Level Fields in Documents**
- `_id`: ObjectId (MongoDB document ID)
- `type`: String ("Feature")
- `features`: Array (contains multiple booth polygon features)

### 5. **Properties Available in Each Booth Feature**
Each booth polygon feature contains the following properties:
- `BoothName`: Name of the booth (e.g., "Gandhvani")
- `BoothNo`: Booth number (e.g., "263")
- `BlockName`: Name of the block (e.g., "Gandhwani")
- `BlockNumber`: Block number (e.g., "2")
- `AC_NAME`: Assembly Constituency name (e.g., "Gandhwani (ST)")
- `AC_NO`: Assembly Constituency number (e.g., 197)
- `PC_NAME`: Parliamentary Constituency name (e.g., "DHAR (ST)")
- `PC_NO`: Parliamentary Constituency number (e.g., 25)
- `ST_NAME`: State name (e.g., "MADHYA PRADESH")
- `ST_CODE`: State code (e.g., 23)
- `DIVISION_NAME`: Division name (e.g., "Indore")
- `DIVISION_CODE`: Division code (e.g., 4)

---

## Issues and Recommendations

### Issue 1: Mismatch Between Schema and Actual Data
**Problem**: The schema defines individual booth polygon documents, but the actual data is stored as a Feature Collection with multiple features in a single document.

**Impact**: 
- The `booth_id` field is not being used
- The schema structure doesn't match the actual data structure
- Queries expecting individual booth documents will fail

**Recommendation**: 
- Either update the schema to match the actual data structure (Feature Collection format)
- Or restructure the data to match the schema (one document per booth polygon)

### Issue 2: Missing booth_id References
**Problem**: The `booth_id` field is defined but never populated.

**Impact**:
- Cannot directly link booth polygons to booth records
- Must use `BoothNo` and `BlockNumber` for joining with booth data

**Recommendation**:
- Populate the `booth_id` field by matching `BoothNo` with booth records
- Or update queries to use `BoothNo` and `BlockNumber` for joins

### Issue 3: Duplicate BlockNumber Field
**Problem**: `BlockNumber` appears twice in the schema (once in properties, once at top level)

**Impact**: Potential confusion and redundancy

**Recommendation**: Remove the duplicate field definition

---

## Data Access Patterns

### Current Data Structure
```
boothpolygons collection
└── Document (1 per collection)
    ├── _id: ObjectId
    ├── type: "Feature"
    └── features: Array
        ├── Feature 1 (Booth 263)
        ├── Feature 2 (Booth 266)
        ├── Feature 3 (Booth 269)
        └── ... more features
```

### To Access Booth Polygons
```javascript
// Get all booth features
db.boothpolygons.findOne({})

// Access individual booth from features array
const boothPolygonDoc = await BoothPolygon.findOne({});
const boothFeatures = boothPolygonDoc.features;
const specificBooth = boothFeatures.find(f => f.properties.BoothNo === "263");
```

---

## Geospatial Indexing
- **Index Type**: 2dsphere
- **Indexed Field**: `geometry.coordinates`
- **Purpose**: Enables geospatial queries (within, near, etc.)

---

## Recommendations for Improvement

1. **Normalize Data Structure**: Consider storing each booth polygon as a separate document for better query performance and consistency with the schema.

2. **Populate booth_id**: Create a migration script to populate the `booth_id` field by matching booth numbers with the Booth collection.

3. **Update Schema**: If keeping the Feature Collection format, update the schema to accurately reflect the actual data structure.

4. **Add Indexes**: Consider adding indexes on frequently queried fields like `BoothNo`, `BlockNumber`, and `AC_NO`.

5. **Documentation**: Update API documentation to clarify the actual data structure and access patterns.

---

## Query Examples

### Get all booth polygons
```javascript
const boothPolygons = await BoothPolygon.findOne({});
```

### Find a specific booth by booth number
```javascript
const boothPolygons = await BoothPolygon.findOne({});
const booth = boothPolygons.features.find(f => f.properties.BoothNo === "263");
```

### Find booths in a specific block
```javascript
const boothPolygons = await BoothPolygon.findOne({});
const blockBooths = boothPolygons.features.filter(f => f.properties.BlockNumber === "2");
```

### Find booths in a specific assembly constituency
```javascript
const boothPolygons = await BoothPolygon.findOne({});
const acBooths = boothPolygons.features.filter(f => f.properties.AC_NO === 197);
```

---

## Conclusion

The booth polygon collection stores GeoJSON features in a Feature Collection format rather than as individual documents. The `booth_id` field is defined in the schema but is not currently populated in the database. The collection contains comprehensive geographic and administrative information for each booth, including booth name, number, block, assembly constituency, parliamentary constituency, state, and division information.

For optimal performance and consistency, consider normalizing the data structure to store each booth polygon as a separate document and populating the `booth_id` field for proper referential integrity.
