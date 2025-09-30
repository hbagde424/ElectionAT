# ElectionAT Project - Detailed Field Analysis

## Complete Database Schema with Field Details

### 1. USER MANAGEMENT MODELS

#### User Model
```javascript
{
  username: String (required, unique, max 100 chars)
  mobile: String (required, unique, 10 digits)
  email: String (required, unique, valid email format)
  password: String (required, min 6 chars, hashed)
  role: String (enum: ['superAdmin', 'State', 'Admin', 'Booth', 'Division', 'Parliament', 'Block', 'Assembly'])
  state_ids: [ObjectId] (ref: State)
  division_ids: [ObjectId] (ref: Division)
  parliament_ids: [ObjectId] (ref: Parliament)
  assembly_ids: [ObjectId] (ref: Assembly)
  block_ids: [ObjectId] (ref: Block)
  booth_ids: [ObjectId] (ref: Booth)
  isActive: Boolean (default: true)
  created_by: ObjectId (ref: User)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### Role Model
```javascript
{
  name: String (required, unique)
  description: String
  status: String (enum: ['Active', 'Inactive'], default: 'Active')
}
```

#### Permission Model
```javascript
{
  name: String (required, unique)
  description: String
  level: String (enum: ['State', 'Division', 'Assembly', 'Parliament', 'Block', 'Booth'], required)
}
```

### 2. GEOGRAPHIC HIERARCHY MODELS

#### State Model
```javascript
{
  name: String (required, unique, max 100 chars)
  description: String
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### District Model
```javascript
{
  name: String (required, max 100 chars)
  description: String
  state_id: ObjectId (ref: State, required)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### Division Model
```javascript
{
  name: String (required, max 100 chars)
  description: String
  state_id: ObjectId (ref: State, required)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### Assembly Model
```javascript
{
  name: String (required, unique, max 100 chars)
  description: String (HTML allowed)
  AC_NO: String (required, unique, max 100 chars)
  type: String (enum: ['Urban', 'Rural', 'Mixed'], required)
  category: String (enum: ['General', 'Reserved', 'Special'], default: 'General')
  state_id: ObjectId (ref: State, required)
  district_id: ObjectId (ref: District)
  division_id: ObjectId (ref: Division, required)
  parliament_id: ObjectId (ref: Parliament, required)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### Parliament Model
```javascript
{
  name: String (required, unique, max 100 chars)
  description: String
  state_id: ObjectId (ref: State, required)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### Block Model
```javascript
{
  name: String (required, max 100 chars)
  description: String
  state_id: ObjectId (ref: State, required)
  district_id: ObjectId (ref: District, required)
  division_id: ObjectId (ref: Division, required)
  assembly_id: ObjectId (ref: Assembly, required)
  parliament_id: ObjectId (ref: Parliament, required)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### Booth Model
```javascript
{
  name: String (required, trim)
  booth_number: String (required, trim)
  full_address: String (required)
  latitude: Number
  longitude: Number
  block_id: ObjectId (ref: Block, required)
  assembly_id: ObjectId (ref: Assembly, required)
  parliament_id: ObjectId (ref: Parliament, required)
  district_id: ObjectId (ref: District)
  division_id: ObjectId (ref: Division, required)
  state_id: ObjectId (ref: State, required)
  election_year: ObjectId (ref: ElectionYear, required)
  description: String (default: '')
  updated_by: ObjectId (ref: User)
  created_by: ObjectId (ref: User, required)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

### 3. ELECTION DATA MODELS

#### Candidate Model
```javascript
{
  name: String (required, max 100 chars)
  caste: String (enum: ['General', 'OBC', 'SC', 'ST', 'Other'], default: 'General')
  criminal_cases: Number (default: 0, min: 0)
  assets: String (trim)
  description: String (default: '')
  liabilities: String (trim)
  education: String (trim)
  photo: String (valid URL or local path)
  party_id: ObjectId (ref: Party)
  is_active: Boolean (default: true)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### Party Model
```javascript
{
  name: String (required, unique, trim)
  abbreviation: String (required, trim, uppercase)
  symbol: String (trim)
  founded_year: Number
  description: String (default: '')
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### WinningCandidate Model
```javascript
{
  state_id: ObjectId (ref: State, required)
  division_id: ObjectId (ref: Division, required)
  parliament_id: ObjectId (ref: Parliament, required)
  assembly_id: ObjectId (ref: Assembly, required)
  type: [String] (enum: ['General', 'SC', 'ST', 'OBC'], default: ['General'])
  poll_percentage: String (required, auto-formatted with %)
  party_id: ObjectId (ref: Party, required)
  year_id: ObjectId (ref: ElectionYear, required)
  candidate_id: ObjectId (ref: Candidate, required)
  total_electors: String (required)
  total_votes: Number (required)
  voting_percentage: String (required)
  margin: Number (required)
  margin_percentage: String (required)
  electors: Number
  male_electors: Number
  female_electors: Number
  nota_votes: Number
  description: String (default: '')
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

### 4. VOTING DATA MODELS

#### BoothVotes Model
```javascript
{
  candidate_id: ObjectId (ref: Candidate, required)
  state_id: ObjectId (ref: State, required)
  division_id: ObjectId (ref: Division, required)
  parliament_id: ObjectId (ref: Parliament, required)
  assembly_id: ObjectId (ref: Assembly, required)
  block_id: ObjectId (ref: Block, required)
  booth_id: ObjectId (ref: Booth, required)
  total_votes: Number (required, min: 0, integer)
  election_year_id: ObjectId (ref: ElectionYear, required)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### AssemblyVotes Model
```javascript
{
  candidate_id: ObjectId (ref: Candidate, required)
  assembly_id: ObjectId (ref: Assembly, required)
  state_id: ObjectId (ref: State, required)
  parliament_id: ObjectId (ref: Parliament, required)
  division_id: ObjectId (ref: Division, required)
  block_id: ObjectId (ref: Block, required)
  booth_id: ObjectId (ref: Booth, required)
  total_votes: Number (required, min: 0, integer)
  election_year_id: ObjectId (ref: ElectionYear, required)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### ParliamentVotes Model
```javascript
{
  candidate_id: ObjectId (ref: Candidate, required)
  parliament_id: ObjectId (ref: Parliament, required)
  state_id: ObjectId (ref: State, required)
  division_id: ObjectId (ref: Division, required)
  total_votes: Number (required, min: 0, integer)
  election_year_id: ObjectId (ref: ElectionYear, required)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### BlockVotes Model
```javascript
{
  candidate_id: ObjectId (ref: Candidate, required)
  block_id: ObjectId (ref: Block, required)
  state_id: ObjectId (ref: State, required)
  division_id: ObjectId (ref: Division, required)
  assembly_id: ObjectId (ref: Assembly, required)
  parliament_id: ObjectId (ref: Parliament, required)
  total_votes: Number (required, min: 0, integer)
  election_year_id: ObjectId (ref: ElectionYear, required)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

### 5. SURVEY & ANALYTICS MODELS

#### BoothDemographics Model
```javascript
{
  booth_id: ObjectId (ref: Booth, required, unique)
  state_id: ObjectId (ref: State, required)
  division_id: ObjectId (ref: Division, required)
  assembly_id: ObjectId (ref: Assembly, required)
  parliament_id: ObjectId (ref: Parliament, required)
  block_id: ObjectId (ref: Block, required)
  total_population: Number (required, min: 0)
  total_electors: Number (required, min: 0)
  male_electors: Number (required, min: 0)
  female_electors: Number (required, min: 0)
  other_electors: Number (min: 0, default: 0)
  
  // Education breakdown
  education: {
    illiterate: Number (min: 0, default: 0)
    educated: Number (min: 0, default: 0)
    class_1_to_5: Number (min: 0, default: 0)
    class_5_to_10: Number (min: 0, default: 0)
    class_10_to_12: Number (min: 0, default: 0)
    graduate: Number (min: 0, default: 0)
    post_graduate: Number (min: 0, default: 0)
    other_education: Number (min: 0, default: 0)
  }
  
  // Annual income breakdown
  annual_income: {
    below_10k: Number (min: 0, default: 0)
    _10k_to_20k: Number (min: 0, default: 0)
    _25k_to_50k: Number (min: 0, default: 0)
    _50k_to_2L: Number (min: 0, default: 0)
    _2L_to_5L: Number (min: 0, default: 0)
    above_5L: Number (min: 0, default: 0)
  }
  
  // Age groups
  age_groups: {
    _18_25: Number (min: 0, default: 0)
    _26_40: Number (min: 0, default: 0)
    _41_60: Number (min: 0, default: 0)
    _60_above: Number (min: 0, default: 0)
  }
  
  // Caste population
  caste_population: {
    sc: Number (min: 0, default: 0)
    st: Number (min: 0, default: 0)
    obc: Number (min: 0, default: 0)
    general: Number (min: 0, default: 0)
    other: Number (min: 0, default: 0)
  }
  
  literacy_rate: Number (min: 0, max: 100)
  religious_composition: Map (of: Number, default: {})
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### BoothElectionStats Model
```javascript
{
  booth_id: ObjectId (ref: Booth, required)
  year_id: ObjectId (ref: ElectionYear, required)
  total_votes_polled: Number
  turnout_percentage: Number
  male_turnout: Number
  female_turnout: Number
  nota_votes: Number
  rejected_votes: Number
  winning_candidate: String
  winning_party_id: ObjectId (ref: Party)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### BoothInfrastructure Model
```javascript
{
  booth_id: ObjectId (ref: Booth, required, unique)
  premises_type: String (enum: ['School', 'Community Hall', 'Government Building', 'Other'], required)
  categorization: String (enum: ['Normal', 'Sensitive', 'Hyper-sensitive'], default: 'Normal')
  accessibility_issues: String (trim)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### BoothVolunteers Model
```javascript
{
  booth_id: ObjectId (ref: Booth, required, indexed)
  party_id: ObjectId (ref: Party, required, indexed)
  state_id: ObjectId (ref: State, required, indexed)
  division_id: ObjectId (ref: Division, required, indexed)
  assembly_id: ObjectId (ref: Assembly, required, indexed)
  parliament_id: ObjectId (ref: Parliament, required, indexed)
  block_id: ObjectId (ref: Block, required, indexed)
  name: String (required, trim)
  role: String (trim)
  post: String (trim, max 200 chars, indexed)
  phone: String (required, trim, 10 digits)
  email: String (trim, lowercase, valid email)
  area_responsibility: String (trim)
  activity_level: String (enum: ['High', 'Medium', 'Low'], default: 'Medium')
  remarks: String (trim)
  
  // Document attachments
  documents: [{
    filename: String (required)
    originalname: String (required)
    mimetype: String
    size: Number
    path: String (required)
    uploaded_at: Date (default: now)
  }]
  
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### BoothPartyVoteShare Model
```javascript
{
  stat_id: ObjectId (ref: BoothElectionStats, required)
  party_id: ObjectId (ref: Party, required)
  votes: Number (required, min: 0)
  vote_percent: Number (required, min: 0, max: 100)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### BoothPartyPresence Model
```javascript
{
  booth_id: ObjectId (ref: Booth, required)
  party_id: ObjectId (ref: Party, required)
  local_unit_head_name: String
  head_phone: String
  registered_members: Number
  has_booth_committee: String (enum: ['Yes', 'No'], default: 'No')
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

### 6. VISIT & ACTIVITY MODELS

#### Visit Model
```javascript
{
  state_id: ObjectId (ref: State, indexed)
  division_id: ObjectId (ref: Division, indexed)
  assembly_id: ObjectId (ref: Assembly, indexed)
  parliament_id: ObjectId (ref: Parliament, indexed)
  block_id: ObjectId (ref: Block, indexed)
  booth_id: ObjectId (ref: Booth, indexed)
  candidate_id: ObjectId (ref: Candidate)
  election_year_id: ObjectId (ref: ElectionYear, indexed)
  post: String (max 100 chars)
  date: Date
  work_status: String (enum: ['announced', 'approved', 'in progress', 'complete', 'other', 'speech subject', 'N/A'], default: 'announced')
  
  // New fields
  workName: String (max 200 chars)
  visitAgenda: String (max 1000 chars)
  speechFiveLines: String (max 2000 chars)
  speechIssue: String (max 2000 chars)
  announcementDate: Date
  completionDate: Date
  budgetAnnouncedDate: Date
  
  // Document attachments
  documents: [{
    name: String (trim)
    filePath: String (trim)
  }]
  
  remark: String (max 500 chars)
  
  // Location data
  longitude: Number (min: -180, max: 180)
  latitude: Number (min: -90, max: 90)
  locationName: String (max 200 chars)
  
  description: String (default: '')
  created_by: ObjectId (ref: User)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### LocalDynamics Model
```javascript
{
  booth_id: ObjectId (ref: Booth, required, unique)
  dominant_caste: String (trim)
  known_issues: String (trim)
  local_leader: String (trim)
  grassroots_orgs: String (trim)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

### 7. SUPPORTING MODELS

#### ElectionYear Model
```javascript
{
  year: Number (required, unique)
  description: String
  is_active: Boolean (default: true)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### ElectionType Model
```javascript
{
  name: String (required, unique)
  description: String
  is_active: Boolean (default: true)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### Gender Model
```javascript
{
  name: String (required, unique)
  description: String
  is_active: Boolean (default: true)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### CasteList Model
```javascript
{
  name: String (required, unique)
  description: String
  is_active: Boolean (default: true)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### WorkStatus Model
```javascript
{
  name: String (required, unique)
  description: String
  is_active: Boolean (default: true)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### Status Model
```javascript
{
  name: String (required, unique)
  description: String
  is_active: Boolean (default: true)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

### 8. POLYGON MODELS (Geographic Boundaries)

#### StatePolygon Model
```javascript
{
  state_id: ObjectId (ref: State, required)
  geometry: {
    type: String (enum: ['Polygon', 'MultiPolygon'])
    coordinates: [[[Number]]] // GeoJSON coordinates
  }
  properties: {
    name: String
    area: Number
    perimeter: Number
  }
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### DistrictPolygon Model
```javascript
{
  district_id: ObjectId (ref: District, required)
  geometry: {
    type: String (enum: ['Polygon', 'MultiPolygon'])
    coordinates: [[[Number]]] // GeoJSON coordinates
  }
  properties: {
    name: String
    area: Number
    perimeter: Number
  }
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### AssemblyPolygon Model
```javascript
{
  assembly_id: ObjectId (ref: Assembly, required)
  geometry: {
    type: String (enum: ['Polygon', 'MultiPolygon'])
    coordinates: [[[Number]]] // GeoJSON coordinates
  }
  properties: {
    name: String
    area: Number
    perimeter: Number
  }
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### ParliamentPolygon Model
```javascript
{
  parliament_id: ObjectId (ref: Parliament, required)
  geometry: {
    type: String (enum: ['Polygon', 'MultiPolygon'])
    coordinates: [[[Number]]] // GeoJSON coordinates
  }
  properties: {
    name: String
    area: Number
    perimeter: Number
  }
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### BlockPolygon Model
```javascript
{
  block_id: ObjectId (ref: Block, required)
  geometry: {
    type: String (enum: ['Polygon', 'MultiPolygon'])
    coordinates: [[[Number]]] // GeoJSON coordinates
  }
  properties: {
    name: String
    area: Number
    perimeter: Number
  }
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### BoothPolygon Model
```javascript
{
  booth_id: ObjectId (ref: Booth, required)
  geometry: {
    type: String (enum: ['Point', 'Polygon', 'MultiPolygon'])
    coordinates: [Number] or [[[Number]]] // GeoJSON coordinates
  }
  properties: {
    name: String
    booth_number: String
    area: Number
    perimeter: Number
  }
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

### 9. RELATIONSHIP MODELS

#### UserRole Model
```javascript
{
  user_id: ObjectId (ref: User, required)
  role_id: ObjectId (ref: Role, required)
  assigned_by: ObjectId (ref: User, required)
  assigned_at: Date (default: now)
  is_active: Boolean (default: true)
}
```

#### RolePermission Model
```javascript
{
  role_id: ObjectId (ref: Role, required)
  permission_id: ObjectId (ref: Permission, required)
  assigned_by: ObjectId (ref: User, required)
  assigned_at: Date (default: now)
  is_active: Boolean (default: true)
}
```

#### UserHierarchy Model
```javascript
{
  user_id: ObjectId (ref: User, required)
  parent_user_id: ObjectId (ref: User, required)
  hierarchy_level: Number (required)
  created_by: ObjectId (ref: User, required)
  created_at: Date (default: now)
}
```

### 10. ADDITIONAL SUPPORTING MODELS

#### FAQ Model
```javascript
{
  question: String (required, trim)
  answer: String (required, trim)
  category: String (trim)
  is_active: Boolean (default: true)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### Event Model
```javascript
{
  title: String (required, trim)
  description: String (trim)
  event_date: Date (required)
  location: String (trim)
  event_type_id: ObjectId (ref: EventType)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

#### EventType Model
```javascript
{
  name: String (required, unique)
  description: String
  is_active: Boolean (default: true)
  created_by: ObjectId (ref: User, required)
  updated_by: ObjectId (ref: User)
  created_at: Date (default: now)
  updated_at: Date (default: now)
}
```

## Database Indexes and Performance Optimizations

### Key Indexes
1. **Geographic Hierarchy**: state_id, division_id, assembly_id, parliament_id, block_id, booth_id
2. **Election Data**: candidate_id, party_id, election_year_id
3. **Voting Data**: booth_id + election_year_id, candidate_id + election_year_id
4. **User Management**: email, mobile, role
5. **Text Search**: name fields with text indexes
6. **Geospatial**: location fields with 2dsphere indexes

### Unique Constraints
1. **User**: email, mobile, username
2. **Geographic**: name fields for states, districts, assemblies, etc.
3. **Voting**: candidate + booth + election_year combinations
4. **Demographics**: booth_id (one record per booth)

### Virtual Fields
- All models include virtual population fields for related data
- Geographic relationships are automatically populated
- User audit fields (created_by, updated_by) with user details

## Field Validation Rules

### String Fields
- **Required fields**: Must not be empty
- **Unique fields**: Must be unique across the collection
- **Length limits**: Enforced for performance and data integrity
- **Format validation**: Email, phone numbers, URLs

### Number Fields
- **Minimum values**: Usually 0 for counts and percentages
- **Maximum values**: 100 for percentages, specific limits for coordinates
- **Integer validation**: For vote counts and IDs

### Date Fields
- **Default values**: Current timestamp for created_at
- **Auto-update**: updated_at field updated on every save
- **Validation**: Date format and range validation

### ObjectId Fields
- **References**: Valid references to other collections
- **Required relationships**: Critical for data integrity
- **Optional relationships**: For flexible data modeling

## Data Relationships

### Hierarchical Relationships
1. **State** → **Division** → **District** → **Assembly/Parliament** → **Block** → **Booth**
2. **User** → **Role** → **Permission**
3. **Election** → **Candidate** → **Party** → **Votes**

### Cross-References
1. **Geographic**: All entities reference their geographic hierarchy
2. **Election**: All voting data references election year and candidates
3. **User**: All entities track creator and updater
4. **Audit**: All entities have creation and update timestamps

This comprehensive field analysis provides detailed information about every field in the ElectionAT database schema, including data types, validation rules, relationships, and constraints.
