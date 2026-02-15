import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import { Search, Person, CalendarToday, TrendingUp, ShowChart, Summarize } from '@mui/icons-material';
import Button from '../components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getDoctorById, upsertDoctor } from '../services/doctorsStore';
import DoctorProfileCompletion from '../components/DoctorProfileCompletion';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [reports, setReports] = useState([]);
  const [trends, setTrends] = useState([]);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (user && user.role === 'DOCTOR') {
      const doctorProfile = getDoctorById(user._id);
      setProfileLoading(false);
      if (!doctorProfile) {
        setShowProfileCompletion(true);
      }
    } else {
      setProfileLoading(false);
    }
  }, [user]);

  const handleProfileComplete = (doctorProfile) => {
    upsertDoctor(doctorProfile);
    setShowProfileCompletion(false);
  };

  const handleSearch = async () => {
    if (!patientId.trim()) {
      setError('Please enter a Patient ID');
      return;
    }

    setLoading(true);
    setError('');
    setPatientData(null);
    setReports([]);
    setTrends([]);
    setSelectedTrend(null);
    setSummary(null);

    try {
      const [reportsRes, trendsRes] = await Promise.all([
        api.get(`/api/doctor/patient/${patientId}/reports`),
        api.get(`/api/doctor/patient/${patientId}/trends`)
      ]);

      setPatientData(reportsRes.data.patient);
      setReports(reportsRes.data.reports);
      setTrends(trendsRes.data.trends || []);
      
      if (trendsRes.data.trends && trendsRes.data.trends.length > 0) {
        setSelectedTrend(trendsRes.data.trends[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch patient data');
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!selectedTrend || !selectedTrend.points) return [];

    // Check if there are duplicate dates
    const dateCounts = {};
    selectedTrend.points.forEach(point => {
      const dateStr = new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
    });
    const hasDuplicates = Object.values(dateCounts).some(count => count > 1);

    return selectedTrend.points.map((point, index) => {
      const dateStr = new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      
      // Truncate report name for X-axis label (max 14-18 chars)
      let shortName = point.reportName;
      if (!shortName) {
        shortName = `Report #${index + 1}`;
      } else if (shortName.length > 16) {
        shortName = shortName.substring(0, 16) + '...';
      }
      
      // Create two-line label format
      const displayLabel = hasDuplicates && shortName 
        ? `${dateStr}\n${shortName}` 
        : dateStr;

      return {
        date: displayLabel,
        value: point.value,
        unit: selectedTrend.unit,
        reportName: point.reportName,
        reportId: point.reportId
      };
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'success';
      case 'high': return 'error';
      case 'low': return 'warning';
      default: return 'default';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0]?.payload;
      return (
        <Paper elevation={3} sx={{ p: 2, borderRadius: '8px' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            {label.split('\n')[0]}
          </Typography>
          {point?.reportName && (
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
              {point.reportName}
            </Typography>
          )}
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.payload.unit}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  // Custom X-Axis Tick for Multi-line Labels
  const CustomXAxisTick = ({ x, y, payload }) => {
    const lines = payload.value.split('\n');
    return (
      <g transform={`translate(${x},${y})`}>
        {lines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={index * 14 + 4}
            dy={0}
            textAnchor="middle"
            fill="#666"
            fontSize={11}
            fontWeight={500}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  const handleGenerateSummary = async () => {
    if (!patientData) return;
    
    setLoadingSummary(true);
    try {
      const response = await api.get(`/api/summary?userId=${patientData.id}`);
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const chartData = prepareChartData();

  return (
    <>
      <DoctorProfileCompletion
        open={showProfileCompletion}
        doctorData={user}
        onComplete={handleProfileComplete}
      />
      
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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Doctor Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search for patients by their Patient ID to view reports and trends
        </Typography>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '12px', border: '1px solid #f0f0f0' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            label="Patient ID"
            placeholder="VS-PAT-XXXXXXXX"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            sx={{ minWidth: '120px', height: '56px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {patientData && (
        <>
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '12px', border: '1px solid #f0f0f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Person sx={{ fontSize: 40, color: '#667eea' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {patientData.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {patientData.email}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#667eea', mt: 0.5 }}>
                  ID: {patientData.patientId}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Reports ({reports.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Summarize />}
              onClick={handleGenerateSummary}
              disabled={loadingSummary || reports.length === 0}
              sx={{ minWidth: '180px' }}
            >
              {loadingSummary ? <CircularProgress size={24} /> : 'Generate AI Summary'}
            </Button>
          </Box>

          {summary && summary.summaryAvailable && (
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '12px', border: '1px solid #f0f0f0', background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Summarize sx={{ color: '#667eea' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI-Generated Clinical Summary
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Based on {summary.metadata?.totalReports} reports from {new Date(summary.metadata?.dateRange?.first).toLocaleDateString()} to {new Date(summary.metadata?.dateRange?.latest).toLocaleDateString()}
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {summary.summary?.map((item, idx) => (
                <Box key={idx} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {idx + 1}. {item.title}
                    </Typography>
                    <Chip 
                      label={item.confidence} 
                      size="small" 
                      color={item.confidence === 'High' ? 'success' : item.confidence === 'Medium' ? 'warning' : 'default'}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {item.text}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}
          
          {summary && !summary.summaryAvailable && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {summary.message}
            </Alert>
          )}

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Reports ({reports.length})
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {reports.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">No reports found for this patient</Alert>
              </Grid>
            ) : (
              reports.map((report) => (
                <Grid item xs={12} md={6} key={report._id}>
                  <Card elevation={0} sx={{ border: '1px solid #f0f0f0' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {report.fileName}
                        </Typography>
                        <Chip
                          label={report.status}
                          size="small"
                          color={report.status === 'completed' ? 'success' : 'default'}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {report.reportDate
                            ? new Date(report.reportDate).toLocaleDateString()
                            : new Date(report.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      {report.extractedData?.biomarkers && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                            Biomarkers: {report.extractedData.biomarkers.length}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp /> Trends
          </Typography>
          
          {trends.length === 0 ? (
            <Alert severity="info">No trend data available for this patient</Alert>
          ) : (
            <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: '12px', border: '1px solid #f0f0f0' }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Biomarker</InputLabel>
                <Select
                  value={selectedTrend?.key || ''}
                  onChange={(e) => {
                    const trend = trends.find(t => t.key === e.target.value);
                    setSelectedTrend(trend);
                  }}
                  label="Select Biomarker"
                >
                  {trends.map((trend) => (
                    <MenuItem key={trend.key} value={trend.key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ShowChart sx={{ color: '#667eea' }} />
                        {trend.name} ({trend.stats.dataPoints} points)
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {chartData.length > 0 && selectedTrend && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedTrend.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip 
                        label={`${selectedTrend.stats.direction}`} 
                        size="small" 
                        color={selectedTrend.stats.direction === 'increasing' ? 'success' : selectedTrend.stats.direction === 'decreasing' ? 'error' : 'default'}
                      />
                      <Chip 
                        label={`${selectedTrend.stats.changeRate}%`} 
                        size="small" 
                      />
                    </Box>
                  </Box>
                  <Box sx={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#667eea" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#666"
                          fontSize={11}
                          interval={0}
                          angle={0}
                          textAnchor="middle"
                          height={60}
                          tick={<CustomXAxisTick />}
                        />
                        <YAxis 
                          stroke="#666"
                          fontSize={12}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#667eea"
                          strokeWidth={3}
                          fill="url(#colorValue)"
                          name={`Value (${selectedTrend.unit})`}
                          dot={{ fill: '#667eea', strokeWidth: 2, stroke: 'white', r: 5 }}
                          activeDot={{ r: 7, fill: '#667eea', stroke: 'white', strokeWidth: 3 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </>
      )}
      </Container>
    </>
  );
};

export default DoctorDashboard;
