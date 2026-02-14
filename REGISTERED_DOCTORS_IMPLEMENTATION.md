# Registered Doctors Only Flow - Implementation Summary

## Overview
Implemented a complete "Registered Doctors Only" system where only doctors who complete their profile can appear in patient appointment bookings. Uses localStorage-based registry with efficient memoization.

## Files Created

### 1. `c:\VitalSense\client\src\services\doctorsStore.js` (NEW)
**Purpose:** Doctor registry service - Single source of truth for registered doctors

**Storage Key:** `'vitalsense_doctors'`

**Functions:**
- `getDoctors()` - Get all doctors from localStorage
- `upsertDoctor(doctorObj)` - Add or update doctor by doctorId
- `getDoctorById(doctorId)` - Get specific doctor
- `getDoctorsByCity(city)` - Filter by city
- `getCities()` - Get unique cities
- `getHospitals(city)` - Get unique hospitals in city
- `getSpecializations(city, hospital)` - Get unique specializations
- `getDoctorsByFilters(city, hospital, specialization)` - Get filtered doctors

**Doctor Object Schema:**
```javascript
{
  doctorId: "user._id",
  name: "Dr. John Doe",
  phone: "9876543210",
  email: "doctor@example.com",
  city: "Tadepalligudem",
  hospitalName: "City Hospital",
  specialization: "Cardiology",
  experienceYears: 10,
  consultationFee: 500,
  maxPatientsPerSlot: 5,        // 4 or 5
  slotDurationMin: 30,           // Fixed
  timeWindow: {
    start: "09:00",
    end: "17:00"
  },
  isActive: true,
  createdAt: "2024-...",
  updatedAt: "2024-..."
}
```

### 2. `c:\VitalSense\client\src\components\DoctorProfileCompletion.jsx` (NEW)
**Purpose:** Modal form for collecting doctor details on first login/signup

**Required Fields:**
- Full Name (pre-filled from auth)
- Phone Number (10 digits, mandatory)
- City (mandatory)
- Hospital/Clinic Name (mandatory)
- Specialization (mandatory, dropdown with hints)
- Patients Per Slot (mandatory, 4 or 5)

**Optional Fields:**
- Experience Years
- Consultation Fee
- Time Window (start/end)

**Specialization Options with Hints:**
- Cardiology (Heart pain, BP, Cholesterol, ECG)
- General Medicine (Fever, Cold, Body pains, General checkup)
- Endocrinology (Diabetes, Thyroid, Hormones)
- Dermatology (Skin allergy, Acne, Hair fall)
- Orthopedics (Bone, Joint, Muscle problems)
- Pediatrics (Child health, Vaccinations)
- Gynecology (Women health, Pregnancy)
- Neurology (Brain, Nerve, Headache)

**Validation:**
- Phone: `/^\d{10}$/`
- All required fields must be filled
- Save button disabled until valid

**UI Features:**
- Professional grid layout
- Icon prefixes for each field
- Info alert at top
- Cannot be closed (disableEscapeKeyDown)
- Shows capacity info below slot selection

## Files Modified

### 3. `c:\VitalSense\client\src\pages\DoctorDashboard.jsx` (MODIFIED)

**Changes:**
- Imported `useAuth`, `getDoctorById`, `upsertDoctor`, `DoctorProfileCompletion`
- Added `showProfileCompletion` state
- Added `useEffect` to check if doctor profile exists on mount
- Shows `DoctorProfileCompletion` modal if profile not found
- Calls `upsertDoctor()` on profile completion

**Where Doctor Details Are Collected:**
```javascript
useEffect(() => {
  if (user && user.role === 'DOCTOR') {
    const doctorProfile = getDoctorById(user._id);
    if (!doctorProfile) {
      setShowProfileCompletion(true);  // Show modal
    }
  }
}, [user]);

const handleProfileComplete = (doctorProfile) => {
  upsertDoctor(doctorProfile);  // Save to registry
  setShowProfileCompletion(false);
};
```

