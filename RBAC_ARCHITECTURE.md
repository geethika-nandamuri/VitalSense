# 🏗️ VitalSense RBAC Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐              ┌──────────────┐                 │
│  │ Login Page   │              │ Signup Page  │                 │
│  │              │              │              │                 │
│  │ [Patient] ◄──┼──Toggle──────┼──► [Doctor]  │                 │
│  │ [Doctor]     │              │    [Patient] │                 │
│  └──────┬───────┘              └──────┬───────┘                 │
│         │                             │                          │
│         └──────────┬──────────────────┘                          │
│                    │                                             │
│                    ▼                                             │
│         ┌──────────────────┐                                     │
│         │  AuthContext     │                                     │
│         │  - login(role)   │                                     │
│         │  - signup(role)  │                                     │
│         └────────┬─────────┘                                     │
│                  │                                               │
│         ┌────────┴─────────┐                                     │
│         │                  │                                     │
│         ▼                  ▼                                     │
│  ┌─────────────┐    ┌─────────────┐                            │
│  │  Patient    │    │   Doctor    │                            │
│  │  Dashboard  │    │  Dashboard  │                            │
│  │             │    │             │                            │
│  │ - Show ID   │    │ - Search    │                            │
│  │ - Copy ID   │    │ - View Data │                            │
│  │ - Features  │    │ - Charts    │                            │
│  └─────────────┘    └─────────────┘                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST API
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                      BACKEND (Node.js/Express)                 │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Auth Routes                            │ │
│  │                                                            │ │
│  │  POST /api/auth/patient/signup  ──► Generate Patient ID  │ │
│  │  POST /api/auth/patient/login   ──► Validate & JWT       │ │
│  │  POST /api/auth/doctor/signup   ──► Create Doctor        │ │
│  │  POST /api/auth/doctor/login    ──► Validate & JWT       │ │
│  │  GET  /api/auth/me              ──► Return User + Role   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                   Doctor Routes                           │ │
│  │                                                            │ │
│  │  GET /api/doctor/patient/:id/reports ──► Find Reports    │ │
│  │  GET /api/doctor/patient/:id/trends  ──► Find Trends     │ │
│  │                                                            │ │
│  │  Middleware: authenticate + requireRole('DOCTOR')         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                 Patient Routes (Existing)                 │ │
│  │                                                            │ │
│  │  POST /api/reports/upload       ──► Upload Report        │ │
│  │  GET  /api/reports              ──► Get Own Reports      │ │
│  │  GET  /api/trends               ──► Get Own Trends       │ │
│  │  GET  /api/biomarkers           ──► Get Own Biomarkers   │ │
│  │                                                            │ │
│  │  Middleware: authenticate + requireRole('PATIENT')        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Middleware                             │ │
│  │                                                            │ │
│  │  authenticate()      ──► Verify JWT Token                │ │
│  │  requireRole(role)   ──► Check User Role                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Users Collection                                         │  │
│  │                                                            │  │
│  │  {                                                         │  │
│  │    _id: ObjectId,                                         │  │
│  │    email: String (unique),                                │  │
│  │    password: String (hashed),                             │  │
│  │    name: String,                                          │  │
│  │    role: 'PATIENT' | 'DOCTOR',                           │  │
│  │    patientId: 'VS-PAT-XXXXXXXX' (if PATIENT),           │  │
│  │    doctorProfile: { ... } (if DOCTOR)                    │  │
│  │  }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Reports Collection                                       │  │
│  │                                                            │  │
│  │  {                                                         │  │
│  │    _id: ObjectId,                                         │  │
│  │    userId: ObjectId (ref: User),                         │  │
│  │    fileName: String,                                      │  │
│  │    extractedData: { biomarkers: [...] },                │  │
│  │    status: String,                                        │  │
│  │    reportDate: Date                                       │  │
│  │  }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Biomarkers Collection                                    │  │
│  │                                                            │  │
│  │  {                                                         │  │
│  │    _id: ObjectId,                                         │  │
│  │    userId: ObjectId (ref: User),                         │  │
│  │    name: String,                                          │  │
│  │    value: Number,                                         │  │
│  │    unit: String,                                          │  │
│  │    status: 'normal' | 'high' | 'low',                   │  │
│  │    date: Date                                             │  │
│  │  }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### Patient Signup Flow
```
User → Signup Page → Select "Patient" → Enter Details
  ↓
AuthContext.signup(name, email, password, 'PATIENT')
  ↓
POST /api/auth/patient/signup
  ↓
Backend:
  1. Validate input
  2. Check if email exists
  3. Hash password (bcrypt)
  4. Generate unique Patient ID (VS-PAT-XXXXXXXX)
  5. Create User with role='PATIENT'
  6. Generate JWT token
  ↓
Response: { token, user: { id, email, name, role, patientId } }
  ↓
Frontend:
  1. Store token in localStorage
  2. Set user in AuthContext
  3. Redirect to /patient/dashboard
```

