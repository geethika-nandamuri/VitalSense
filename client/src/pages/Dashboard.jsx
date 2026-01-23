import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';

const Dashboard = () => {
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

  if (loading) {
    return <Container><Typography>Loading...</Typography></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Wellness Disclaimer:</strong> This tool provides wellness suggestions and does not replace medical advice. Always consult with healthcare professionals for medical decisions.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Reports
              </Typography>
              <Typography variant="h4">
                {stats.totalReports}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tracked Biomarkers
              </Typography>
              <Typography variant="h4">
                {stats.totalBiomarkers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Abnormal Values
              </Typography>
              <Typography variant="h4" color={stats.abnormalCount > 0 ? 'error' : 'success'}>
                {stats.abnormalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Quick Actions</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" component={Link} to="/upload">
                Upload New Report
              </Button>
              <Button variant="outlined" component={Link} to="/biomarkers">
                View Biomarkers
              </Button>
              <Button variant="outlined" component={Link} to="/trends">
                View Trends
              </Button>
              <Button variant="outlined" component={Link} to="/recommendations">
                Get Recommendations
              </Button>
              <Button variant="outlined" component={Link} to="/summary">
                Doctor Summary
              </Button>
            </Box>
          </Paper>
        </Grid>

        {stats.latestReports.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Reports
              </Typography>
              {stats.latestReports.map((report) => (
                <Box key={report._id} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                  <Typography>{report.fileName}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Dashboard;
