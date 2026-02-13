import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Box, Typography, Paper, IconButton, Snackbar, Alert } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import Dashboard from './Dashboard';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyPatientId = () => {
    if (user?.patientId) {
      navigator.clipboard.writeText(user.patientId);
      setCopySuccess(true);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '12px',
          border: '1px solid #f0f0f0',
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Welcome, {user?.name}!
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" color="text.secondary">
                Patient ID:
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  color: '#667eea',
                  fontSize: '1.1rem',
                }}
              >
                {user?.patientId}
              </Typography>
              <IconButton
                size="small"
                onClick={handleCopyPatientId}
                sx={{
                  ml: 1,
                  '&:hover': { backgroundColor: '#667eea15' },
                }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Dashboard />

      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Patient ID copied to clipboard!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PatientDashboard;
