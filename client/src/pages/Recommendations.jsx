import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get('/api/recommendations');
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'success';
      case 'high': return 'error';
      case 'low': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Personalized Recommendations
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        These recommendations are based on your abnormal biomarker values and are for wellness purposes only. Always consult with healthcare professionals for medical decisions.
      </Alert>

      {recommendations.length === 0 ? (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography color="textSecondary" align="center">
            No abnormal biomarkers found. All your values are within normal range!
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ mt: 2 }}>
          {recommendations.map((rec, index) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="h6">{rec.testName}</Typography>
                  <Chip
                    label={`${rec.currentValue} ${rec.unit}`}
                    color={getStatusColor(rec.status)}
                    size="small"
                  />
                  <Chip
                    label={rec.status}
                    color={getStatusColor(rec.status)}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Reference Range: {rec.referenceRange
                      ? `${rec.referenceRange.min} - ${rec.referenceRange.max} ${rec.referenceRange.unit}`
                      : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom sx={{ mb: 2 }}>
                    Date: {new Date(rec.date).toLocaleDateString()}
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {rec.recommendations}
                    </Typography>
                  </Paper>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Recommendations;
