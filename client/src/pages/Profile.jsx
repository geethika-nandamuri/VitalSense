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
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/patient/profile');
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
    if (profile?.patientId) {
      navigator.clipboard.writeText(profile.patientId);
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
            Patient Profile
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
            Patient ID
          </Typography>
          <TextField
            fullWidth
            value={profile?.patientId || ''}
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
            Share this ID with your doctor to grant access to your reports
          </Typography>
        </Box>

        {copySuccess && (
          <Alert severity="success" sx={{ borderRadius: '8px' }}>
            Patient ID copied to clipboard!
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default Profile;