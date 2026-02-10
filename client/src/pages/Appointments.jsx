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
import axios from 'axios';

const Appointments = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState({ upcoming: [], past: [] });
  const [filters, setFilters] = useState({
    city: '',
    hospitalId: '',
    specialization: ''
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
    fetchHospitals();
    fetchMyAppointments();
  }, []);

  useEffect(() => {
    if (activeTab === 0) {
      fetchDoctors();
    }
  }, [filters, activeTab]);

  const fetchHospitals = async () => {
    try {
      const response = await axios.get('/api/hospitals');
      setHospitals(response.data.data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.city) params.append('city', filters.city);
      if (filters.hospitalId) params.append('hospitalId', filters.hospitalId);
      if (filters.specialization) params.append('specialization', filters.specialization);
      
      const response = await axios.get(`/api/doctors?${params}`);
      setDoctors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments/my', {
        headers: { 'x-patient-id': 'demo-patient-123' } // Demo header
      });
      setMyAppointments(response.data.data);
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
      
      await axios.post('/api/appointments', {
        doctorId: doctor._id,
        hospitalId: doctor.hospitalId._id,
        date,
        timeSlot,
        reason
      }, {
        headers: { 'x-patient-id': 'demo-patient-123' } // Demo header
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
      await axios.patch(`/api/appointments/${appointmentId}/cancel`, {}, {
        headers: { 'x-patient-id': 'demo-patient-123' } // Demo header
      });
      
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
      case 'Confirmed': return 'success';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      case 'Completed': return 'info';
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
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Hospital</InputLabel>
                    <Select
                      value={filters.hospitalId}
                      onChange={(e) => setFilters({ ...filters, hospitalId: e.target.value })}
                      label="Hospital"
                    >
                      <MenuItem value="">All Hospitals</MenuItem>
                      {hospitals.map((hospital) => (
                        <MenuItem key={hospital._id} value={hospital._id}>
                          {hospital.name} - {hospital.city}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Specialization"
                    value={filters.specialization}
                    onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                  />
                </Grid>
              </Grid>

              {/* Doctor Cards */}
              <Grid container spacing={3}>
                {loading ? (
                  <Grid item xs={12}>
                    <Typography>Loading doctors...</Typography>
                  </Grid>
                ) : doctors.length === 0 ? (
                  <Grid item xs={12}>
                    <Typography>No doctors found. Try adjusting your filters.</Typography>
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
                            {doctor.hospitalId.name}, {doctor.hospitalId.city}
                          </Typography>
                          
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Experience:</strong> {doctor.experienceYears} years
                          </Typography>
                          
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            <AttachMoney sx={{ fontSize: 16, mr: 0.5 }} />
                            ${doctor.fee}
                          </Typography>
                          
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
                              <Typography variant="h6">{appointment.doctorId.name}</Typography>
                              <Typography variant="body2">
                                {appointment.doctorId.specialization} • {appointment.hospitalId.name}
                              </Typography>
                              <Typography variant="body2">
                                <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                                {new Date(appointment.date).toLocaleDateString()} at {appointment.timeSlot}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              <Chip 
                                label={appointment.status} 
                                color={getStatusColor(appointment.status)}
                                size="small"
                              />
                              {appointment.status !== 'Cancelled' && (
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
                              <Typography variant="h6">{appointment.doctorId.name}</Typography>
                              <Typography variant="body2">
                                {appointment.doctorId.specialization} • {appointment.hospitalId.name}
                              </Typography>
                              <Typography variant="body2">
                                <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                                {new Date(appointment.date).toLocaleDateString()} at {appointment.timeSlot}
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
                  {bookingDialog.doctor.specialization} • {bookingDialog.doctor.hospitalId.name}
                </Typography>
                <Typography variant="body2">Fee: ${bookingDialog.doctor.fee}</Typography>
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
                {bookingDialog.doctor?.availableSlots.map((slot) => (
                  <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                ))}
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