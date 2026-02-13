import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  TextField
} from '@mui/material';
import {
  CalendarToday,
  AccessTime,
  Person,
  CheckCircle,
  Cancel,
  LocationCity,
  LocalHospital
} from '@mui/icons-material';

// ===== CONFIGURATION =====
const SLOT_DURATION_MIN = 30;
const MAX_PATIENTS_PER_SLOT = 5; // Hospital requirement (can be changed to 4 or other value)

const PatientAppointments = () => {
  // Sample appointment data structure
  const appointmentData = [
    {
      city: 'Tadepalligudem',
      hospitals: [
        {
          name: 'Sri Sai Multi Speciality Hospital',
          specializations: [
            {
              name: 'Cardiology',
              problemHint: 'Heart pain, BP, Cholesterol, ECG',
              doctors: [
                { id: 'd1', name: 'Dr. Anil Kumar' },
                { id: 'd4', name: 'Dr. Meena Reddy' }
              ]
            },
            {
              name: 'General Medicine',
              problemHint: 'Fever, Cold, Body pains, General checkup',
              doctors: [
                { id: 'd3', name: 'Dr. Naveen Rao' }
              ]
            }
          ]
        },
        {
          name: 'City Care Clinic',
          specializations: [
            {
              name: 'Endocrinology',
              problemHint: 'Diabetes, Thyroid, Hormones',
              doctors: [
                { id: 'd2', name: 'Dr. Priya Sharma' }
              ]
            }
          ]
        }
      ]
    },
    {
      city: 'Bhimavaram',
      hospitals: [
        {
          name: 'Apollo Health Center',
          specializations: [
            {
              name: 'Dermatology',
              problemHint: 'Skin allergy, Acne, Hair fall',
              doctors: [
                { id: 'd5', name: 'Dr. Rahul Verma' }
              ]
            }
          ]
        }
      ]
    }
  ];

  // Time slots (09:00 to 17:00, 30-minute intervals)
  const timeSlots = [];
  for (let h = 9; h <= 17; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 17) timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  // ===== CAPACITY-BASED BOOKING DATA =====
  // Backend-ready: This should come from GET /api/availability endpoint
  // Structure: { doctorId: { date: { time: bookingCount } } }
  const initialSlotBookings = {
    d1: {
      '2026-02-15': { '10:00': 3, '10:30': 5, '11:00': 1 },
      '2026-02-16': { '09:00': 4 }
    },
    d2: {
      '2026-02-20': { '10:00': 5, '10:30': 2 }
    },
    d3: {
      '2026-02-18': { '12:00': 3 }
    }
  };

  const [slotBookings, setSlotBookings] = useState(initialSlotBookings);

  // My appointments state - initial sample appointment
  const [myAppointments, setMyAppointments] = useState([
    {
      id: 1,
      city: 'Tadepalligudem',
      hospital: 'City Care Clinic',
      specialization: 'Endocrinology',
      specializationHint: 'Diabetes, Thyroid, Hormones',
      doctorId: 'd2',
      doctorName: 'Dr. Priya Sharma',
      date: '2026-02-20',
      time: '10:00',
      status: 'Confirmed'
    }
  ]);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Form state
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [showToast, setShowToast] = useState(false);

  // Get available options based on selections
  const getCities = () => appointmentData.map(item => item.city);

  const getHospitals = () => {
    if (!selectedCity) return [];
    const cityData = appointmentData.find(item => item.city === selectedCity);
    return cityData ? cityData.hospitals.map(h => h.name) : [];
  };

  const getSpecializations = () => {
    if (!selectedCity || !selectedHospital) return [];
    const cityData = appointmentData.find(item => item.city === selectedCity);
    const hospitalData = cityData?.hospitals.find(h => h.name === selectedHospital);
    return hospitalData ? hospitalData.specializations : [];
  };

  const getDoctors = () => {
    if (!selectedCity || !selectedHospital || !selectedSpecialization) return [];
    const cityData = appointmentData.find(item => item.city === selectedCity);
    const hospitalData = cityData?.hospitals.find(h => h.name === selectedHospital);
    const specializationData = hospitalData?.specializations.find(s => s.name === selectedSpecialization);
    return specializationData ? specializationData.doctors : [];
  };

  // Check doctor availability based on capacity
  // Backend-ready: This logic should be on server side for real-time accuracy
  const checkDoctorAvailability = (doctorId, date, time) => {
    if (!doctorId || !date || !time) return null;
    const currentCount = slotBookings[doctorId]?.[date]?.[time] ?? 0;
    const remaining = MAX_PATIENTS_PER_SLOT - currentCount;
    return {
      isAvailable: remaining > 0,
      remaining: remaining,
      currentCount: currentCount
    };
  };

  // Handle selection changes with cascading resets
  const handleCityChange = (e) => {
    setSelectedCity(e.target.value);
    setSelectedHospital('');
    setSelectedSpecialization('');
    setSelectedDoctor('');
    setSelectedDate('');
    setSelectedTime('');
    setAvailabilityStatus(null);
  };

  const handleHospitalChange = (e) => {
    setSelectedHospital(e.target.value);
    setSelectedSpecialization('');
    setSelectedDoctor('');
    setSelectedDate('');
    setSelectedTime('');
    setAvailabilityStatus(null);
  };

  const handleSpecializationChange = (e) => {
    setSelectedSpecialization(e.target.value);
    setSelectedDoctor('');
    setSelectedDate('');
    setSelectedTime('');
    setAvailabilityStatus(null);
  };

  const handleDoctorChange = (e) => {
    setSelectedDoctor(e.target.value);
    setSelectedDate('');
    setSelectedTime('');
    setAvailabilityStatus(null);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTime('');
    updateAvailability(selectedDoctor, e.target.value, selectedTime);
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
    updateAvailability(selectedDoctor, selectedDate, e.target.value);
  };

  const updateAvailability = (doctor, date, time) => {
    const availabilityInfo = checkDoctorAvailability(doctor, date, time);
    setAvailabilityStatus(availabilityInfo);
  };

  // Book appointment with capacity increment
  // Backend-ready: Should call POST /api/appointments which atomically increments count
  const handleBookAppointment = () => {
    const doctors = getDoctors();
    const doctor = doctors.find(d => d.id === selectedDoctor);
    const specializations = getSpecializations();
    const specializationData = specializations.find(s => s.name === selectedSpecialization);
    
    // Safety check: Prevent overbooking
    const currentCount = slotBookings[selectedDoctor]?.[selectedDate]?.[selectedTime] ?? 0;
    if (currentCount >= MAX_PATIENTS_PER_SLOT) {
      alert('Slot already full, please choose another time');
      return;
    }
    
    // Update slot bookings (increment count)
    // Backend-ready: This should be handled by server atomically
    setSlotBookings(prev => ({
      ...prev,
      [selectedDoctor]: {
        ...(prev[selectedDoctor] || {}),
        [selectedDate]: {
          ...((prev[selectedDoctor] || {})[selectedDate] || {}),
          [selectedTime]: (((prev[selectedDoctor] || {})[selectedDate] || {})[selectedTime] || 0) + 1
        }
      }
    }));

    // Add to my appointments
    const newAppointment = {
      id: Date.now(),
      city: selectedCity,
      hospital: selectedHospital,
      specialization: selectedSpecialization,
      specializationHint: specializationData?.problemHint || '',
      doctorId: selectedDoctor,
      doctorName: doctor.name,
      date: selectedDate,
      time: selectedTime,
      status: 'Confirmed'
    };
    setMyAppointments(prev => [...prev, newAppointment]);

    // Reset form
    setSelectedCity('');
    setSelectedHospital('');
    setSelectedSpecialization('');
    setSelectedDoctor('');
    setSelectedDate('');
    setSelectedTime('');
    setAvailabilityStatus(null);
    setShowToast(true);
  };

  const isBookingEnabled = selectedCity && selectedHospital && selectedSpecialization && 
                          selectedDoctor && selectedDate && selectedTime && 
                          availabilityStatus?.isAvailable === true;

  // Get slot capacity info for display
  const getSlotCapacityInfo = (time) => {
    if (!selectedDoctor || !selectedDate) return '';
    const currentCount = slotBookings[selectedDoctor]?.[selectedDate]?.[time] ?? 0;
    const remaining = MAX_PATIENTS_PER_SLOT - currentCount;
    if (remaining === 0) return ' (FULL)';
    return ` (${currentCount}/${MAX_PATIENTS_PER_SLOT} booked)`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-background)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Main Heading */}
        <Box className="animate-on-load" sx={{ mb: 4 }}>
          <Typography variant="h3" className="text-gradient" sx={{ fontWeight: 800, mb: 2 }}>
            Appointments
          </Typography>
          <Typography variant="h6" sx={{ color: 'var(--gray-500)', fontWeight: 400 }}>
            Book new appointments and manage your scheduled visits
          </Typography>
        </Box>

        {/* Tabs */}
        <Card className="premium-card">
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 64
              }
            }}
          >
            <Tab label="Book Appointment" />
            <Tab label="My Appointments" />
          </Tabs>

          {/* Tab 1: Book Appointment */}
          {activeTab === 0 && (
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'var(--gray-800)' }}>
                Select Appointment Details
              </Typography>
              
              <Grid container spacing={3}>
                {/* City */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Select City</InputLabel>
                    <Select
                      value={selectedCity}
                      onChange={handleCityChange}
                      label="Select City"
                      sx={{ borderRadius: 'var(--radius-lg)' }}
                    >
                      {getCities().map(city => (
                        <MenuItem key={city} value={city}>{city}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Hospital */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!selectedCity}>
                    <InputLabel>Select Hospital</InputLabel>
                    <Select
                      value={selectedHospital}
                      onChange={handleHospitalChange}
                      label="Select Hospital"
                      sx={{ borderRadius: 'var(--radius-lg)' }}
                    >
                      {getHospitals().map(hospital => (
                        <MenuItem key={hospital} value={hospital}>{hospital}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Specialization */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!selectedHospital}>
                    <InputLabel>Select Specialization</InputLabel>
                    <Select
                      value={selectedSpecialization}
                      onChange={handleSpecializationChange}
                      label="Select Specialization"
                      sx={{ borderRadius: 'var(--radius-lg)' }}
                    >
                      {getSpecializations().map(spec => (
                        <MenuItem key={spec.name} value={spec.name}>
                          {spec.name} ({spec.problemHint})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedHospital && (
                    <Typography variant="caption" sx={{ color: 'var(--gray-500)', mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                      💡 Tip: Choose based on your health problem (e.g., chest pain → Cardiology)
                    </Typography>
                  )}
                </Grid>

                {/* Doctor */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!selectedSpecialization}>
                    <InputLabel>Select Doctor</InputLabel>
                    <Select
                      value={selectedDoctor}
                      onChange={handleDoctorChange}
                      label="Select Doctor"
                      sx={{ borderRadius: 'var(--radius-lg)' }}
                    >
                      {getDoctors().map(doctor => (
                        <MenuItem key={doctor.id} value={doctor.id}>{doctor.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Date */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Select Date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    disabled={!selectedDoctor}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--radius-lg)' } }}
                  />
                </Grid>

                {/* Time */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth disabled={!selectedDate}>
                    <InputLabel>Select Time</InputLabel>
                    <Select
                      value={selectedTime}
                      onChange={handleTimeChange}
                      label="Select Time"
                      sx={{ borderRadius: 'var(--radius-lg)' }}
                    >
                      {timeSlots.map(slot => {
                        const capacityInfo = getSlotCapacityInfo(slot);
                        const isFull = capacityInfo.includes('FULL');
                        return (
                          <MenuItem 
                            key={slot} 
                            value={slot}
                            disabled={isFull}
                            sx={{
                              color: isFull ? 'var(--gray-400)' : 'inherit',
                              fontWeight: isFull ? 600 : 400
                            }}
                          >
                            {slot}{capacityInfo}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Availability Status */}
              {availabilityStatus !== null && (
                <Box sx={{ mt: 3 }}>
                  {availabilityStatus.isAvailable ? (
                    <Alert 
                      icon={<CheckCircle />} 
                      severity="success"
                      sx={{ borderRadius: 'var(--radius-lg)', fontWeight: 600 }}
                    >
                      ✅ Available (Remaining: {availabilityStatus.remaining} slot{availabilityStatus.remaining !== 1 ? 's' : ''})
                    </Alert>
                  ) : (
                    <Alert 
                      icon={<Cancel />} 
                      severity="error"
                      sx={{ borderRadius: 'var(--radius-lg)', fontWeight: 600 }}
                    >
                      ❌ Not Available (Slot full - {availabilityStatus.currentCount}/{MAX_PATIENTS_PER_SLOT} booked)
                    </Alert>
                  )}
                </Box>
              )}

              {/* Book Button */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  disabled={!isBookingEnabled}
                  onClick={handleBookAppointment}
                  sx={{
                    background: isBookingEnabled ? 'var(--gradient-primary)' : 'var(--gray-300)',
                    borderRadius: 'var(--radius-xl)',
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: isBookingEnabled ? 'var(--shadow-md)' : 'none',
                    '&:hover': {
                      transform: isBookingEnabled ? 'translateY(-2px)' : 'none',
                      boxShadow: isBookingEnabled ? 'var(--shadow-xl)' : 'none'
                    }
                  }}
                >
                  Book Appointment
                </Button>
              </Box>
            </CardContent>
          )}

          {/* Tab 2: My Appointments */}
          {activeTab === 1 && (
            <CardContent sx={{ p: 4 }}>
              {myAppointments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CalendarToday sx={{ fontSize: 64, color: 'var(--gray-300)', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'var(--gray-500)' }}>
                    No appointments booked yet
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {myAppointments.map((appointment, index) => (
                    <Grid item xs={12} md={6} key={appointment.id}>
                      <Card 
                        className="hover-lift" 
                        sx={{ 
                          border: '1px solid var(--gray-200)',
                          borderRadius: 'var(--radius-xl)',
                          boxShadow: 'var(--shadow-sm)',
                          animationDelay: `${index * 0.1}s`
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ color: 'var(--primary-600)', fontSize: 28 }} />
                              <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                                {appointment.doctorName}
                              </Typography>
                            </Box>
                            <Chip 
                              label={appointment.status} 
                              color={appointment.status === 'Confirmed' ? 'success' : 'warning'} 
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }} 
                            />
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {/* City */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LocationCity sx={{ color: '#1e40af', fontSize: 20 }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>City</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{appointment.city}</Typography>
                              </Box>
                            </Box>

                            {/* Hospital */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LocalHospital sx={{ color: '#be185d', fontSize: 20 }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Hospital</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{appointment.hospital}</Typography>
                              </Box>
                            </Box>

                            {/* Specialization */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--secondary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Person sx={{ color: 'var(--secondary-600)', fontSize: 20 }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Specialization</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{appointment.specialization}</Typography>
                                {appointment.specializationHint && (
                                  <Typography variant="caption" sx={{ color: 'var(--gray-400)', display: 'block', fontStyle: 'italic' }}>
                                    For: {appointment.specializationHint}
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            {/* Date */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CalendarToday sx={{ color: 'var(--primary-600)', fontSize: 20 }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Date</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{formatDate(appointment.date)}</Typography>
                              </Box>
                            </Box>

                            {/* Time */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--accent-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <AccessTime sx={{ color: 'var(--accent-600)', fontSize: 20 }} />
                              </Box>
                              <Box>
                                <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Time</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{appointment.time}</Typography>
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          )}
        </Card>

        {/* Success Toast */}
        <Snackbar
          open={showToast}
          autoHideDuration={3000}
          onClose={() => setShowToast(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ borderRadius: 'var(--radius-lg)', fontWeight: 600 }}>
            ✅ Appointment booked successfully!
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default PatientAppointments;