### Doctor Signup Flow
```
User → Signup Page → Select "Doctor" → Enter Details
  ↓
AuthContext.signup(name, email, password, 'DOCTOR', { specialization, hospital })
  ↓
POST /api/auth/doctor/signup
  ↓
Backend:
  1. Validate input
  2. Check if email exists
  3. Hash password (bcrypt)
  4. Create User with role='DOCTOR'
  5. Store doctorProfile
  6. Generate JWT token
  ↓
Response: { token, user: { id, email, name, role } }
  ↓
Frontend:
  1. Store token in localStorage
  2. Set user in AuthContext
  3. Redirect to /doctor/dashboard
```

### Patient Login Flow
```
User → Login Page → Select "Patient" → Enter Credentials
  ↓
AuthContext.login(email, password, 'PATIENT')
  ↓
POST /api/auth/patient/login
  ↓
Backend:
  1. Find user with email AND role='PATIENT'
  2. Verify password (bcrypt.compare)
  3. Generate JWT token
  ↓
Response: { token, user: { id, email, name, role, patientId } }
  ↓
Frontend:
  1. Store token in localStorage
  2. Set user in AuthContext
  3. Redirect to /patient/dashboard
```

### Doctor Login Flow
```
User → Login Page → Select "Doctor" → Enter Credentials
  ↓
AuthContext.login(email, password, 'DOCTOR')
  ↓
POST /api/auth/doctor/login
  ↓
Backend:
  1. Find user with email AND role='DOCTOR'
  2. Verify password (bcrypt.compare)
  3. Generate JWT token
  ↓
Response: { token, user: { id, email, name, role } }
  ↓
Frontend:
  1. Store token in localStorage
  2. Set user in AuthContext
  3. Redirect to /doctor/dashboard
```

---

## Authorization Flow

### Patient Accessing Own Data
```
Patient → Click "View Reports"
  ↓
Navigate to /reports
  ↓
RoleRoute checks: user.role === 'PATIENT' ✓
  ↓
GET /api/reports
  ↓
Middleware:
  1. authenticate() → Verify JWT → req.user
  2. requireRole('PATIENT') → Check role ✓
  ↓
Controller:
  Find reports where userId === req.user._id
  ↓
Response: [reports]
```

### Doctor Accessing Patient Data
```
Doctor → Enter Patient ID → Click "Search"
  ↓
GET /api/doctor/patient/VS-PAT-12345678/reports
  ↓
Middleware:
  1. authenticate() → Verify JWT → req.user
  2. requireRole('DOCTOR') → Check role ✓
  ↓
Controller:
  1. Find patient by patientId
  2. Find reports where userId === patient._id
  ↓
Response: { patient: {...}, reports: [...] }
```

### Unauthorized Access Attempt
```
Patient → Try to access /doctor/dashboard
  ↓
RoleRoute checks: user.role === 'DOCTOR' ✗
  ↓
Redirect to /patient/dashboard

OR

Doctor → Try to access /upload
  ↓
RoleRoute checks: user.role === 'PATIENT' ✗
  ↓
Redirect to /doctor/dashboard
```

---

## Data Flow

### Patient Uploads Report
```
Patient Dashboard → Upload Report → Select File
  ↓
POST /api/reports/upload (multipart/form-data)
  ↓
Middleware: authenticate + requireRole('PATIENT')
  ↓
Controller:
  1. Save file to disk
  2. Extract data using OCR (Gemini Vision)
  3. Create Report document (userId = req.user._id)
  4. Create Biomarker documents
  ↓
Response: { report, biomarkers }
  ↓
Patient can view in Reports/Trends
```

