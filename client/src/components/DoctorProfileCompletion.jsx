import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Person, Phone, LocationCity, LocalHospital, Biotech, AccessTime } from '@mui/icons-material';

const DoctorProfileCompletion = ({ open, doctorData, onComplete }) => {
  const [formData, setFormData] = useState({
    name: doctorData?.name || '',
    phone: doctorData?.phoneNumber || '',
    email: doctorData?.email || '',
    city: '',
    hospitalName: '',
    specialization: '',
    experienceYears: '',
    consultationFee: '',
    maxPatientsPerSlot: 5,
    timeWindowStart: '09:00',
    timeWindowEnd: '17:00'
  });
  const [errors, setErrors] = useState({});

  const specializationOptions = [
    { value: 'Cardiology', hint: 'Heart pain, BP, Cholesterol, ECG' },
    { value: 'General Medicine', hint: 'Fever, Cold, Body pains, General checkup' },
    { value: 'Endocrinology', hint: 'Diabetes, Thyroid, Hormones' },
    { value: 'Dermatology', hint: 'Skin allergy, Acne, Hair fall' },
    { value: 'Orthopedics', hint: 'Bone, Joint, Muscle problems' },
    { value: 'Pediatrics', hint: 'Child health, Vaccinations' },
    { value: 'Gynecology', hint: 'Women health, Pregnancy' },
    { value: 'Neurology', hint: 'Brain, Nerve, Headache' }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.hospitalName.trim()) newErrors.hospitalName = 'Hospital name is required';
    if (!formData.specialization) newErrors.specialization = 'Specialization is required';
    if (!formData.maxPatientsPerSlot) newErrors.maxPatientsPerSlot = 'Slot capacity is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const doctorProfile = {
      doctorId: doctorData._id,
      name: formData.name.trim(),
      phone: formData.phone,
      email: formData.email,
      city: formData.city.trim(),
      hospitalName: formData.hospitalName.trim(),
      specialization: formData.specialization,
      experienceYears: parseInt(formData.experienceYears) || 0,
      consultationFee: parseInt(formData.consultationFee) || 0,
      maxPatientsPerSlot: parseInt(formData.maxPatientsPerSlot),
      slotDurationMin: 30,
      timeWindow: {
        start: formData.timeWindowStart,
        end: formData.timeWindowEnd
      },
      isActive: true
    };
    
    onComplete(doctorProfile);
  };

  const isFormValid = formData.name && formData.phone && formData.city && 
                      formData.hospitalName && formData.specialization && 
                      formData.maxPatientsPerSlot;

  return (
    <Dialog open={open} maxWidth="md" fullWidth disableEscapeKeyDown>
      <DialogTitle>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Complete Your Doctor Profile
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--gray-600)', mt: 1 }}>
          Please provide your details to start accepting patient appointments
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3, mt: 2 }}>
          This information will be visible to patients when booking appointments
        </Alert>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{
                startAdornment: <Person sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              name="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              inputProps={{ maxLength: 10 }}
              InputProps={{
                startAdornment: <Phone sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              name="city"
              label="City"
              value={formData.city}
              onChange={handleChange}
              error={!!errors.city}
              helperText={errors.city}
              InputProps={{
                startAdornment: <LocationCity sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              name="hospitalName"
              label="Hospital/Clinic Name"
              value={formData.hospitalName}
              onChange={handleChange}
              error={!!errors.hospitalName}
              helperText={errors.hospitalName}
              InputProps={{
                startAdornment: <LocalHospital sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              select
              name="specialization"
              label="Specialization"
              value={formData.specialization}
              onChange={handleChange}
              error={!!errors.specialization}
              helperText={errors.specialization}
              InputProps={{
                startAdornment: <Biotech sx={{ mr: 1, color: 'action.active' }} />
              }}
            >
              {specializationOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  <Box>
                    <Typography variant="body1">{option.value}</Typography>
                    <Typography variant="caption" sx={{ color: 'var(--gray-500)' }}>
                      {option.hint}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              name="experienceYears"
              label="Experience (Years)"
              type="number"
              value={formData.experienceYears}
              onChange={handleChange}
              inputProps={{ min: 0 }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              name="consultationFee"
              label="Consultation Fee (₹)"
              type="number"
              value={formData.consultationFee}
              onChange={handleChange}
              inputProps={{ min: 0 }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              required
              select
              name="maxPatientsPerSlot"
              label="Patients Per Slot"
              value={formData.maxPatientsPerSlot}
              onChange={handleChange}
              error={!!errors.maxPatientsPerSlot}
              helperText={errors.maxPatientsPerSlot || "30-minute slots"}
            >
              <MenuItem value={4}>4 patients</MenuItem>
              <MenuItem value={5}>5 patients</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="timeWindowStart"
              label="Consultation Start Time"
              type="time"
              value={formData.timeWindowStart}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <AccessTime sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="timeWindowEnd"
              label="Consultation End Time"
              type="time"
              value={formData.timeWindowEnd}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <AccessTime sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isFormValid}
          sx={{
            background: isFormValid ? 'var(--gradient-primary)' : 'var(--gray-300)',
            px: 4,
            py: 1.5,
            fontWeight: 600
          }}
        >
          Save Profile & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DoctorProfileCompletion;
