import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { ContentCopy, Person } from '@mui/icons-material';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const endpoint = user.role === 'DOCTOR' ? '/api/doctor/profile' : '/api/patient/profile';
      const response = await api.get(endpoint);
      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPatientId = () => {
    const id = profile?.patientId || profile?.doctorId;
    if (id) {
      navigator.clipboard.writeText(id);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: '12px',
          border: '1px solid #f0f0f0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Person sx={{ fontSize: 40, color: '#667eea' }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {user?.role === 'DOCTOR' ? 'Doctor Profile' : 'Patient Profile'}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Name
          </Typography>
          <TextField
            fullWidth
            value={profile?.name || ''}
            InputProps={{
              readOnly: true,
            }}
            sx={{
              '& .MuiInputBase-input': {
                fontWeight: 600,
                fontSize: '1.1rem',
              },
            }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Email
          </Typography>
          <TextField
            fullWidth
            value={profile?.email || ''}
            InputProps={{
              readOnly: true,
            }}
            sx={{
              '& .MuiInputBase-input': {
                fontWeight: 600,
              },
            }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {user?.role === 'DOCTOR' ? 'Doctor ID' : 'Patient ID'}
          </Typography>
          <TextField
            fullWidth
            value={profile?.patientId || profile?.doctorId || ''}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton
                  onClick={handleCopyPatientId}
                  sx={{
                    '&:hover': { backgroundColor: '#667eea15' },
                  }}
                >
                  <ContentCopy sx={{ color: '#667eea' }} />
                </IconButton>
              ),
            }}
            sx={{
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontWeight: 600,
                fontSize: '1.1rem',
                color: '#667eea',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {user?.role === 'DOCTOR' ? 'Your unique doctor identifier' : 'Share this ID with your doctor to grant access to your reports'}
          </Typography>
        </Box>

        {user?.role === 'DOCTOR' && profile?.specialization && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Phone
              </Typography>
              <TextField
                fullWidth
                value={profile?.phone || ''}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontWeight: 600,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                City
              </Typography>
              <TextField
                fullWidth
                value={profile?.city || ''}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontWeight: 600,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Hospital/Clinic
              </Typography>
              <TextField
                fullWidth
                value={profile?.hospitalName || ''}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontWeight: 600,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Specialization
              </Typography>
              <TextField
                fullWidth
                value={profile?.specialization || ''}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontWeight: 600,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Experience
              </Typography>
              <TextField
                fullWidth
                value={profile?.experienceYears ? `${profile.experienceYears} years` : ''}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontWeight: 600,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Consultation Fee
              </Typography>
              <TextField
                fullWidth
                value={profile?.consultationFee ? `₹${profile.consultationFee}` : ''}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontWeight: 600,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Consultation Hours
              </Typography>
              <TextField
                fullWidth
                value={profile?.timeWindow ? `${profile.timeWindow.start} - ${profile.timeWindow.end}` : ''}
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontWeight: 600,
                  },
                }}
              />
            </Box>
          </>
        )}

        {copySuccess && (
          <Alert severity="success" sx={{ borderRadius: '8px' }}>
            {user?.role === 'DOCTOR' ? 'Doctor ID' : 'Patient ID'} copied to clipboard!
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default Profile;