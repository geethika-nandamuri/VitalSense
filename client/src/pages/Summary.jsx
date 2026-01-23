import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import axios from 'axios';

const Summary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/summary');
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'success';
      case 'high': return 'error';
      case 'low': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Doctor-Ready Summary
        </Typography>
        <Button variant="contained" onClick={fetchSummary} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Refresh Summary'}
        </Button>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Note:</strong> This summary is generated for informational purposes. Always consult with healthcare professionals for medical decisions.
      </Alert>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : summary ? (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Box sx={{ whiteSpace: 'pre-wrap', bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Typography variant="body1">
                {summary.summary}
              </Typography>
            </Box>
          </Paper>

          {summary.abnormalBiomarkers && summary.abnormalBiomarkers.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Abnormal Biomarkers
              </Typography>
              <List>
                {summary.abnormalBiomarkers.map((biomarker, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={biomarker.testName}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Value: {biomarker.value} {biomarker.unit}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Date: {new Date(biomarker.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={biomarker.status}
                      color={getStatusColor(biomarker.status)}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {summary.persistentIssues && summary.persistentIssues.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Persistent Issues
              </Typography>
              <List>
                {summary.persistentIssues.map((issue, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={issue.testName}
                      secondary={`${issue.currentValue} - ${issue.duration}`}
                    />
                    <Chip
                      label={issue.status}
                      color="warning"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {summary.trends && summary.trends.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Notable Trends
              </Typography>
              <List>
                {summary.trends.map((trend, index) => (
                  <ListItem key={index}>
                    <Typography>{trend}</Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" color="textSecondary">
              Generated at: {new Date(summary.generatedAt).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography color="textSecondary" align="center">
            No data available. Upload lab reports to generate a summary.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Summary;
