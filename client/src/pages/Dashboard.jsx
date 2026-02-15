import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button
} from '@mui/material';
import {
  Assessment,
  Biotech,
  TrendingUp,
  Upload,
  Warning,
  Timeline,
  Analytics
} from '@mui/icons-material';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    totalBiomarkers: 0,
    abnormalCount: 0,
    latestReports: []
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [reportsRes, biomarkersRes, doctorsRes] = await Promise.all([
        api.get('/api/reports'),
        api.get('/api/biomarkers/latest'),
        api.get('/api/patient/doctors')
      ]);

      const reports = reportsRes.data.reports || [];
      const biomarkers = biomarkersRes.data.biomarkers || [];
      const abnormal = biomarkers.filter(b => b.latestStatus !== 'normal').length;

      setStats({
        totalReports: reports.length,
        totalBiomarkers: biomarkers.length,
        abnormalCount: abnormal,
        latestReports: reports.slice(0, 5)
      });
      
      setDoctors(doctorsRes.data.doctors || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-background)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Hero Section with Animation */}
        <Box className="animate-on-load" sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h2"
            className="text-gradient"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' }
            }}
          >
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Guest'}!
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              color: 'var(--gray-500)', 
              fontWeight: 400
            }}
          >
            Your comprehensive health analytics dashboard
          </Typography>
        </Box>

        {/* Health Disclaimer */}
        <div className="ai-insight animate-on-load animate-delay-1" style={{ marginBottom: '2rem' }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            <strong>Wellness Disclaimer:</strong> This tool provides wellness insights and does not replace professional medical advice.
          </Typography>
        </div>

        {/* Stats Grid with Staggered Animation */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <div className="premium-card animate-on-load animate-delay-2 hover-lift">
              <Box sx={{ textAlign: 'center' }}>
                {loading ? (
                  <div className="pulse">
                    <div style={{ width: 80, height: 80, background: 'var(--gray-200)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                    <div style={{ width: '60%', height: 24, background: 'var(--gray-200)', borderRadius: '4px', margin: '0 auto 0.5rem' }}></div>
                    <div style={{ width: '40%', height: 16, background: 'var(--gray-200)', borderRadius: '4px', margin: '0 auto' }}></div>
                  </div>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <Assessment sx={{ fontSize: 36, color: 'white' }} />
                    </Box>
                    <div className="metric-number">{stats.totalReports}</div>
                    <div className="metric-label">Total Reports</div>
                  </>
                )}
              </Box>
            </div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <div className="premium-card animate-on-load animate-delay-3 hover-lift">
              <Box sx={{ textAlign: 'center' }}>
                {loading ? (
                  <div className="pulse">
                    <div style={{ width: 80, height: 80, background: 'var(--gray-200)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                    <div style={{ width: '60%', height: 24, background: 'var(--gray-200)', borderRadius: '4px', margin: '0 auto 0.5rem' }}></div>
                    <div style={{ width: '40%', height: 16, background: 'var(--gray-200)', borderRadius: '4px', margin: '0 auto' }}></div>
                  </div>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'var(--gradient-secondary)',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <Biotech sx={{ fontSize: 36, color: 'white' }} />
                    </Box>
                    <div className="metric-number">{stats.totalBiomarkers}</div>
                    <div className="metric-label">Tracked Biomarkers</div>
                  </>
                )}
              </Box>
            </div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <div className="premium-card animate-on-load animate-delay-4 hover-lift">
              <Box sx={{ textAlign: 'center' }}>
                {loading ? (
                  <div className="pulse">
                    <div style={{ width: 80, height: 80, background: 'var(--gray-200)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                    <div style={{ width: '60%', height: 24, background: 'var(--gray-200)', borderRadius: '4px', margin: '0 auto 0.5rem' }}></div>
                    <div style={{ width: '40%', height: 16, background: 'var(--gray-200)', borderRadius: '4px', margin: '0 auto' }}></div>
                  </div>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: stats.abnormalCount > 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'var(--gradient-secondary)',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <Warning sx={{ fontSize: 36, color: 'white' }} />
                    </Box>
                    <div className="metric-number" style={{ color: stats.abnormalCount > 0 ? '#ef4444' : undefined }}>
                      {stats.abnormalCount}
                    </div>
                    <div className="metric-label">Abnormal Values</div>
                  </>
                )}
              </Box>
            </div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <div className="premium-card animate-on-load animate-delay-5 hover-lift">
              <Box sx={{ textAlign: 'center' }}>
                {loading ? (
                  <div className="pulse">
                    <div style={{ width: 80, height: 80, background: 'var(--gray-200)', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
                    <div style={{ width: '60%', height: 24, background: 'var(--gray-200)', borderRadius: '4px', margin: '0 auto 0.5rem' }}></div>
                    <div style={{ width: '40%', height: 16, background: 'var(--gray-200)', borderRadius: '4px', margin: '0 auto' }}></div>
                  </div>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <Timeline sx={{ fontSize: 36, color: 'white' }} />
                    </Box>
                    <div className="metric-number" style={{ color: '#8b5cf6' }}>Active</div>
                    <div className="metric-label">Trend Analysis</div>
                  </>
                )}
              </Box>
            </div>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* Quick Actions Panel */}
          <Grid item xs={12} md={8}>
            <div className="premium-card slide-in-left">
              <Box sx={{ mb: 3 }}>
                <Typography variant="h4" className="text-gradient" sx={{ fontWeight: 700, mb: 1 }}>
                  Quick Actions
                </Typography>
                <Typography variant="body1" sx={{ color: 'var(--gray-500)' }}>
                  Get started with these essential health tracking tools
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Button
                    className="btn-primary"
                    fullWidth
                    component={Link}
                    to="/upload"
                    startIcon={<Upload />}
                    sx={{ py: 2, textTransform: 'none', fontSize: '1rem' }}
                  >
                    Upload New Report
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    className="btn-secondary"
                    fullWidth
                    component={Link}
                    to="/biomarkers"
                    startIcon={<Biotech />}
                    sx={{ py: 2, textTransform: 'none', fontSize: '1rem' }}
                  >
                    View Biomarkers
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    className="btn-secondary"
                    fullWidth
                    component={Link}
                    to="/trends"
                    startIcon={<TrendingUp />}
                    sx={{ py: 2, textTransform: 'none', fontSize: '1rem' }}
                  >
                    Analyze Trends
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    className="btn-secondary"
                    fullWidth
                    component={Link}
                    to="/recommendations"
                    startIcon={<Analytics />}
                    sx={{ py: 2, textTransform: 'none', fontSize: '1rem' }}
                  >
                    Get AI Insights
                  </Button>
                </Grid>
              </Grid>
            </div>
          </Grid>

          {/* Recent Reports Panel */}
          <Grid item xs={12} md={4}>
            <div className="premium-card slide-in-right">
              <Typography variant="h5" className="text-gradient" sx={{ fontWeight: 700, mb: 3 }}>
                Recent Reports
              </Typography>
              
              {loading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="pulse" style={{ marginBottom: '1rem' }}>
                      <div style={{ width: '100%', height: 60, background: 'var(--gray-200)', borderRadius: 'var(--radius-lg)', marginBottom: '0.5rem' }}></div>
                      <div style={{ width: '60%', height: 16, background: 'var(--gray-200)', borderRadius: '4px' }}></div>
                    </div>
                  ))}
                </Box>
              ) : stats.latestReports.length > 0 ? (
                <Box>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                  }}>
                    {stats.latestReports.map((report, index) => (
                      <div
                        key={report._id}
                        className="glass-effect hover-lift"
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-lg)',
                          cursor: 'pointer',
                          animationDelay: `${index * 0.1}s`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'var(--gray-800)' }}>
                            {report.fileName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--gray-500)' }}>
                            {new Date(report.createdAt).toLocaleDateString()}
                          </Typography>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ color: 'var(--primary-600)', fontWeight: 600 }}>
                            Next Check
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--gray-500)', display: 'block' }}>
                            {new Date(new Date(report.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </Typography>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="text"
                    component={Link}
                    to="/reports"
                    sx={{ mt: 2, color: 'var(--primary-600)', fontWeight: 600 }}
                  >
                    View All Reports →
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Upload sx={{ fontSize: 64, color: 'var(--gray-300)', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'var(--gray-500)', mb: 2 }}>
                    No reports uploaded yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--gray-400)', mb: 3 }}>
                    Upload your first lab report to get started
                  </Typography>
                  <Button
                    className="btn-primary"
                    component={Link}
                    to="/upload"
                  >
                    Upload First Report
                  </Button>
                </Box>
              )}
            </div>
          </Grid>
        </Grid>

        {/* Registered Doctors Section */}
        {doctors.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <div className="premium-card slide-in-up">
              <Typography variant="h4" className="text-gradient" sx={{ fontWeight: 700, mb: 3 }}>
                Registered Doctors
              </Typography>
              <Grid container spacing={3}>
                {doctors.map((doctor, index) => (
                  <Grid item xs={12} sm={6} md={4} key={doctor._id}>
                    <div
                      className="glass-effect hover-lift"
                      style={{
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        animationDelay: `${index * 0.1}s`
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'var(--gray-800)' }}>
                        {doctor.name}
                      </Typography>
                      {doctor.specialization && (
                        <Typography variant="body2" sx={{ color: 'var(--primary-600)', mb: 0.5 }}>
                          {doctor.specialization}
                        </Typography>
                      )}
                      {doctor.hospital && (
                        <Typography variant="body2" sx={{ color: 'var(--gray-600)', mb: 0.5 }}>
                          {doctor.hospital}
                        </Typography>
                      )}
                      {doctor.experienceYears && (
                        <Typography variant="caption" sx={{ color: 'var(--gray-500)' }}>
                          {doctor.experienceYears} years experience
                        </Typography>
                      )}
                    </div>
                  </Grid>
                ))}
              </Grid>
            </div>
          </Box>
        )}
      </Container>
    </div>
  );
};

export default Dashboard;
