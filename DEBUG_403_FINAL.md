# 403 Error Fix - Final Debug Guide

## ✅ Changes Made

### Backend Files Modified:
1. **server/middleware/auth.js**
   - Enhanced `requireRole()` to handle Mongoose documents properly
   - Added logging for raw role value and type
   - Uses both `req.user.role` and `req.user.get('role')` for compatibility

2. **server/routes/appointments.js**
   - Added detailed logging block showing user ID, email, role, and request body
   - Logs success/failure clearly

### Frontend Files Modified:
3. **client/src/components/PatientAppointments.jsx**
   - Enhanced error handling for 403 errors
   - Shows detailed error message with role information
   - Logs token preview and request details

---

## 🧪 Testing Steps

### Step 1: Restart Backend Server
```bash
cd server
npm start
```

### Step 2: Open Browser Console
- Open DevTools (F12)
- Go to Console tab
- Clear console

### Step 3: Login as Patient
- Login with: alice@gmail.com (PATIENT role)
- Check console for token storage

### Step 4: Try to Book Appointment
- Go to Appointments page
- Select doctor, date, time
- Click "Book Appointment"

### Step 5: Check Logs

**Frontend Console (Browser):**
```
🔑 FRONTEND: Token present: true
🔑 FRONTEND: Token preview: eyJhbGciOiJIUzI1NiIsInR5cCI6...
📝 FRONTEND: Booking request: { doctorId: '...', date: '...', time: '...' }
```

**Backend Console (Terminal):**
```
🔑 AUTH: Token present: true
🔑 AUTH: Decoded userId: 67a1b2c3d4e5f6789012345
✅ AUTH: User found: alice@gmail.com Role: PATIENT

🔍 ROLE CHECK: User: alice@gmail.com Raw Role: PATIENT Type: string Required: [ 'PATIENT' ]
🔍 NORMALIZED: User role: PATIENT Allowed: [ 'PATIENT' ]
✅ ROLE CHECK PASSED

=== BOOKING REQUEST ===
User ID: 67a1b2c3d4e5f6789012345
User Email: alice@gmail.com
User Role: PATIENT
Request Body: { doctorId: '...', date: '...', time: '...' }
======================

✅ APPOINTMENT SAVED: 67a1b2c3d4e5f6789012346
```

---

## 🔍 Diagnosing the 403 Error

### Scenario 1: Token Missing
**Frontend Console:**
```
🔑 FRONTEND: Token present: false
```

**Backend Console:**
```
🔑 AUTH: Token present: false
```

**Cause:** User not logged in or token expired

**Fix:** Login again

---

### Scenario 2: Wrong Role (Doctor trying to book)
**Backend Console:**
```
✅ AUTH: User found: bob@gmail.com Role: DOCTOR
🔍 ROLE CHECK: User: bob@gmail.com Raw Role: DOCTOR Type: string Required: [ 'PATIENT' ]
🔍 NORMALIZED: User role: DOCTOR Allowed: [ 'PATIENT' ]
❌ ROLE CHECK FAILED: User role DOCTOR not in [ 'PATIENT' ]
```

**Frontend Console:**
```
❌ BOOKING ERROR: Error: Request failed with status code 403
❌ ERROR STATUS: 403
❌ ERROR DATA: {
  error: 'Access denied. Insufficient permissions.',
  userRole: 'DOCTOR',
  requiredRoles: ['PATIENT']
}
```

**Frontend Toast:**
```
Access denied. Please login as a patient. (Your role: DOCTOR, Required: PATIENT)
```

**Cause:** Doctor account trying to book appointment

**Fix:** Logout and login with a PATIENT account (alice@gmail.com)

---

### Scenario 3: Role Field Issue
**Backend Console:**
```
✅ AUTH: User found: alice@gmail.com Role: undefined
🔍 ROLE CHECK: User: alice@gmail.com Raw Role: undefined Type: undefined Required: [ 'PATIENT' ]
🔍 NORMALIZED: User role:  Allowed: [ 'PATIENT' ]
❌ ROLE CHECK FAILED: User role  not in [ 'PATIENT' ]
```

**Cause:** User document doesn't have role field

**Fix:** Run fixUserRoles.js script:
```bash
cd server
node fixUserRoles.js
```

---

### Scenario 4: Success (Expected)
**Frontend Console:**
```
🔑 FRONTEND: Token present: true
📝 FRONTEND: Booking request: { ... }
✅ BOOK SUCCESS: { success: true, message: 'Booked', appointment: {...} }
FETCHING MY APPOINTMENTS...
MY APPOINTMENTS RESPONSE: { success: true, data: [...] }
```

**Backend Console:**
```
✅ AUTH: User found: alice@gmail.com Role: PATIENT
✅ ROLE CHECK PASSED
=== BOOKING REQUEST ===
User Email: alice@gmail.com
User Role: PATIENT
======================
✅ APPOINTMENT SAVED: 67a1b2c3d4e5f6789012346
```

**Frontend Toast:**
```
Appointment booked successfully!
```

---

## 🎯 Quick Diagnosis

Run this in browser console while on Appointments page:
```javascript
// Check token
console.log('Token:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING');

// Check user
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('User:', user.email, 'Role:', user.role);
```

**Expected output for PATIENT:**
```
Token: EXISTS
User: alice@gmail.com Role: PATIENT
```

**If role is DOCTOR:**
- You're logged in as a doctor
- Doctors cannot book appointments
- Logout and login as patient

**If token is MISSING:**
- You're not logged in
- Login again

---

## 📋 Summary

### Exact Cause of 403:
The logs will show ONE of these:
1. ❌ **No token** → User not logged in
2. ❌ **User role DOCTOR not in [ 'PATIENT' ]** → Doctor trying to book
3. ❌ **User role  not in [ 'PATIENT' ]** → Role field missing/undefined

### Files Changed:
1. `server/middleware/auth.js` - Enhanced role checking
2. `server/routes/appointments.js` - Added detailed logging
3. `client/src/components/PatientAppointments.jsx` - Enhanced error handling

### Test Accounts:
- **Patient:** alice@gmail.com (can book appointments)
- **Doctor:** bob@gmail.com (cannot book appointments)

### Next Steps:
1. Restart backend server
2. Login as alice@gmail.com (PATIENT)
3. Try booking appointment
4. Check logs in both browser console and terminal
5. The logs will tell you EXACTLY why 403 is happening

**The error message will now show your role and required role!**
