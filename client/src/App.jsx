import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAppointments from './pages/DoctorAppointments';
import UploadReport from './pages/UploadReport';
import Reports from './pages/Reports';
import PatientAppointments from './components/PatientAppointments';
import Biomarkers from './pages/Biomarkers';
import Trends from './pages/Trends';
import Recommendations from './pages/Recommendations';
import Summary from './pages/Summary';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8fa4f3',
      dark: '#4c63d2',
    },
    secondary: {
      main: '#764ba2',
      light: '#9575cd',
      dark: '#512da8',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3748',
      secondary: '#718096',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

const AppContent = () => {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <PatientDashboard />
            </RoleRoute>
          }
        />
        
        {/* Doctor Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <RoleRoute allowedRoles={['DOCTOR']}>
              <DoctorDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <RoleRoute allowedRoles={['DOCTOR']}>
              <DoctorAppointments />
            </RoleRoute>
          }
        />
        
        {/* Legacy/Shared Routes - Patient Only */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Navigate to={user.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/upload"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <UploadReport />
            </RoleRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <Reports />
            </RoleRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <PatientAppointments />
            </RoleRoute>
          }
        />
        <Route
          path="/biomarkers"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <Biomarkers />
            </RoleRoute>
          }
        />
        <Route
          path="/trends"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <Trends />
            </RoleRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <RoleRoute allowedRoles={['PATIENT']}>
              <Recommendations />
            </RoleRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={user.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
