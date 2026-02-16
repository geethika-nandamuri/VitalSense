# 403 Forbidden Error Fix Summary

## 🔍 Root Cause Analysis

The 403 error occurs when:
1. **Authentication passes** (token is valid, user found)
2. **Authorization fails** (user role doesn't match required role)

The `requireRole('PATIENT')` middleware checks if `req.user.role === 'PATIENT'` (case-insensitive).

## 📝 Files Modified

### Backend (2 files):
1. ✅ **server/middleware/auth.js** - Added debug logging to auth and role check
2. ✅ **server/checkUsers.js** - NEW: Debug script to check user roles in DB

### Frontend (1 file):
3. ✅ **client/src/components/PatientAppointments.jsx** - Added token and error logging

---

## 🔧 Changes Made

### 1. Backend: auth.js - authenticate() middleware
**Added debug logging:**
```javascript
console.log('🔑 AUTH: Token present:', !!token);
console.log('🔑 AUTH: Decoded userId:', decoded.userId);
console.log('✅ AUTH: User found:', user.email, 'Role:', user.role);
console.log('❌ AUTH ERROR:', error.message);
```

### 2. Backend: auth.js - requireRole() middleware
**Added debug logging and detailed error response:**
```javascript
console.log('🔍 ROLE CHECK: User:', req.user.email, 'Role:', req.user.role, 'Required:', roles);
console.log('🔍 NORMALIZED: User role:', userRole, 'Allowed:', allowedRoles);
console.log('❌ ROLE CHECK FAILED: User role', userRole, 'not in', allowedRoles);
console.log('✅ ROLE CHECK PASSED');

// Enhanced error response
return res.status(403).json({ 
  error: 'Access denied. Insufficient permissions.',
  userRole: userRole,
  requiredRoles: allowedRoles
});
```

### 3. Frontend: PatientAppointments.jsx - handleBookAppointment()
**Added token and error logging:**
```javascript
const token = localStorage.getItem('token');
console.log('🔑 FRONTEND: Token present:', !!token);
console.log('🔑 FRONTEND: Token value:', token ? token.substring(0, 20) + '...' : 'null');
console.error('❌ BOOKING ERROR:', error);
console.error('❌ ERROR RESPONSE:', error.response?.data);

// Show detailed error message
setToastMessage(error.response?.data?.message || error.response?.data?.error || 'Error booking appointment');
```

---

## 🧪 Debugging Steps

### Step 1: Check User Role in Database
Run the debug script:
```bash
cd server
node checkUsers.js
```

**Expected output:**
```
📊 USERS IN DATABASE:
================================================================================

Email: patient@example.com
Name: Patient Name
Role: "PATIENT" (type: string)
PatientId: VS-PAT-XXXXXXXX
DoctorId: N/A
--------------------------------------------------------------------------------

✅ Total users: X
👤 Patients: X
👨⚕️ Doctors: X
❓ Other: 0
```

**If role is NOT "PATIENT":**
- The user was created with wrong role
- Need to update the user in MongoDB

### Step 2: Check Backend Console Logs
When booking appointment, look for:
```
🔑 AUTH: Token present: true
🔑 AUTH: Decoded userId: 507f1f77bcf86cd799439011
✅ AUTH: User found: patient@example.com Role: PATIENT
🔍 ROLE CHECK: User: patient@example.com Role: PATIENT Required: [ 'PATIENT' ]
🔍 NORMALIZED: User role: PATIENT Allowed: [ 'PATIENT' ]
✅ ROLE CHECK PASSED
BOOKING patientId: 507f1f77bcf86cd799439011
```

**If you see:**
```
❌ ROLE CHECK FAILED: User role DOCTOR not in [ 'PATIENT' ]
```
→ User logged in as DOCTOR trying to book appointment (not allowed)

**If you see:**
```
❌ ROLE CHECK FAILED: User role patient not in [ 'PATIENT' ]
```
→ User role is lowercase "patient" instead of uppercase "PATIENT"

### Step 3: Check Frontend Console Logs
```
🔑 FRONTEND: Token present: true
🔑 FRONTEND: Token value: eyJhbGciOiJIUzI1NiIs...
```

**If token is null:**
- User not logged in
- Token expired or cleared
- Need to login again

### Step 4: Check Error Response
Frontend will log:
```
❌ BOOKING ERROR: Error: Request failed with status code 403
❌ ERROR RESPONSE: {
  error: 'Access denied. Insufficient permissions.',
  userRole: 'DOCTOR',
  requiredRoles: ['PATIENT']
}
```

This tells you exactly why the request was denied.

---

## 🔧 Possible Fixes

### Fix 1: User has wrong role in database
**Problem:** User created as DOCTOR but trying to book appointment

**Solution:** Update user role in MongoDB:
```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "patient@example.com" },
  { $set: { role: "PATIENT" } }
)
```

Or create a migration script:
```javascript
// server/fixUserRole.js
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixRole() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await User.findOne({ email: 'patient@example.com' });
  user.role = 'PATIENT';
  await user.save();
  
  console.log('✅ Role updated to PATIENT');
  await mongoose.disconnect();
}

fixRole();
```

### Fix 2: User has lowercase role
**Problem:** Role is "patient" instead of "PATIENT"

**Solution:** The middleware already normalizes to uppercase, so this should work. But if it doesn't, update the database:
```javascript
db.users.updateMany(
  { role: "patient" },
  { $set: { role: "PATIENT" } }
)
```

### Fix 3: Token not being sent
**Problem:** Token is null in localStorage

**Solution:** User needs to login again. The token might have expired or been cleared.

### Fix 4: User logged in as DOCTOR
**Problem:** Doctor account trying to book appointment

**Solution:** This is expected behavior. Doctors cannot book appointments for themselves. User needs to:
1. Logout
2. Login with a PATIENT account
3. Then book appointment

---

## ✅ Expected Flow (Working)

### 1. Frontend sends request:
```
POST /api/appointments/book
Headers: {
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."
}
Body: {
  doctorId: "...",
  date: "2024-01-15",
  time: "10:00"
}
```

### 2. Backend authenticate middleware:
```
🔑 AUTH: Token present: true
🔑 AUTH: Decoded userId: 507f1f77bcf86cd799439011
✅ AUTH: User found: patient@example.com Role: PATIENT
```

### 3. Backend requireRole middleware:
```
🔍 ROLE CHECK: User: patient@example.com Role: PATIENT Required: [ 'PATIENT' ]
🔍 NORMALIZED: User role: PATIENT Allowed: [ 'PATIENT' ]
✅ ROLE CHECK PASSED
```

### 4. Backend booking controller:
```
BOOKING patientId: 507f1f77bcf86cd799439011
APPOINTMENT SAVED: { ... }
```

### 5. Backend response:
```json
{
  "success": true,
  "message": "Booked",
  "appointment": { ... }
}
```

### 6. Frontend success:
```
BOOK RES: { success: true, message: 'Booked', appointment: {...} }
FETCHING MY APPOINTMENTS...
MY APPOINTMENTS RESPONSE: { success: true, data: [...] }
```

---

## 🎯 Next Steps

1. **Restart backend server** to apply logging changes
2. **Check browser console** for frontend logs
3. **Check terminal** for backend logs
4. **Run checkUsers.js** to verify user roles
5. **Try booking again** and observe logs

The logs will tell you EXACTLY why the 403 is happening:
- Missing token → Login again
- Wrong role → Update user in DB or login with correct account
- Token expired → Login again

---

## 📋 Quick Checklist

- ✅ Backend has debug logging in auth.js
- ✅ Frontend has debug logging in PatientAppointments.jsx
- ✅ Created checkUsers.js script
- ✅ Error response includes userRole and requiredRoles
- ✅ Frontend shows detailed error message in toast
- ✅ No localStorage used for appointments (MongoDB only)
- ✅ Success toast only shows after API confirms save

**The 403 error is now fully debuggable with detailed logs!**
