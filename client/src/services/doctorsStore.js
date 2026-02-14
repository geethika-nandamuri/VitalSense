// Doctors registry service - Single source of truth for registered doctors
// Backend-ready: Can be replaced with API calls

const STORAGE_KEY = 'vitalsense_doctors';

// Get all doctors from localStorage
export const getDoctors = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading doctors:', error);
    return [];
  }
};

// Save doctors to localStorage
const saveDoctors = (doctors) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors));
  } catch (error) {
    console.error('Error saving doctors:', error);
  }
};

// Add or update doctor by doctorId
export const upsertDoctor = (doctorObj) => {
  const doctors = getDoctors();
  const index = doctors.findIndex(d => d.doctorId === doctorObj.doctorId);
  
  const doctor = {
    ...doctorObj,
    updatedAt: new Date().toISOString(),
    createdAt: doctorObj.createdAt || new Date().toISOString(),
    isActive: doctorObj.isActive !== undefined ? doctorObj.isActive : true,
    slotDurationMin: doctorObj.slotDurationMin || 30,
    maxPatientsPerSlot: doctorObj.maxPatientsPerSlot || 5
  };
  
  if (index !== -1) {
    doctors[index] = doctor;
  } else {
    doctors.push(doctor);
  }
  
  saveDoctors(doctors);
  return doctor;
};

// Get doctor by ID
export const getDoctorById = (doctorId) => {
  const doctors = getDoctors();
  return doctors.find(d => d.doctorId === doctorId);
};

// Get doctors by city
export const getDoctorsByCity = (city) => {
  const doctors = getDoctors();
  return doctors.filter(d => d.city === city && d.isActive);
};

// Get unique cities
export const getCities = () => {
  const doctors = getDoctors();
  const cities = [...new Set(doctors.filter(d => d.isActive).map(d => d.city))];
  return cities.sort();
};

// Get unique hospitals in a city
export const getHospitals = (city) => {
  const doctors = getDoctors();
  const hospitals = [...new Set(
    doctors.filter(d => d.isActive && d.city === city).map(d => d.hospitalName)
  )];
  return hospitals.sort();
};

// Get unique specializations in a city and hospital
export const getSpecializations = (city, hospital) => {
  const doctors = getDoctors();
  const specializations = [...new Set(
    doctors.filter(d => 
      d.isActive && 
      d.city === city && 
      d.hospitalName === hospital
    ).map(d => d.specialization)
  )];
  return specializations.sort();
};

// Get doctors by filters
export const getDoctorsByFilters = (city, hospital, specialization) => {
  const doctors = getDoctors();
  return doctors.filter(d => 
    d.isActive &&
    d.city === city &&
    d.hospitalName === hospital &&
    d.specialization === specialization
  );
};
