import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  LocalHospital,
  Person,
  Schedule,
  AttachMoney,
  CalendarToday,
  AccessTime
} from '@mui/icons-material';
import api from '../utils/api';

const Appointments = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [cities, setCities] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState({ upcoming: [], past: [] });
  const [filters, setFilters] = useState({
    city: '',
    hospitalName: '',
    specialization: '',
    doctorId: ''
  });
  const [bookingDialog, setBookingDialog] = useState({
    open: false,
    doctor: null,
    date: '',
    timeSlot: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCities();
    fetchMyAppointments();
  }, []);

  useEffect(() => {
    if (filters.city) {
      fetchHospitals();
      setFilters(prev => ({ ...prev, hospitalName: '', specialization: '', doctorId: '' }));
    }
  }, [filters.city]);

  useEffect(() => {
    if (filters.city && filters.hospitalName) {
      fetchSpecializations();
      setFilters(prev => ({ ...prev, specialization: '', doctorId: '' }));
    }
  }, [filters.hospitalName]);

  useEffect(() => {
    if (filters.city && filters.hospitalName && filters.specialization) {
      fetchDoctors();
    }
  }, [filters.specialization]);

  const fetchCities = async () => {
    try {
      const response = await api.get('/api/doctor/cities');
      setCities(response.data.data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.get(`/api/doctor/hospitals?city=${filters.city}`);
      setHospitals(response.data.data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const response = await api.get(`/api/doctor/specializations?city=${filters.city}&hospitalName=${filters.hospitalName}`);
      setSpecializations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.hospitalName) params.append('hospitalName', filters.hospitalName);
      if (filters.specialization) params.append('specialization', filters.specialization);
      
      const response = await api.get(`/api/doctor/list?${params}`);
      setDoctors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const response = await api.get('/api/patient/appointments');
      const appointments = response.data.data || [];
      
      // Separate upcoming and past
      const now = new Date();
      const upcoming = appointments.filter(apt => new Date(apt.date) >= now);
      const past = appointments.filter(apt => new Date(apt.date) < now);
      
      setMyAppointments({ upcoming, past });
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleBookAppointment = (doctor) => {
    setBookingDialog({
      open: true,
      doctor,
      date: '',
      timeSlot: '',
      reason: ''
    });
  };

  const confirmBooking = async () => {
    try {
      const { doctor, date, timeSlot, reason } = bookingDialog;
      
      await api.post('/api/appointments/book', {
        doctorId: doctor._id,
        date,
        time: timeSlot,
        reason
      });

      setMessage({ type: 'success', text: 'Appointment booked successfully!' });
      setBookingDialog({ open: false, doctor: null, date: '', timeSlot: '', reason: '' });
      fetchMyAppointments();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error booking appointment' 
      });
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      await api.patch(`/api/appointments/${appointmentId}/cancel`);
      
      setMessage({ type: 'success', text: 'Appointment cancelled successfully!' });
      fetchMyAppointments();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error cancelling appointment' 
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'BOOKED': return 'info';
      case 'CANCELLED': return 'error';
      case 'COMPLETED': return 'default';
      default: return 'default';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-background)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box className="animate-on-load" sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            className="text-gradient"
            sx={{ fontWeight: 800, mb: 2 }}
          >
            Appointments
          </Typography>
          <Typography variant="h6" sx={{ color: 'var(--gray-500)', fontWeight: 400 }}>
            Book appointments with healthcare professionals
          </Typography>
        </Box>

        {message.text && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3 }}
            onClose={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </Alert>
        )}

        <div className="premium-card">
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="Book Appointment" />
            <Tab label="My Appointments" />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              {/* Filters */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>City</InputLabel>
                    <Select
                      value={filters.city}
                      onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                      label="City"
                    >
                      <MenuItem value="">Select City</MenuItem>
                      {cities.map((city) => (
                        <MenuItem key={city} value={city}>
                          {city}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth disabled={!filters.city}>
                    <InputLabel>Hospital</InputLabel>
                    <Select
                      value={filters.hospitalName}
                      onChange={(e) => setFilters({ ...filters, hospitalName: e.target.value })}
                      label="Hospital"
                    >
                      <MenuItem value="">Select Hospital</MenuItem>
                      {hospitals.map((hospital) => (
                        <MenuItem key={hospital} value={hospital}>
                          {hospital}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth disabled={!filters.hospitalName}>
                    <InputLabel>Specialization</InputLabel>
                    <Select
                      value={filters.specialization}
                      onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                      label="Specialization"
                    >
                      <MenuItem value="">Select Specialization</MenuItem>
                      {specializations.map((spec) => (
                        <MenuItem key={spec} value={spec}>
                          {spec}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth disabled={!filters.specialization || doctors.length === 0}>
                    <InputLabel>Doctor</InputLabel>
                    <Select
                      value={filters.doctorId}
                      onChange={(e) => {
                        const selectedDoctor = doctors.find(d => d._id === e.target.value);
                        setFilters({ ...filters, doctorId: e.target.value });
                        if (selectedDoctor) handleBookAppointment(selectedDoctor);
                      }}
                      label="Doctor"
                    >
                      <MenuItem value="">Select Doctor</MenuItem>
                      {doctors.map((doctor) => (
                        <MenuItem key={doctor._id} value={doctor._id}>
                          {doctor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Doctor Cards */}
              <Grid container spacing={3}>
                {loading ? (
                  <Grid item xs={12}>
                    <Typography>Loading doctors...</Typography>
                  </Grid>
                ) : !filters.specialization ? (
                  <Grid item xs={12}>
                    <Alert severity="info">Please select City, Hospital, and Specialization to view available doctors.</Alert>
                  </Grid>
                ) : doctors.length === 0 ? (
                  <Grid item xs={12}>
                    <Alert severity="warning">No registered doctors found for the selected filters.</Alert>
                  </Grid>
                ) : (
                  doctors.map((doctor) => (
                    <Grid item xs={12} md={6} lg={4} key={doctor._id}>
                      <Card className="hover-lift">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Person sx={{ mr: 1, color: 'var(--primary-600)' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {doctor.name}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Specialization:</strong> {doctor.specialization}
                          </Typography>
                          
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <LocalHospital sx={{ fontSize: 16, mr: 0.5 }} />
                            {doctor.hospitalName}, {doctor.city}
                          </Typography>
                          
                          {doctor.experienceYears > 0 && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Experience:</strong> {doctor.experienceYears} years
                            </Typography>
                          )}
                          
                          {doctor.consultationFee > 0 && (
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              <AttachMoney sx={{ fontSize: 16, mr: 0.5 }} />
                              ₹{doctor.consultationFee}
                            </Typography>
                          )}
                          
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() => handleBookAppointment(doctor)}
                            className="btn-primary"
                          >
                            Book Appointment
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Upcoming Appointments
              </Typography>
              
              {myAppointments.upcoming.length === 0 ? (
                <Typography sx={{ mb: 4 }}>No upcoming appointments.</Typography>
              ) : (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {myAppointments.upcoming.map((appointment) => (
                    <Grid item xs={12} key={appointment._id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="h6">{appointment.doctorId?.name || 'Doctor'}</Typography>
                              <Typography variant="body2">
                                {appointment.doctorId?.doctorProfile?.specialization || 'Specialist'} • {appointment.doctorId?.doctorProfile?.hospitalName || 'Hospital'}
                              </Typography>
                              <Typography variant="body2">
                                <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                                {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip 
                                label={appointment.status} 
                                color={getStatusColor(appointment.status)}
                                size="small"
                              />
                              {appointment.status !== 'CANCELLED' && (
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => cancelAppointment(appointment._id)}
                                >
                                  Cancel
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                Past Appointments
              </Typography>
              
              {myAppointments.past.length === 0 ? (
                <Typography>No past appointments.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {myAppointments.past.map((appointment) => (
                    <Grid item xs={12} key={appointment._id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="h6">{appointment.doctorId?.name || 'Doctor'}</Typography>
                              <Typography variant="body2">
                                {appointment.doctorId?.doctorProfile?.specialization || 'Specialist'} • {appointment.doctorId?.doctorProfile?.hospitalName || 'Hospital'}
                              </Typography>
                              <Typography variant="body2">
                                <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                                {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                              </Typography>
                            </Box>
                            <Chip 
                              label={appointment.status} 
                              color={getStatusColor(appointment.status)}
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </div>

        {/* Booking Dialog */}
        <Dialog 
          open={bookingDialog.open} 
          onClose={() => setBookingDialog({ ...bookingDialog, open: false })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogContent>
            {bookingDialog.doctor && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6">{bookingDialog.doctor.name}</Typography>
                <Typography variant="body2">
                  {bookingDialog.doctor.specialization} • {bookingDialog.doctor.hospitalName}
                </Typography>
                {bookingDialog.doctor.consultationFee > 0 && (
                  <Typography variant="body2">Fee: ₹{bookingDialog.doctor.consultationFee}</Typography>
                )}
              </Box>
            )}
            
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={bookingDialog.date}
              onChange={(e) => setBookingDialog({ ...bookingDialog, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Time Slot</InputLabel>
              <Select
                value={bookingDialog.timeSlot}
                onChange={(e) => setBookingDialog({ ...bookingDialog, timeSlot: e.target.value })}
                label="Time Slot"
              >
                {bookingDialog.doctor?.timeWindow && (
                  <MenuItem value={`${bookingDialog.doctor.timeWindow.start} - ${bookingDialog.doctor.timeWindow.end}`}>
                    {bookingDialog.doctor.timeWindow.start} - {bookingDialog.doctor.timeWindow.end}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason (Optional)"
              value={bookingDialog.reason}
              onChange={(e) => setBookingDialog({ ...bookingDialog, reason: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBookingDialog({ ...bookingDialog, open: false })}>
              Cancel
            </Button>
            <Button 
              onClick={confirmBooking}
              variant="contained"
              disabled={!bookingDialog.date || !bookingDialog.timeSlot}
            >
              Book Appointment
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default Appointments;