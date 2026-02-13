# Quick Testing Guide - Role-Based Authentication

## Test Patient Flow

### 1. Patient Signup
```
URL: http://localhost:5173/signup
Steps:
1. Click "Patient Signup" toggle
2. Enter name, email, password
3. Click "Create Account"
4. Should redirect to /patient/dashboard
5. Should see Patient ID (format: VS-PAT-XXXXXXXX)
6. Click copy icon to copy Patient ID
```

### 2. Patient Login
```
URL: http://localhost:5173/login
Steps:
1. Click "Patient Login" toggle
2. Enter email and password
3. Click "Sign In"
4. Should redirect to /patient/dashboard
5. Should see Patient ID displayed
```

### 3. Patient Features
```
All existing features should work:
- Upload Report (/upload)
- View Reports (/reports)
- View Biomarkers (/biomarkers)
- View Trends (/trends)
- View Recommendations (/recommendations)
- View Summary (/summary)
- Book Appointments (/appointments)
- Edit Profile (/profile)
```

---

## Test Doctor Flow

### 1. Doctor Signup
```
URL: http://localhost:5173/signup
Steps:
1. Click "Doctor Signup" toggle
2. Enter name, email, password
3. (Optional) Enter specialization and hospital
4. Click "Create Account"
5. Should redirect to /doctor/dashboard
6. Should see search interface
```

### 2. Doctor Login
```
URL: http://localhost:5173/login
Steps:
1. Click "Doctor Login" toggle
2. Enter email and password
3. Click "Sign In"
4. Should redirect to /doctor/dashboard
```

### 3. Doctor Search Patient
```
URL: /doctor/dashboard
Steps:
1. Copy a Patient ID from a patient account
2. Paste into search field
3. Click "Search"
4. Should see:
   - Patient name, email, and ID
   - List of patient reports
   - Trend charts for biomarkers
```

---

## Test Security

### 1. Role-Based Access
```
As Patient:
- Try accessing /doctor/dashboard → Should redirect to /patient/dashboard

As Doctor:
- Try accessing /upload → Should redirect to /doctor/dashboard
- Try accessing /reports → Should redirect to /doctor/dashboard
- Try accessing /trends → Should redirect to /doctor/dashboard
```

### 2. Authentication
```
Without login:
- Try accessing /patient/dashboard → Should redirect to /login
- Try accessing /doctor/dashboard → Should redirect to /login
```

### 3. API Security
```
Test with Postman/curl:

# Without token
GET /api/doctor/patient/VS-PAT-12345678/reports
→ Should return 401 Unauthorized

# With patient token
GET /api/doctor/patient/VS-PAT-12345678/reports
→ Should return 403 Forbidden

# With doctor token
GET /api/doctor/patient/VS-PAT-12345678/reports
→ Should return patient data
```

---

## Sample Test Accounts

### Create These Accounts for Testing:

**Patient 1:**
- Name: John Doe
- Email: patient1@test.com
- Password: test123
- Role: PATIENT
- After signup, note the Patient ID

**Patient 2:**
- Name: Jane Smith
- Email: patient2@test.com
- Password: test123
- Role: PATIENT
- After signup, note the Patient ID

**Doctor 1:**
- Name: Dr. Sarah Johnson
- Email: doctor1@test.com
- Password: test123
- Role: DOCTOR
- Specialization: Cardiology
- Hospital: City Hospital

**Doctor 2:**
- Name: Dr. Michael Chen
- Email: doctor2@test.com
- Password: test123
- Role: DOCTOR
- Specialization: General Medicine
- Hospital: General Hospital

---

## Test Scenarios

### Scenario 1: Patient uploads report, Doctor views it
1. Login as Patient 1
2. Upload a lab report
3. Copy Patient ID
4. Logout
5. Login as Doctor 1
6. Search for Patient 1 using Patient ID
7. Verify report appears in doctor's view
8. Verify trends are displayed

### Scenario 2: Doctor searches non-existent patient
1. Login as Doctor 1
2. Search for "VS-PAT-99999999"
3. Should see error: "Patient not found"

### Scenario 3: Patient tries to access doctor dashboard
1. Login as Patient 1
2. Manually navigate to /doctor/dashboard
3. Should be redirected to /patient/dashboard

### Scenario 4: Doctor tries to access patient features
1. Login as Doctor 1
2. Manually navigate to /upload
3. Should be redirected to /doctor/dashboard

---

## API Testing with curl

### Patient Signup
```bash
curl -X POST http://localhost:5002/api/auth/patient/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "test@patient.com",
    "password": "test123"
  }'
```

### Doctor Signup
```bash
curl -X POST http://localhost:5002/api/auth/doctor/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Doctor",
    "email": "test@doctor.com",
    "password": "test123",
    "specialization": "Cardiology",
    "hospital": "Test Hospital"
  }'
```

### Patient Login
```bash
curl -X POST http://localhost:5002/api/auth/patient/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@patient.com",
    "password": "test123"
  }'
```

### Doctor Login
```bash
curl -X POST http://localhost:5002/api/auth/doctor/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@doctor.com",
    "password": "test123"
  }'
```

### Get Patient Reports (as Doctor)
```bash
curl -X GET http://localhost:5002/api/doctor/patient/VS-PAT-12345678/reports \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

### Get Patient Trends (as Doctor)
```bash
curl -X GET http://localhost:5002/api/doctor/patient/VS-PAT-12345678/trends \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

---

## Expected Results

### Patient Dashboard
- Shows Patient ID prominently
- Copy button works
- All existing features accessible
- Cannot access doctor routes

### Doctor Dashboard
- Shows search interface
- Can search by Patient ID
- Displays patient info when found
- Shows reports list
- Shows trend charts
- Cannot access patient-only routes

### Navigation
- Navbar shows role-appropriate links
- Patient sees all feature links
- Doctor sees only Dashboard link
- Logo redirects to role-specific dashboard

---

## Common Issues & Solutions

### Issue: Patient ID not showing
- Check if user.patientId exists in response
- Verify /api/auth/me returns patientId
- Check browser console for errors

### Issue: Doctor can't search patient
- Verify Patient ID format (VS-PAT-XXXXXXXX)
- Check if patient exists in database
- Verify doctor token is valid
- Check network tab for API errors

### Issue: Redirects not working
- Clear browser cache and localStorage
- Check if user.role is set correctly
- Verify RoleRoute component is working
- Check browser console for errors

### Issue: 403 Forbidden errors
- Verify user has correct role
- Check JWT token is valid
- Verify requireRole middleware is working
- Check Authorization header is set

---

## Verification Checklist

- [ ] Patient can signup and see Patient ID
- [ ] Doctor can signup without Patient ID
- [ ] Patient can login and access all features
- [ ] Doctor can login and search patients
- [ ] Doctor can view patient reports
- [ ] Doctor can view patient trends
- [ ] Role-based routes are protected
- [ ] Navbar shows correct links per role
- [ ] Copy Patient ID works
- [ ] Search by Patient ID works
- [ ] Invalid Patient ID shows error
- [ ] Logout works for both roles
- [ ] Existing features unchanged
