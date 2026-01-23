import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const Trends = () => {
  const [groupedData, setGroupedData] = useState({});
  const [selectedTest, setSelectedTest] = useState('');
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupedData();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      fetchTrendData(selectedTest);
    }
  }, [selectedTest]);

  const fetchGroupedData = async () => {
    try {
      const response = await axios.get('/api/biomarkers/grouped');
      setGroupedData(response.data.grouped || {});
      const testNames = Object.keys(response.data.grouped || {});
      if (testNames.length > 0) {
        setSelectedTest(testNames[0]);
      }
    } catch (error) {
      console.error('Error fetching grouped data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async (testName) => {
    try {
      const response = await axios.get(`/api/trends/${encodeURIComponent(testName)}`);
      setTrendData(response.data);
    } catch (error) {
      console.error('Error fetching trend data:', error);
      setTrendData(null);
    }
  };

  const prepareChartData = () => {
    if (!trendData || !trendData.dataPoints) return [];

    return trendData.dataPoints.map(point => ({
      date: new Date(point.date).toLocaleDateString(),
      value: point.value,
      normalizedValue: point.normalizedValue
    }));
  };

  if (loading) {
    return <Container><Typography>Loading...</Typography></Container>;
  }

  const testNames = Object.keys(groupedData);
  const chartData = prepareChartData();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Trend Analysis
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Biomarker</InputLabel>
          <Select
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            label="Select Biomarker"
          >
            {testNames.map((test) => (
              <MenuItem key={test} value={test}>
                {test}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {trendData ? (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Trend
                    </Typography>
                    <Chip
                      label={trendData.trend}
                      color={
                        trendData.trend === 'increasing' ? 'primary' :
                        trendData.trend === 'decreasing' ? 'secondary' : 'default'
                      }
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Change
                    </Typography>
                    <Typography variant="h6">
                      {trendData.percentChange}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Assessment
                    </Typography>
                    <Chip
                      label={trendData.trendAssessment}
                      color={
                        trendData.trendAssessment === 'improving' ? 'success' :
                        trendData.trendAssessment === 'concerning' ? 'error' : 'default'
                      }
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {trendData.insights && trendData.insights.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {trendData.insights.map((insight, index) => (
                  <Alert key={index} severity="info" sx={{ mb: 1 }}>
                    {insight}
                  </Alert>
                ))}
              </Box>
            )}

            {chartData.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Value Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      name="Value"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Box>
        ) : (
          <Typography color="textSecondary">
            Select a biomarker to view trends. Need at least 2 data points for trend analysis.
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default Trends;