**Flow:**
1. Doctor logs in
2. DoctorDashboard checks if profile exists in registry
3. If not found → Show profile completion modal
4. Doctor fills required details
5. On save → `upsertDoctor()` stores in localStorage
6. Modal closes, doctor can access dashboard

### 4. `c:\VitalSense\client\src\components\PatientAppointments.jsx` (MODIFIED)

**Major Changes:**

#### Removed Hardcoded Data:
- Removed `appointmentData` array (cities, hospitals, specializations, doctors)
- Removed `MAX_PATIENTS_PER_SLOT` constant
- Removed `SLOT_DURATION_MIN` constant

#### Added Imports:
```javascript
import { getDoctors, getCities, getHospitals, getSpecializations, getDoctorsByFilters } from '../services/doctorsStore';
```

#### Added useMemo for Efficiency:
```javascript
const registeredDoctors = useMemo(() => getDoctors().filter(d => d.isActive), []);

const cities = useMemo(() => getCities(), []);

const hospitals = useMemo(() => {
  if (!selectedCity) return [];
  return getHospitals(selectedCity);
}, [selectedCity]);

const specializations = useMemo(() => {
  if (!selectedCity || !selectedHospital) return [];
  return getSpecializations(selectedCity, selectedHospital);
}, [selectedCity, selectedHospital]);

const doctorsFiltered = useMemo(() => {
  if (!selectedCity || !selectedHospital || !selectedSpecialization) return [];
  return getDoctorsByFilters(selectedCity, selectedHospital, selectedSpecialization);
}, [selectedCity, selectedHospital, selectedSpecialization]);

const selectedDoctorProfile = useMemo(() => {
  return doctorsFiltered.find(d => d.doctorId === selectedDoctor);
}, [doctorsFiltered, selectedDoctor]);
```

#### Updated Dropdown Generation:
**Cities:**
```javascript
{cities.map(city => (
  <MenuItem key={city} value={city}>{city}</MenuItem>
))}
```

**Hospitals:**
```javascript
{hospitals.map(hospital => (
  <MenuItem key={hospital} value={hospital}>{hospital}</MenuItem>
))}
```

**Specializations:**
```javascript
{specializations.map(spec => (
  <MenuItem key={spec} value={spec}>{spec}</MenuItem>
))}
```

**Doctors:**
```javascript
{doctorsFiltered.map(doctor => (
  <MenuItem key={doctor.doctorId} value={doctor.doctorId}>
    {doctor.name}
    {doctor.experienceYears > 0 && ` (${doctor.experienceYears} yrs exp)`}
  </MenuItem>
))}
```

#### Updated Availability Check:
```javascript
const checkDoctorAvailability = (doctorId, date, time) => {
  if (!doctorId || !date || !time) return null;
  const doctor = doctorsFiltered.find(d => d.doctorId === doctorId);
  const maxSlots = doctor?.maxPatientsPerSlot || 5;  // Per-doctor capacity
  const currentCount = slotBookings[doctorId]?.[date]?.[time] ?? 0;
  const remaining = maxSlots - currentCount;
  return {
    isAvailable: remaining > 0,
    remaining: remaining,
    currentCount: currentCount,
    maxSlots: maxSlots
  };
};
```

#### Updated Booking Logic:
```javascript
const handleBookAppointment = () => {
  if (!selectedDoctorProfile) return;
  
  const maxSlots = selectedDoctorProfile.maxPatientsPerSlot;  // From doctor profile
  const currentCount = slotBookings[selectedDoctor]?.[selectedDate]?.[selectedTime] ?? 0;
  
  if (currentCount >= maxSlots) {
    alert('Slot already full, please choose another time');
    return;
  }
  
  // ... rest of booking logic
};
```

#### Added Doctor Summary Display:
```javascript
{selectedDoctorProfile && (
  <Typography variant="caption" sx={{ color: 'var(--gray-500)', mt: 0.5, display: 'block' }}>
    Capacity: {selectedDoctorProfile.maxPatientsPerSlot} patients per {selectedDoctorProfile.slotDurationMin} min
  </Typography>
)}
```

