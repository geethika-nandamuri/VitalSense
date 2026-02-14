import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Chip,
  Grid,
  Button,
  Alert
} from '@mui/material';
import {
  CalendarToday,
  Person,
  Phone,
  LocationCity,
  LocalHospital,
  AccessTime,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getAppointmentsByDoctorAndDate, updateAppointmentStatus } from '../services/appointmentsStore';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user && user.role === 'DOCTOR') {
      fetchAppointments();
    }
  }, [selectedDate, user]);

  const fetchAppointments = () => {
    if (!user || !user._id) return;
    const doctorId = user._id;
    const apts = getAppointmentsByDoctorAndDate(doctorId, selectedDate);
    setAppointments(apts);
  };

  const handleConfirm = (appointmentId) => {
    updateAppointmentStatus(appointmentId, 'Confirmed');
    setMessage({ type: 'success', text: 'Appointment confirmed successfully!' });
    fetchAppointments();
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleCancel = (appointmentId) => {
    updateAppointmentStatus(appointmentId, 'Cancelled');
    setMessage({ type: 'info', text: 'Appointment cancelled.' });
    fetchAppointments();
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'success';
      case 'Pending': return 'warning';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-background)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box className="animate-on-load" sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            className="text-gradient"
            sx={{ fontWeight: 800, mb: 2 }}
          >
            My Appointments
          </Typography>
          <Typography variant="h6" sx={{ color: 'var(--gray-500)', fontWeight: 400 }}>
            Manage your patient appointments
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

        {/* Date Selector */}
        <Card className="premium-card" sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarToday sx={{ color: 'var(--primary-600)', fontSize: 28 }} />
              <TextField
                type="date"
                label="Select Date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, maxWidth: 300 }}
              />
              <Typography variant="body1" sx={{ color: 'var(--gray-600)', fontWeight: 500 }}>
                {formatDate(selectedDate)}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <Card className="premium-card">
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <CalendarToday sx={{ fontSize: 64, color: 'var(--gray-300)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'var(--gray-500)' }}>
                No appointments for this date
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--gray-400)', mt: 1 }}>
                Select a different date to view appointments
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'var(--gray-800)' }}>
              Appointments ({appointments.length})
            </Typography>
            <Grid container spacing={3}>
              {appointments.map((appointment, index) => (
                <Grid item xs={12} md={6} key={appointment.id}>
                  <Card 
                    className="hover-lift premium-card"
                    sx={{ 
                      animationDelay: `${index * 0.1}s`,
                      border: '1px solid var(--gray-200)'
                    }}
                  >
                    <CardContent>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Person sx={{ color: 'var(--primary-600)', fontSize: 28 }} />
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                              {appointment.patientName}
                            </Typography>
                            {appointment.patientAge && appointment.patientGender && (
                              <Typography variant="caption" sx={{ color: 'var(--gray-500)' }}>
                                {appointment.patientAge} yrs • {appointment.patientGender}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Chip 
                          label={appointment.status} 
                          color={getStatusColor(appointment.status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      {/* Details */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                        {/* Time */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTime sx={{ color: 'var(--gray-500)', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'var(--gray-700)' }}>
                            {appointment.time}
                          </Typography>
                        </Box>

                        {/* Phone */}
                        {appointment.patientPhone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Phone sx={{ color: 'var(--gray-500)', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: 'var(--gray-600)' }}>
                              {appointment.patientPhone}
                            </Typography>
                          </Box>
                        )}

                        {/* City */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationCity sx={{ color: 'var(--gray-500)', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'var(--gray-600)' }}>
                            {appointment.city}
                          </Typography>
                        </Box>

                        {/* Hospital */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalHospital sx={{ color: 'var(--gray-500)', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'var(--gray-600)' }}>
                            {appointment.hospital}
                          </Typography>
                        </Box>

                        {/* Specialization */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'var(--gray-500)', fontWeight: 600 }}>
                            SPECIALIZATION:
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'var(--gray-700)', fontWeight: 500 }}>
                            {appointment.specialization}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Actions */}
                      {appointment.status === 'Pending' && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<CheckCircle />}
                            onClick={() => handleConfirm(appointment.id)}
                            sx={{
                              flex: 1,
                              background: 'var(--gradient-secondary)',
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => handleCancel(appointment.id)}
                            sx={{
                              flex: 1,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </div>
  );
};

export default DoctorAppointments;
