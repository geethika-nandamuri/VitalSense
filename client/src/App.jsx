import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './pages/Dashboard.jsx';
import UploadReport from './pages/UploadReport.jsx';
import Biomarkers from './pages/Biomarkers.jsx';
import Trends from './pages/Trends.jsx';
import Recommendations from './pages/Recommendations.jsx';
import Summary from './pages/Summary.jsx';
import Profile from './pages/Profile.jsx';
import Navbar from './components/Navbar.jsx';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<UploadReport />} />
            <Route path="/biomarkers" element={<Biomarkers />} />
            <Route path="/trends" element={<Trends />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/summary" element={<Summary />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
