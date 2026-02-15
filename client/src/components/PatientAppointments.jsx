import React, { useState, useMemo, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { addAppointment, getAppointmentsByPatient } from '../services/appointmentsStore';
import api from '../utils/api';

const PatientAppointments = () => {
  const { user } = useAuth();
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Time slots (09:00 to 17:00, 30-minute intervals)
  const timeSlots = [];
  for (let h = 9; h <= 17; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 17) timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  // My appointments state - load from store
  const [myAppointments, setMyAppointments] = useState(() => {
    if (user && user._id) {
      return getAppointmentsByPatient(user._id);
    }
    return [];
  });

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Form state
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/api/patient/doctors');
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctorProfile = useMemo(() => {
    return doctors.find(d => d._id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  const handleDoctorChange = (e) => {
    setSelectedDoctorId(e.target.value);
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTime('');
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleBookAppointment = () => {
    if (!selectedDoctorProfile) return;
    
    const appointmentData = {
      doctorId: selectedDoctorId,
      doctorName: selectedDoctorProfile.name,
      patientId: user?._id || 'p101',
      patientName: user?.name || 'Patient',
      patientPhone: user?.phone || user?.phoneNumber || 'N/A',
      specialization: selectedDoctorProfile.specialization || 'General',
      hospital: selectedDoctorProfile.hospital || 'N/A',
      date: selectedDate,
      time: selectedTime,
      status: 'Confirmed'
    };

    const newAppointment = addAppointment(appointmentData);
    setMyAppointments(prev => [...prev, newAppointment]);

    setSelectedDoctorId('');
    setSelectedDate('');
    setSelectedTime('');
    setShowToast(true);
  };

  const isBookingEnabled = selectedDoctorId && selectedDate && selectedTime;

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
                {/* Doctor */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Doctor</InputLabel>
                    <Select
                      value={selectedDoctorId}
                      onChange={handleDoctorChange}
                      label="Select Doctor"
                      sx={{ borderRadius: 'var(--radius-lg)' }}
                    >
                      {loading ? (
                        <MenuItem disabled>Loading doctors...</MenuItem>
                      ) : doctors.length === 0 ? (
                        <MenuItem disabled>No doctors available</MenuItem>
                      ) : (
                        doctors.map(doctor => (
                          <MenuItem key={doctor._id} value={doctor._id}>
                            {doctor.name}
                            {doctor.specialization && ` - ${doctor.specialization}`}
                            {doctor.experienceYears && ` (${doctor.experienceYears} yrs)`}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  {selectedDoctorProfile && (
                    <Box sx={{ mt: 1 }}>
                      {selectedDoctorProfile.hospital && (
                        <Typography variant="caption" sx={{ color: 'var(--gray-600)', display: 'block' }}>
                          Hospital: {selectedDoctorProfile.hospital}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Grid>

                {/* Date */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Select Date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    disabled={!selectedDoctorId}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--radius-lg)' } }}
                  />
                  {!selectedDoctorId && (
                    <Typography variant="caption" sx={{ color: 'var(--gray-500)', mt: 0.5, display: 'block' }}>
                      Please select a doctor first
                    </Typography>
                  )}
                </Grid>

                {/* Time */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!selectedDate}>
                    <InputLabel>Select Time</InputLabel>
                    <Select
                      value={selectedTime}
                      onChange={handleTimeChange}
                      label="Select Time"
                      sx={{ borderRadius: 'var(--radius-lg)' }}
                    >
                      {timeSlots.length === 0 ? (
                        <MenuItem disabled>No slots available</MenuItem>
                      ) : (
                        timeSlots.map(slot => (
                          <MenuItem key={slot} value={slot}>
                            {slot}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                  {!selectedDate && (
                    <Typography variant="caption" sx={{ color: 'var(--gray-500)', mt: 0.5, display: 'block' }}>
                      Please select a date first
                    </Typography>
                  )}
                </Grid>
              </Grid>

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
