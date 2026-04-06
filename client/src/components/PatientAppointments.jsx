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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
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
import api from '../utils/api';

const PatientAppointments = () => {
  const { user } = useAuth();
  
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Helper function to format time from 24-hour to 12-hour format
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${minutes} ${period}`;
  };
  
  // Time slots (09:00 to 17:00, 30-minute intervals)
  const timeSlots = [];
  for (let h = 9; h <= 17; h++) {
    timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 17) timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
  }

  // My appointments state - load from API
  const [myAppointments, setMyAppointments] = useState([]);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Sub-tab inside "My Appointments": 0 = Upcoming, 1 = Past
  const [apptSubTab, setApptSubTab] = useState(0);

  /**
   * Returns true if the appointment date+time is strictly in the past.
   * apt.date — ISO string from MongoDB e.g. "2025-07-10T00:00:00.000Z"
   * apt.time — 24-hour string e.g. "14:30" or 12-hour e.g. "2:30 PM"
   * Reconstructs a local datetime to avoid UTC-shift bugs.
   */
  const isAppointmentPast = (apt) => {
    try {
      const d = new Date(apt.date);
      const year  = d.getFullYear();
      const month = d.getMonth();
      const day   = d.getDate();
      let hours = 0, minutes = 0;
      if (apt.time) {
        const timeStr = String(apt.time).trim();
        if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
          [hours, minutes] = timeStr.split(':').map(Number);
        } else {
          const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
          if (match) {
            hours   = parseInt(match[1], 10);
            minutes = parseInt(match[2], 10);
            const period = match[3].toUpperCase();
            if (period === 'AM' && hours === 12) hours = 0;
            if (period === 'PM' && hours !== 12) hours += 12;
          }
        }
      }
      return new Date(year, month, day, hours, minutes, 0, 0) < Date.now();
    } catch {
      return false;
    }
  };

  const { upcomingAppointments, pastAppointments } = useMemo(() => ({
    upcomingAppointments: myAppointments.filter(apt => !isAppointmentPast(apt)),
    pastAppointments:     myAppointments.filter(apt =>  isAppointmentPast(apt)),
  }), [myAppointments]);

  // Form state
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slotAvailability, setSlotAvailability] = useState({}); // { "09:00": 2, ... } active booking counts
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [cancelDialogId, setCancelDialogId] = useState(null);

  useEffect(() => {
    fetchDoctors();
    fetchMyAppointments();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/api/doctor/list');
      setDoctors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      console.log('FETCHING MY APPOINTMENTS...');
      const response = await api.get('/api/patient/appointments');
      console.log('MY APPOINTMENTS RESPONSE:', response.data);
      setMyAppointments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const selectedDoctorProfile = useMemo(() => {
    return doctors.find(d => d._id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  const handleDoctorChange = (e) => {
    setSelectedDoctorId(e.target.value);
    setSelectedDate('');
    setSelectedTime('');
    setSlotAvailability({});
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedTime('');
    setSlotAvailability({});
    if (selectedDoctorId && date) {
      try {
        setAvailabilityLoading(true);
        const res = await api.get(`/api/appointments/availability?doctorId=${selectedDoctorId}&date=${date}`);
        setSlotAvailability(res.data.data || {});
      } catch {
        setSlotAvailability({});
      } finally {
        setAvailabilityLoading(false);
      }
    }
  };

  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctorProfile) return;
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 FRONTEND: Token present:', !!token);
      if (token) {
        console.log('🔑 FRONTEND: Token preview:', token.substring(0, 30) + '...');
      }
      
      console.log('📝 FRONTEND: Booking request:', {
        doctorId: selectedDoctorId,
        date: selectedDate,
        time: selectedTime
      });
      
      const res = await api.post('/api/appointments/book', {
        doctorId: selectedDoctorId,
        date: selectedDate,
        time: selectedTime,
        reason: ''
      });

      console.log('✅ BOOK SUCCESS:', res.data);

      // Verify booking was successful
      if (!res.data || !res.data.success) {
        throw new Error('Booking failed');
      }

      // Refresh appointments list and slot availability
      await fetchMyAppointments();
      if (selectedDoctorId && selectedDate) {
        const res = await api.get(`/api/appointments/availability?doctorId=${selectedDoctorId}&date=${selectedDate}`);
        setSlotAvailability(res.data.data || {});
      }

      // Reset form
      setSelectedDoctorId('');
      setSelectedDate('');
      setSelectedTime('');
      setSlotAvailability({});
      
      setToastMessage('Appointment booked successfully!');
      setShowToast(true);
    } catch (error) {
      console.error('❌ BOOKING ERROR:', error);
      console.error('❌ ERROR STATUS:', error.response?.status);
      console.error('❌ ERROR DATA:', error.response?.data);
      
      let errorMessage = 'Error booking appointment';
      
      if (error.response?.status === 403) {
        errorMessage = error.response?.data?.error || 'Access denied. Please login as a patient.';
        if (error.response?.data?.userRole && error.response?.data?.requiredRoles) {
          errorMessage += ` (Your role: ${error.response.data.userRole}, Required: ${error.response.data.requiredRoles.join(', ')})`;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setToastMessage(errorMessage);
      setShowToast(true);
    }
  };

  const handleCancelAppointment = async () => {
    const idToCancel = cancelDialogId;
    setCancelDialogId(null);
    try {
      await api.patch(`/api/appointments/${idToCancel}/cancel`);
      setToastMessage('Appointment cancelled successfully!');
      setShowToast(true);
      // Refresh list and slot availability so freed slot shows immediately
      await fetchMyAppointments();
      if (selectedDoctorId && selectedDate) {
        const res = await api.get(`/api/appointments/availability?doctorId=${selectedDoctorId}&date=${selectedDate}`);
        setSlotAvailability(res.data.data || {});
      }
    } catch (error) {
      setToastMessage(error.response?.data?.message || 'Error cancelling appointment');
      setShowToast(true);
    }
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
                      {selectedDoctorProfile.hospitalName && (
                        <Typography variant="caption" sx={{ color: 'var(--gray-600)', display: 'block' }}>
                          Hospital: {selectedDoctorProfile.hospitalName}
                        </Typography>
                      )}
                      {selectedDoctorProfile.city && (
                        <Typography variant="caption" sx={{ color: 'var(--gray-600)', display: 'block' }}>
                          City: {selectedDoctorProfile.city}
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
                  <FormControl fullWidth disabled={!selectedDate || availabilityLoading}>
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
                        timeSlots.map(slot => {
                          const booked = slotAvailability[slot] || 0;
                          const max = selectedDoctorProfile?.maxPatientsPerSlot || 1;
                          const isFull = booked >= max;
                          return (
                            <MenuItem key={slot} value={slot} disabled={isFull}>
                              {formatTime(slot)}{isFull ? ' — Full' : booked > 0 ? ` (${max - booked} left)` : ''}
                            </MenuItem>
                          );
                        })
                      )}
                    </Select>
                  </FormControl>
                  {availabilityLoading && (
                    <Typography variant="caption" sx={{ color: 'var(--gray-500)', mt: 0.5, display: 'block' }}>
                      Checking availability...
                    </Typography>
                  )}
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
              {/* Upcoming / Past sub-tabs */}
              <Tabs
                value={apptSubTab}
                onChange={(e, v) => setApptSubTab(v)}
                sx={{
                  mb: 3,
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                  '& .MuiTabs-indicator': { height: 3, borderRadius: 2 }
                }}
              >
                <Tab label={`Upcoming (${upcomingAppointments.length})`} />
                <Tab label={`Past (${pastAppointments.length})`} />
              </Tabs>

              {/* Upcoming list */}
              {apptSubTab === 0 && (
                upcomingAppointments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CalendarToday sx={{ fontSize: 64, color: 'var(--gray-300)', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'var(--gray-500)' }}>
                      No upcoming appointments
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {upcomingAppointments.map((appointment, index) => (
                      <Grid item xs={12} md={6} key={appointment._id}>
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
                                  {appointment.doctorId?.name || 'Doctor'}
                                </Typography>
                              </Box>
                              <Chip
                                label={appointment.status}
                                color={appointment.status === 'CONFIRMED' ? 'success' : appointment.status === 'BOOKED' ? 'info' : 'warning'}
                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                              />
                            </Box>

                            {(appointment.status === 'BOOKED' || appointment.status === 'CONFIRMED') && (
                              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<Cancel />}
                                  onClick={() => setCancelDialogId(appointment._id)}
                                  sx={{ borderRadius: 'var(--radius-lg)', textTransform: 'none', fontWeight: 600 }}
                                >
                                  Cancel Appointment
                                </Button>
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <LocalHospital sx={{ color: '#be185d', fontSize: 20 }} />
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Hospital</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{appointment.doctorId?.doctorProfile?.hospitalName || 'N/A'}</Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--secondary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Person sx={{ color: 'var(--secondary-600)', fontSize: 20 }} />
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Specialization</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{appointment.doctorId?.doctorProfile?.specialization || 'N/A'}</Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CalendarToday sx={{ color: 'var(--primary-600)', fontSize: 20 }} />
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Date</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{formatDate(appointment.date)}</Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--accent-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <AccessTime sx={{ color: 'var(--accent-600)', fontSize: 20 }} />
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Time</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{formatTime(appointment.time)}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )
              )}

              {/* Past list */}
              {apptSubTab === 1 && (
                pastAppointments.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <CalendarToday sx={{ fontSize: 64, color: 'var(--gray-300)', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'var(--gray-500)' }}>
                      No past appointments
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {pastAppointments.map((appointment, index) => (
                      <Grid item xs={12} md={6} key={appointment._id}>
                        <Card
                          sx={{
                            border: '1px solid var(--gray-200)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-sm)',
                            opacity: 0.85,
                            animationDelay: `${index * 0.1}s`
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person sx={{ color: 'var(--gray-400)', fontSize: 28 }} />
                                <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--gray-600)' }}>
                                  {appointment.doctorId?.name || 'Doctor'}
                                </Typography>
                              </Box>
                              <Chip
                                label={appointment.status}
                                color={appointment.status === 'COMPLETED' ? 'default' : appointment.status === 'CANCELLED' ? 'error' : 'default'}
                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <LocalHospital sx={{ color: '#be185d', fontSize: 20 }} />
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Hospital</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{appointment.doctorId?.doctorProfile?.hospitalName || 'N/A'}</Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--secondary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Person sx={{ color: 'var(--secondary-600)', fontSize: 20 }} />
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Specialization</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{appointment.doctorId?.doctorProfile?.specialization || 'N/A'}</Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CalendarToday sx={{ color: 'var(--primary-600)', fontSize: 20 }} />
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Date</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{formatDate(appointment.date)}</Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: 'var(--accent-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <AccessTime sx={{ color: 'var(--accent-600)', fontSize: 20 }} />
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>Time</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>{formatTime(appointment.time)}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )
              )}
            </CardContent>
          )}
        </Card>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={!!cancelDialogId} onClose={() => setCancelDialogId(null)}>
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to cancel this appointment?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogId(null)}>Keep It</Button>
            <Button onClick={handleCancelAppointment} color="error" variant="contained"
              sx={{ borderRadius: 'var(--radius-lg)', textTransform: 'none', fontWeight: 600 }}
            >
              Yes, Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Toast */}
        <Snackbar
          open={showToast}
          autoHideDuration={3000}
          onClose={() => setShowToast(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={toastMessage.includes('Error') ? 'error' : 'success'} sx={{ borderRadius: 'var(--radius-lg)', fontWeight: 600 }}>
            {toastMessage || '✅ Appointment booked successfully!'}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
};

export default PatientAppointments;
