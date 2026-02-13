# 🚀 Quick Start - Role-Based Authentication

## Overview
VitalSense now supports separate Patient and Doctor accounts with role-based dashboards.

---

## 🎯 What's New

### For Patients
- Unique Patient ID (VS-PAT-XXXXXXXX)
- Copy Patient ID to share with doctors
- All existing features work as before

### For Doctors
- Search patients by Patient ID
- View patient reports (read-only)
- View patient trends with charts

---

## 📦 Installation

### 1. Update Dependencies
```bash
# No new dependencies needed!
# But if you want to be sure:
cd server && npm install
cd ../client && npm install
```

### 2. Migrate Existing Users (Optional)
If you have existing users in the database:
```bash
cd server
node scripts/migrate-rbac.js
```

This will:
- Set role to 'PATIENT' for existing users
- Generate Patient IDs for all patients

### 3. Start the Application
```bash
# From root directory
npm run dev
```

---

## 🧪 Quick Test

### Create Test Accounts

**Patient Account:**
1. Go to http://localhost:5173/signup
2. Click "Patient Signup"
3. Fill in details and submit
4. Note the Patient ID shown on dashboard

**Doctor Account:**
1. Go to http://localhost:5173/signup
2. Click "Doctor Signup"
3. Fill in details and submit
4. Use the search to find patients

### Test Doctor Access
1. Login as doctor
2. Enter a Patient ID in search
3. View patient reports and trends

---

## 📁 New Files

### Backend
- `server/routes/doctor.js` - Doctor API routes
- `server/scripts/migrate-rbac.js` - Migration script

### Frontend
- `client/src/pages/PatientDashboard.jsx` - Patient dashboard
- `client/src/pages/DoctorDashboard.jsx` - Doctor dashboard
- `client/src/components/auth/RoleRoute.jsx` - Route protection

### Documentation
- `RBAC_IMPLEMENTATION.md` - Technical documentation
- `TESTING_GUIDE.md` - Testing instructions
- `RBAC_SUMMARY.md` - Implementation summary
- `RBAC_QUICKSTART.md` - This file

---

## 🔑 API Endpoints

### Patient
```bash
# Signup
POST /api/auth/patient/signup
Body: { name, email, password }

# Login
POST /api/auth/patient/login
Body: { email, password }
```

### Doctor
```bash
# Signup
POST /api/auth/doctor/signup
Body: { name, email, password, specialization?, hospital? }

# Login
POST /api/auth/doctor/login
Body: { email, password }

# Get patient reports
GET /api/doctor/patient/:patientId/reports
Headers: { Authorization: Bearer <token> }

# Get patient trends
GET /api/doctor/patient/:patientId/trends
Headers: { Authorization: Bearer <token> }
```

---

## 🛣️ Routes

### Patient Routes
- `/patient/dashboard` - Patient dashboard with ID
- `/upload` - Upload reports
- `/reports` - View reports
- `/trends` - View trends
- `/biomarkers` - View biomarkers
- `/recommendations` - View recommendations
- `/summary` - View summary
- `/appointments` - Book appointments
- `/profile` - Edit profile

### Doctor Routes
- `/doctor/dashboard` - Doctor dashboard with search

### Public Routes
- `/login` - Login page
- `/signup` - Signup page

---

## 🔒 Security

### Authentication
- JWT tokens (7-day expiry)
- bcrypt password hashing
- Role-based access control

### Authorization
- Patients can only access their own data
- Doctors can search and view patient data (read-only)
- Routes protected by role middleware

---

## 🐛 Troubleshooting

### Patient ID not showing
```bash
# Check if migration ran
cd server
node scripts/migrate-rbac.js
```

### Can't access routes
```bash
# Clear browser storage
localStorage.clear()
# Then login again
```

### API errors
```bash
# Check server logs
# Verify JWT_SECRET is set in .env
# Verify MongoDB connection
```

---

## 📚 Documentation

- **RBAC_IMPLEMENTATION.md** - Complete technical docs
- **TESTING_GUIDE.md** - Testing scenarios
- **RBAC_SUMMARY.md** - Implementation overview

---

## ✅ Verification

After setup, verify:
- [ ] Patient signup creates Patient ID
- [ ] Doctor signup works without Patient ID
- [ ] Patient can see their Patient ID
- [ ] Doctor can search by Patient ID
- [ ] Role-based routes are protected
- [ ] Existing features still work

---

## 🎉 You're Ready!

The role-based authentication is now active. Create test accounts and explore the new features!

**Need Help?**
- Check `TESTING_GUIDE.md` for detailed testing
- Review `RBAC_IMPLEMENTATION.md` for technical details
- Check browser console for errors
- Check server logs for API issues