### Doctor Views Patient Data
```
Doctor Dashboard → Search Patient ID
  ↓
GET /api/doctor/patient/:patientId/reports
GET /api/doctor/patient/:patientId/trends
  ↓
Middleware: authenticate + requireRole('DOCTOR')
  ↓
Controller:
  1. Find patient by patientId
  2. Find reports/biomarkers by patient's userId
  3. Group and format data
  ↓
Response: { patient, reports, trends }
  ↓
Display in Doctor Dashboard (read-only)
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Frontend Route Protection (RoleRoute)          │
│ - Checks if user is authenticated                       │
│ - Checks if user has required role                      │
│ - Redirects unauthorized users                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: JWT Token Validation (authenticate middleware) │
│ - Verifies JWT signature                                │
│ - Checks token expiry                                   │
│ - Loads user from database                              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Role-Based Authorization (requireRole)         │
│ - Checks user.role matches required role                │
│ - Returns 403 if role doesn't match                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Data Access Control (Controller Logic)         │
│ - Patients can only access own data (userId filter)     │
│ - Doctors can access patient data (patientId lookup)    │
│ - Read-only access for doctors                          │
└─────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── AppContent
│       ├── Navbar (role-based navigation)
│       └── Routes
│           ├── /login → Login (role toggle)
│           ├── /signup → Signup (role toggle)
│           │
│           ├── /patient/dashboard → RoleRoute(PATIENT)
│           │   └── PatientDashboard
│           │       ├── Patient ID Display
│           │       └── Dashboard (existing)
│           │
│           ├── /doctor/dashboard → RoleRoute(DOCTOR)
│           │   └── DoctorDashboard
│           │       ├── Search Interface
│           │       ├── Patient Info
│           │       ├── Reports List
│           │       └── Trend Charts
│           │
│           └── /upload, /reports, etc. → RoleRoute(PATIENT)
│               └── Existing Components
```

---

## Database Relationships

```
User (PATIENT)
  ├── patientId: "VS-PAT-XXXXXXXX"
  ├── role: "PATIENT"
  └── _id ──┐
            │
            ├──► Reports
            │      ├── userId (ref: User._id)
            │      └── extractedData
            │
            └──► Biomarkers
                   ├── userId (ref: User._id)
                   ├── name, value, unit
                   └── date

User (DOCTOR)
  ├── role: "DOCTOR"
  ├── doctorProfile
  └── Can query by patientId to access patient data
```

---

## Key Design Decisions

### 1. Role-Based Endpoints
- Separate endpoints for patient/doctor signup/login
- Ensures role is set correctly at registration
- Prevents role confusion

### 2. Patient ID Generation
- Format: VS-PAT-XXXXXXXX (VitalSense-Patient-8chars)
- Generated server-side for security
- Unique constraint with collision checking
- Easy to share and search

### 3. Read-Only Doctor Access
- Doctors can view but not modify patient data
- No delete/update endpoints for doctors
- Future: Add doctor notes as separate collection

### 4. Frontend Route Protection
- RoleRoute component checks role before rendering
- Redirects to appropriate dashboard
- Prevents unauthorized UI access

### 5. Backend Authorization
- authenticate middleware validates JWT
- requireRole middleware checks user role
- Controller logic filters data by userId

### 6. Backward Compatibility
- Legacy endpoints still work
- Existing users default to PATIENT
- No breaking changes to existing features

---

## Performance Considerations

### Database Indexes
```javascript
User:
  - email (unique)
  - patientId (unique, sparse)
  - role

Report:
  - userId
  - createdAt

Biomarker:
  - userId
  - date
  - name
```

### Caching Strategy
- JWT tokens cached in localStorage (7 days)
- User data cached in AuthContext
- API responses not cached (real-time data)

### Query Optimization
- Use lean() for read-only queries
- Select only needed fields
- Limit results with pagination (future)

---

This architecture provides a secure, scalable, and maintainable role-based authentication system for VitalSense.
