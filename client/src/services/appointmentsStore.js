// Shared appointments store with localStorage persistence
// Single source of truth for both patient bookings and doctor dashboard

const STORAGE_KEY = 'vitalsense_appointments';

// Get all appointments from localStorage
export const getAppointments = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading appointments:', error);
    return [];
  }
};

// Save appointments to localStorage
const saveAppointments = (appointments) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  } catch (error) {
    console.error('Error saving appointments:', error);
  }
};

// Add new appointment
export const addAppointment = (appointment) => {
  const appointments = getAppointments();
  const newAppointment = {
    ...appointment,
    id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    status: appointment.status || 'Pending'
  };
  appointments.push(newAppointment);
  saveAppointments(appointments);
  return newAppointment;
};

// Get appointments by doctor ID and date
export const getAppointmentsByDoctorAndDate = (doctorId, date) => {
  const appointments = getAppointments();
  return appointments.filter(apt => 
    apt.doctorId === doctorId && apt.date === date
  );
};

// Get appointments by doctor ID (all dates)
export const getAppointmentsByDoctor = (doctorId) => {
  const appointments = getAppointments();
  return appointments.filter(apt => apt.doctorId === doctorId);
};

// Get appointments by patient ID
export const getAppointmentsByPatient = (patientId) => {
  const appointments = getAppointments();
  return appointments.filter(apt => apt.patientId === patientId);
};

// Update appointment status
export const updateAppointmentStatus = (appointmentId, status) => {
  const appointments = getAppointments();
  const index = appointments.findIndex(apt => apt.id === appointmentId);
  if (index !== -1) {
    appointments[index].status = status;
    appointments[index].updatedAt = new Date().toISOString();
    saveAppointments(appointments);
    return appointments[index];
  }
  return null
};

// Delete appointment
export const deleteAppointment = (appointmentId) => {
  const appointments = getAppointments();
  const filtered = appointments.filter(apt => apt.id !== appointmentId);
  saveAppointments(filtered);
  return filtered.length < appointments.length;
};
