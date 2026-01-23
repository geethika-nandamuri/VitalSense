import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';

const Biomarkers = () => {
  const [biomarkers, setBiomarkers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBiomarker, setSelectedBiomarker] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explanationLoading, setExplanationLoading] = useState(false);

  useEffect(() => {
    fetchBiomarkers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = biomarkers.filter(b =>
        b.testName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFiltered(filtered);
    } else {
      setFiltered(biomarkers);
    }
  }, [searchTerm, biomarkers]);

  const fetchBiomarkers = async () => {
    try {
      const response = await axios.get('/api/biomarkers');
      setBiomarkers(response.data.biomarkers || []);
      setFiltered(response.data.biomarkers || []);
    } catch (error) {
      console.error('Error fetching biomarkers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetExplanation = async (testName) => {
    setSelectedBiomarker(testName);
    setExplanationLoading(true);
    setExplanation(null);

    try {
      const response = await axios.get(`/api/biomarkers/${encodeURIComponent(testName)}/explanation`);
      setExplanation(response.data);
    } catch (error) {
      console.error('Error fetching explanation:', error);
    } finally {
      setExplanationLoading(false);
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
    return <Container><Typography>Loading...</Typography></Container>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Biomarkers
      </Typography>

      <Paper sx={{ p: 3, mt: 2 }}>
        <TextField
          fullWidth
          placeholder="Search biomarkers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 3 }}
        />

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Test Name</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Reference Range</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      No biomarkers found. Upload a lab report to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((biomarker) => (
                  <TableRow key={biomarker._id}>
                    <TableCell>{biomarker.testName}</TableCell>
                    <TableCell>{biomarker.value}</TableCell>
                    <TableCell>{biomarker.unit}</TableCell>
                    <TableCell>
                      {biomarker.referenceRange
                        ? `${biomarker.referenceRange.min} - ${biomarker.referenceRange.max} ${biomarker.referenceRange.unit}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={biomarker.status}
                        color={getStatusColor(biomarker.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(biomarker.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<InfoIcon />}
                        onClick={() => handleGetExplanation(biomarker.testName)}
                      >
                        Explain
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={!!selectedBiomarker}
        onClose={() => {
          setSelectedBiomarker(null);
          setExplanation(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Explanation: {selectedBiomarker}
        </DialogTitle>
        <DialogContent>
          {explanationLoading ? (
            <Typography>Loading explanation...</Typography>
          ) : explanation ? (
            <Box sx={{ whiteSpace: 'pre-wrap' }}>
              <Typography variant="body1">
                {explanation.explanation}
              </Typography>
            </Box>
          ) : (
            <Typography>No explanation available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSelectedBiomarker(null);
            setExplanation(null);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Biomarkers;