## How Patient Dropdowns Are Generated

### Flow:
1. **Load Registered Doctors:** `registeredDoctors = getDoctors().filter(d => d.isActive)`
2. **City Selection:** `cities = getCities()` → Unique cities from active doctors
3. **Hospital Selection:** `hospitals = getHospitals(selectedCity)` → Unique hospitals in selected city
4. **Specialization Selection:** `specializations = getSpecializations(selectedCity, selectedHospital)` → Unique specializations
5. **Doctor Selection:** `doctorsFiltered = getDoctorsByFilters(city, hospital, specialization)` → Filtered doctors

### Efficiency:
- All dropdown options use `useMemo` to prevent recalculation
- Filters cascade: City → Hospital → Specialization → Doctor
- Only active doctors (`isActive: true`) are shown
- Normalized data structure prevents duplicate computation

## How maxPatientsPerSlot Is Used

### 1. In Doctor Profile:
- Doctor selects 4 or 5 during profile completion
- Stored in `doctor.maxPatientsPerSlot`

### 2. In Availability Check:
```javascript
const doctor = doctorsFiltered.find(d => d.doctorId === doctorId);
const maxSlots = doctor?.maxPatientsPerSlot || 5;
const remaining = maxSlots - currentCount;
```

### 3. In Booking Validation:
```javascript
if (currentCount >= selectedDoctorProfile.maxPatientsPerSlot) {
  alert('Slot already full');
  return;
}
```

### 4. In Slot Display:
```javascript
const getSlotCapacityInfo = (time) => {
  const maxSlots = doctor?.maxPatientsPerSlot || 5;
  const currentCount = slotBookings[doctorId]?.[date]?.[time] ?? 0;
  return ` (${currentCount}/${maxSlots} booked)`;
};
```

### 5. In Doctor Summary:
```javascript
Capacity: {selectedDoctorProfile.maxPatientsPerSlot} patients per {selectedDoctorProfile.slotDurationMin} min
```

## Data Flow Diagram

```
Doctor Signup/Login
    ↓
Check getDoctorById(user._id)
    ↓
Profile Not Found? → Show DoctorProfileCompletion Modal
    ↓
Doctor Fills Details
    ↓
upsertDoctor(profile) → localStorage['vitalsense_doctors']
    ↓
Profile Complete → Access Dashboard

Patient Booking
    ↓
Load getDoctors() → Filter isActive
    ↓
Select City → getCities()
    ↓
Select Hospital → getHospitals(city)
    ↓
Select Specialization → getSpecializations(city, hospital)
    ↓
Select Doctor → getDoctorsByFilters(city, hospital, specialization)
    ↓
Check Availability → doctor.maxPatientsPerSlot
    ↓
Book Appointment → addAppointment()
```

## Backend-Ready Design

All functions in `doctorsStore.js` can be replaced with API calls:
- `getDoctors()` → `axios.get('/api/doctors')`
- `upsertDoctor()` → `axios.post('/api/doctors', data)`
- `getDoctorById()` → `axios.get('/api/doctors/:id')`

Business logic remains the same, just swap localStorage with API calls.

## Testing Checklist

- [ ] Doctor logs in for first time → Profile completion modal appears
- [ ] Doctor cannot close modal without completing profile
- [ ] Phone validation works (10 digits)
- [ ] All required fields validated
- [ ] Profile saved to localStorage after completion
- [ ] Doctor can access dashboard after profile completion
- [ ] Patient sees only registered doctors in dropdowns
- [ ] City dropdown shows unique cities from registered doctors
- [ ] Hospital dropdown filters by selected city
- [ ] Specialization dropdown filters by city + hospital
- [ ] Doctor dropdown filters by city + hospital + specialization
- [ ] Doctor summary shows correct capacity
- [ ] Slot availability uses doctor's maxPatientsPerSlot
- [ ] Booking respects per-doctor capacity limits
- [ ] useMemo prevents unnecessary recalculations
