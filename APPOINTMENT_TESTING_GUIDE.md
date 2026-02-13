# Quick Testing Guide - Appointment Booking Feature

## 🚀 How to Test

### Access the Feature
1. Start the application: `npm run dev`
2. Login as a PATIENT
3. Click "Appointments" in the navbar
4. You'll see the booking form at the top

---

## ✅ Test Case 1: Book Available Appointment

**Steps:**
1. Select Doctor: "Dr. Naveen Rao - General Physician"
2. Select Date: "2026-02-19" (or any future date except 2026-02-18)
3. Select Time: "10:00"

**Expected Result:**
- ✅ Green alert: "Doctor available at selected time"
- "Book Appointment" button is ENABLED (blue gradient)
- Click "Book Appointment"
- Success toast appears: "Appointment booked successfully!"
- New appointment card appears in "My Appointments" section below
- Form resets

---

## ❌ Test Case 2: Try Unavailable Slot

**Steps:**
1. Select Doctor: "Dr. Anil Kumar - Cardiologist"
2. Select Date: "2026-02-15"
3. Select Time: "10:30"

**Expected Result:**
- ❌ Red alert: "Doctor not available at selected time"
- "Book Appointment" button is DISABLED (gray)
- Cannot click the button

---

## 🔄 Test Case 3: Double Booking Prevention

**Steps:**
1. Book an appointment (e.g., Dr. Naveen Rao, 2026-02-19, 10:00)
2. Try to book the SAME slot again:
   - Select same doctor
   - Select same date
   - Select same time

**Expected Result:**
- ❌ Red alert: "Doctor not available"
- Button is DISABLED
- Slot is now blocked

---

## 📋 Pre-Booked Slots (For Testing)

### Dr. Anil Kumar (d1)
- **2026-02-15**: 10:30, 11:00 ❌
- **2026-02-16**: 09:00 ❌
- All other dates/times: ✅

### Dr. Priya Sharma (d2)
- **2026-02-15**: 16:00 ❌
- **2026-02-20**: 10:00, 10:30 ❌
- All other dates/times: ✅

### Dr. Naveen Rao (d3)
- **2026-02-18**: 12:00 ❌
- All other dates/times: ✅

---

## 🎯 Button State Testing

### Button Should Be DISABLED When:
- No doctor selected
- No date selected
- No time selected
- Doctor not available at selected slot

### Button Should Be ENABLED When:
- Doctor selected ✓
- Date selected ✓
- Time selected ✓
- Doctor IS available ✓

---

## 📱 Responsive Testing

Test on different screen sizes:
- **Desktop**: Cards in 2 columns
- **Tablet**: Cards in 2 columns
- **Mobile**: Cards in 1 column

---

## 🎨 Visual Checks

### Colors
- Available alert: Green background
- Not available alert: Red background
- Book button (enabled): Blue gradient
- Book button (disabled): Gray
- Status chip: Green "Confirmed"

### Animations
- Cards have hover lift effect
- Button has hover effect when enabled
- Smooth transitions

---

## 🐛 Edge Cases to Test

1. **Select time before doctor**: Should not show availability
2. **Change doctor after selecting time**: Availability should update
3. **Select past date**: Date picker should prevent this
4. **Book multiple appointments**: All should appear in list
5. **Empty appointments list**: Should show "No appointments booked yet"

---

## 📸 What You Should See

### Initial State
```
┌─────────────────────────────────────┐
│ Book Appointment                    │
│ Check doctor availability...        │
├─────────────────────────────────────┤
│ [Select Doctor ▼] [Date] [Time ▼]  │
│                                     │
│ [Book Appointment] (DISABLED/GRAY)  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ My Appointments                     │
├─────────────────────────────────────┤
│ 📅 No appointments booked yet       │
└─────────────────────────────────────┘
```

### After Selecting Available Slot
```
┌─────────────────────────────────────┐
│ [Dr. Naveen Rao] [2026-02-19] [10:00]│
│                                     │
│ ✅ Doctor available at selected time│
│                                     │
│ [Book Appointment] (ENABLED/BLUE)   │
└─────────────────────────────────────┘
```

### After Booking
```
┌─────────────────────────────────────┐
│ My Appointments                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 👤 Dr. Naveen Rao    [Confirmed]│ │
│ │ 👨‍⚕️ General Physician            │ │
│ │ 📅 19 Feb 2026                   │ │
│ │ ⏰ 10:00                         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## ✨ Success Criteria

✅ Can select doctor, date, and time  
✅ Availability check works correctly  
✅ Button enables/disables appropriately  
✅ Can book available appointments  
✅ Cannot book unavailable appointments  
✅ Booked appointments appear in list  
✅ Success toast shows after booking  
✅ Form resets after booking  
✅ Double booking is prevented  
✅ UI is clean and professional  

---

## 🔧 Troubleshooting

**Issue**: Button stays disabled even when slot is available
- **Check**: All three fields (doctor, date, time) are selected
- **Check**: Availability status shows green checkmark

**Issue**: Appointments not appearing after booking
- **Check**: Console for errors
- **Check**: State is updating correctly

**Issue**: Date picker allows past dates
- **Check**: `min` attribute is set to today's date

---

## 📞 Quick Reference

**Component Location**: `client/src/components/PatientAppointments.jsx`  
**Route**: `/appointments`  
**Access**: Patient role only  
**Backend**: Not required (uses static data)  

---

Ready to test! 🎉
