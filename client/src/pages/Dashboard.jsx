import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Assessment,
  Biotech,
  TrendingUp,
  Upload,
  Warning
} from '@mui/icons-material';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const StatCard = ({ title, value, icon, color = '#667eea', loading = false }) => {
  if (loading) {
    return (
      <Card>
        <Box sx={{ textAlign: 'center' }}>
          <Skeleton variant="circular" width={60} height={60} sx={{ mx: 'auto', mb: 2 }} />
          <Skeleton variant="text" width="60%" sx={{ mx: 'auto', mb: 1 }} />
          <Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} />
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box sx={{ textAlign: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: `${color}15`,
            mx: 'auto',
            mb: 2,
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 30, color } })}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#2d3748' }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    totalBiomarkers: 0,
    abnormalCount: 0,
    latestReports: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [reportsRes, biomarkersRes] = await Promise.all([
        axios.get('/api/reports'),
        axios.get('/api/biomarkers/latest')
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Guest'}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Here's your health overview
        </Typography>
      </Box>

      <Alert
        severity="info"
        icon={<Warning />}
        sx={{
          mb: 4,
          borderRadius: '12px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #bbdefb',
        }}
      >
        <Typography variant="body2">
          <strong>Wellness Disclaimer:</strong> This tool provides wellness suggestions and does not replace medical advice. Always consult with healthcare professionals for medical decisions.
        </Typography>
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Reports"
            value={stats.totalReports}
            icon={<Assessment />}
            color="#667eea"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tracked Biomarkers"
            value={stats.totalBiomarkers}
            icon={<Biotech />}
            color="#10b981"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Abnormal Values"
            value={stats.abnormalCount}
            icon={<Warning />}
            color={stats.abnormalCount > 0 ? '#ef4444' : '#10b981'}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Trend Analysis"
            value="Active"
            icon={<TrendingUp />}
            color="#8b5cf6"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get started with these common tasks
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  fullWidth
                  component={Link}
                  to="/upload"
                  startIcon={<Upload />}
                  sx={{ py: 1.5 }}
                >
                  Upload New Report
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  component={Link}
                  to="/biomarkers"
                  startIcon={<Biotech />}
                  sx={{ py: 1.5 }}
                >
                  View Biomarkers
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  component={Link}
                  to="/trends"
                  startIcon={<TrendingUp />}
                  sx={{ py: 1.5 }}
                >
                  View Trends
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  component={Link}
                  to="/recommendations"
                  startIcon={<Assessment />}
                  sx={{ py: 1.5 }}
                >
                  Get Recommendations
                </Button>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Recent Reports
            </Typography>
            {loading ? (
              <Box>
                {[1, 2, 3].map((i) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                ))}
              </Box>
            ) : stats.latestReports.length > 0 ? (
              <Box>
                {stats.latestReports.map((report) => (
                  <Box
                    key={report._id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: '#f8f9fa',
                      },
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {report.fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(report.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Box>
                ))}
                <Button
                  variant="text"
                  component={Link}
                  to="/upload"
                  sx={{ mt: 1 }}
                >
                  View All Reports
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Upload sx={{ fontSize: 48, color: '#cbd5e0', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No reports uploaded yet
                </Typography>
                <Button
                  variant="contained"
                  component={Link}
                  to="/upload"
                  size="small"
                >
                  Upload First Report
                </Button>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
