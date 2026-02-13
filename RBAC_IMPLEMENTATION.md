# VitalSense Role-Based Authentication Implementation

## Overview
Added separate login and dashboards for PATIENT and DOCTOR roles with minimal changes to existing functionality.

---

## FILES ADDED

### Backend (3 files)
1. **server/routes/doctor.js** - NEW
   - Doctor-specific routes for patient lookup
   - GET /api/doctor/patient/:patientId/reports
   - GET /api/doctor/patient/:patientId/trends
   - Read-only access to patient data

### Frontend (3 files)
1. **client/src/pages/PatientDashboard.jsx** - NEW
   - Patient dashboard with Patient ID display
   - Copy-to-clipboard functionality for Patient ID
   - Wraps existing Dashboard component

2. **client/src/pages/DoctorDashboard.jsx** - NEW
   - Doctor dashboard with patient search
   - Search by Patient ID
   - Display patient reports and trends
   - Read-only access with charts

3. **client/src/components/auth/RoleRoute.jsx** - NEW
   - Role-based route protection
   - Redirects based on user role
   - Prevents unauthorized access

---

## FILES MODIFIED

### Backend (2 files)

1. **server/routes/auth.js**
   - Added: POST /api/auth/patient/signup
   - Added: POST /api/auth/patient/login
   - Added: POST /api/auth/doctor/signup
   - Added: POST /api/auth/doctor/login
   - Modified: GET /api/auth/me (now returns role and patientId)
   - Kept: Legacy /register and /login endpoints for backward compatibility
   - Auto-generates unique Patient ID for patients

2. **server/index.js**
   - Added: app.use('/api/doctor', require('./routes/doctor'))

### Frontend (5 files)

1. **client/src/context/AuthContext.jsx**
   - Modified: login() now accepts role parameter
   - Modified: signup() now accepts role and additionalData parameters
   - Calls role-specific endpoints

2. **client/src/pages/Login.jsx**
   - Added: Role toggle (Patient/Doctor)
   - Modified: Redirects to role-specific dashboard
   - Uses role-based login endpoint

3. **client/src/pages/Signup.jsx**
   - Added: Role toggle (Patient/Doctor)
   - Added: Doctor-specific fields (specialization, hospital)
   - Modified: Redirects to role-specific dashboard
   - Uses role-based signup endpoint

4. **client/src/App.jsx**
   - Added: Import PatientDashboard, DoctorDashboard, RoleRoute
   - Added: /patient/dashboard route (PATIENT only)
   - Added: /doctor/dashboard route (DOCTOR only)
   - Modified: All existing routes now protected for PATIENT role only
   - Modified: Root and /dashboard redirect based on user role

5. **client/src/components/Navbar.jsx**
   - Modified: Navigation items change based on user role
   - Doctors see only Dashboard link
   - Patients see all existing links
   - Logo link redirects based on role

---

## DATABASE SCHEMA

### User Model (Already existed with required fields)
```javascript
{
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String (enum: ['PATIENT', 'DOCTOR']),
  patientId: String (unique, sparse, only for PATIENT),
  doctorProfile: {
    specialization: String,
    hospital: String,
    experienceYears: Number
  },
  preferences: { ... }
}
```

### Report Model (No changes needed)
- Already has userId field linking to User

### Biomarker Model (No changes needed)
- Already has userId field linking to User

---

## API ENDPOINTS

### Authentication
- POST /api/auth/patient/signup - Patient registration
- POST /api/auth/patient/login - Patient login
- POST /api/auth/doctor/signup - Doctor registration
- POST /api/auth/doctor/login - Doctor login
- GET /api/auth/me - Get current user (returns role & patientId)

### Doctor Access
- GET /api/doctor/patient/:patientId/reports - Get patient reports
- GET /api/doctor/patient/:patientId/trends - Get patient trends

### Legacy (Backward Compatible)
- POST /api/auth/register - Creates PATIENT account
- POST /api/auth/login - Login any role

---

## SECURITY FEATURES

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Authentication**: 7-day expiry tokens
3. **Role-Based Middleware**: requireRole('PATIENT' | 'DOCTOR')
4. **Route Protection**: RoleRoute component on frontend
5. **Patient ID Generation**: Unique VS-PAT-XXXXXXXX format
6. **Read-Only Doctor Access**: Doctors cannot modify patient data

---

## USER FLOWS

### Patient Flow
1. Signup → Select "Patient Signup" → Auto-assigned Patient ID
2. Login → Select "Patient Login" → Redirected to /patient/dashboard
3. Dashboard shows Patient ID with copy button
4. Access to all existing features (upload, reports, trends, etc.)

### Doctor Flow
1. Signup → Select "Doctor Signup" → Optional specialization/hospital
2. Login → Select "Doctor Login" → Redirected to /doctor/dashboard
3. Search patient by Patient ID
4. View patient reports and trends (read-only)
5. No access to patient features (upload, appointments, etc.)

---

## BACKWARD COMPATIBILITY

- Existing users without role will default to PATIENT
- Legacy /register endpoint creates PATIENT accounts
- Legacy /login endpoint works for both roles
- All existing patient features unchanged
- No changes to OCR, extraction, or AI logic

---

## TESTING CHECKLIST

### Patient
- [ ] Patient signup creates account with Patient ID
- [ ] Patient login redirects to /patient/dashboard
- [ ] Patient ID displays correctly with copy button
- [ ] All existing features work (upload, reports, trends, etc.)
- [ ] Patient cannot access /doctor/dashboard

### Doctor
- [ ] Doctor signup creates account without Patient ID
- [ ] Doctor login redirects to /doctor/dashboard
- [ ] Doctor can search patient by Patient ID
- [ ] Doctor can view patient reports
- [ ] Doctor can view patient trends with charts
- [ ] Doctor cannot access patient-only routes

### Security
- [ ] Passwords are hashed
- [ ] JWT tokens expire after 7 days
- [ ] Role-based routes are protected
- [ ] Doctors cannot modify patient data
- [ ] Invalid Patient ID returns 404

---

## DEPLOYMENT NOTES

1. No database migration needed (User model already has role & patientId)
2. Existing users will default to PATIENT role
3. No changes to environment variables
4. No changes to existing API contracts
5. Frontend and backend can be deployed independently

---

## FUTURE ENHANCEMENTS (Not Implemented)

- Doctor can add notes to patient reports
- Patient can share reports with specific doctors
- Doctor can request access to patient data
- Admin role for system management
- Multi-factor authentication
- Patient consent management
