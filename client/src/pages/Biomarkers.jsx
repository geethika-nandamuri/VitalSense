import React, { useState, useEffect } from 'react';
import {
  Container,
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
  DialogActions,
  Fade,
  Grow,
  Avatar,
  Skeleton
} from '@mui/material';
import {
  Search,
  Info,
  Biotech,
  TrendingUp,
  TrendingDown,
  Remove,
  Science,
  Analytics
} from '@mui/icons-material';
import api from '../utils/api';

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
      const response = await api.get('/api/biomarkers');
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
      const response = await api.get(`/api/biomarkers/${encodeURIComponent(testName)}/explanation`);
      setExplanation(response.data);
    } catch (error) {
      console.error('Error fetching explanation:', error);
    } finally {
      setExplanationLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'high': return <TrendingUp />;
      case 'low': return <TrendingDown />;
      case 'normal': return <Remove />;
      default: return <Remove />;
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

  const LoadingSkeleton = () => (
    <TableRow>
      <TableCell colSpan={7}>
        <Box sx={{ p: 2 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
              <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 2 }} />
            </Box>
          ))}
        </Box>
      </TableCell>
    </TableRow>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 50%, var(--secondary-50) 100%)',
      paddingTop: '2rem',
      paddingBottom: '2rem'
    }}>
      <Container maxWidth="xl">
        <Fade in={true} timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 2,
                background: 'var(--gradient-health)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              Biomarker Analysis
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'var(--gray-600)', 
                fontWeight: 400,
                maxWidth: '600px',
                mx: 'auto'
              }}
            >
              Comprehensive view of your health indicators and trends
            </Typography>
          </Box>
        </Fade>

        <Grow in={true} timeout={1000}>
          <div className="premium-card" style={{ padding: '2.5rem', overflow: 'hidden' }}>
            {/* Search Bar */}
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                placeholder="Search biomarkers by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'var(--primary-500)' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 'var(--radius-xl)',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--primary-200)',
                    '&:hover': {
                      border: '1px solid var(--primary-300)'
                    },
                    '&.Mui-focused': {
                      border: '2px solid var(--primary-500)',
                      boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)'
                    }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { border: 'none' }
                  }
                }}
              />
            </Box>

            {/* Premium Table */}
            <TableContainer 
              sx={{ 
                borderRadius: 'var(--radius-2xl)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid var(--gray-200)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow 
                    sx={{ 
                      background: 'var(--gradient-primary)',
                      '& .MuiTableCell-head': {
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        border: 'none',
                        py: 3
                      }
                    }}
                  >
                    <TableCell>Biomarker</TableCell>
                    <TableCell align="center">Value</TableCell>
                    <TableCell align="center">Unit</TableCell>
                    <TableCell align="center">Reference Range</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <LoadingSkeleton />
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <Science sx={{ fontSize: 80, color: 'var(--gray-300)', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: 'var(--gray-500)', mb: 1, fontWeight: 500 }}>
                          No biomarkers found
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--gray-400)' }}>
                          {searchTerm ? 'Try adjusting your search terms' : 'Upload a lab report to get started'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((biomarker, index) => (
                      <Grow key={biomarker._id} in={true} timeout={300 + index * 50}>
                        <TableRow
                          sx={{
                            '&:nth-of-type(even)': {
                              background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 100%)'
                            },
                            '&:hover': {
                              background: 'linear-gradient(135deg, var(--primary-100) 0%, var(--secondary-100) 100%)',
                              transform: 'scale(1.01)',
                              boxShadow: '0 4px 20px rgba(14, 165, 233, 0.15)'
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            '& .MuiTableCell-root': {
                              border: 'none',
                              py: 2.5
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                sx={{
                                  background: 'var(--gradient-secondary)',
                                  width: 48,
                                  height: 48,
                                  fontSize: '1.2rem',
                                  fontWeight: 700
                                }}
                              >
                                {biomarker.testName.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                                  {biomarker.testName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--gray-500)' }}>
                                  Lab Test
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                              {biomarker.value}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Chip
                              label={biomarker.unit}
                              size="small"
                              sx={{
                                background: 'var(--gradient-glass)',
                                border: '1px solid var(--primary-200)',
                                fontWeight: 600
                              }}
                            />
                          </TableCell>
                          
                          <TableCell align="center">
                            {biomarker.referenceRange ? (
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {biomarker.referenceRange.min} - {biomarker.referenceRange.max}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--gray-500)' }}>
                                  {biomarker.referenceRange.unit}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'var(--gray-400)' }}>
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                          
                          <TableCell align="center">
                            <Chip
                              icon={getStatusIcon(biomarker.status)}
                              label={biomarker.status.toUpperCase()}
                              className={`status-${biomarker.status}`}
                              sx={{ 
                                fontWeight: 700,
                                minWidth: '100px',
                                '& .MuiChip-icon': {
                                  fontSize: '1rem'
                                }
                              }}
                            />
                          </TableCell>
                          
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {new Date(biomarker.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </Typography>
                          </TableCell>
                          
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<Analytics />}
                              onClick={() => handleGetExplanation(biomarker.testName)}
                              sx={{
                                backgroundColor: '#2563EB',
                                color: 'white',
                                fontWeight: 600,
                                px: 2.5,
                                py: 1,
                                borderRadius: '10px',
                                textTransform: 'none',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                                '&:hover': {
                                  backgroundColor: '#1D4ED8',
                                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                                  transform: 'translateY(-1px)'
                                },
                                '&:focus': {
                                  outline: '2px solid #2563EB',
                                  outlineOffset: '2px'
                                },
                                '&:active': {
                                  transform: 'translateY(0)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              Explain
                            </Button>
                          </TableCell>
                        </TableRow>
                      </Grow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </Grow>

        {/* Premium Explanation Dialog */}
        <Dialog
          open={!!selectedBiomarker}
          onClose={() => {
            setSelectedBiomarker(null);
            setExplanation(null);
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 'var(--radius-2xl)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--primary-200)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
            }
          }}
        >
          <DialogTitle
            sx={{
              background: 'var(--gradient-primary)',
              color: 'white',
              textAlign: 'center',
              py: 3
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Biotech sx={{ fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {selectedBiomarker}
              </Typography>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: 4 }}>
            {explanationLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ 
                  display: 'inline-block',
                  width: 60,
                  height: 60,
                  border: '4px solid var(--primary-200)',
                  borderTop: '4px solid var(--primary-500)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  mb: 2
                }} />
                <Typography variant="h6" sx={{ color: 'var(--gray-600)' }}>
                  Generating AI explanation...
                </Typography>
              </Box>
            ) : explanation ? (
              <Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    lineHeight: 1.8,
                    fontSize: '1.1rem',
                    color: 'var(--gray-700)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {explanation.explanation}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Info sx={{ fontSize: 64, color: 'var(--gray-300)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'var(--gray-500)' }}>
                  No explanation available
                </Typography>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
            <Button 
              onClick={() => {
                setSelectedBiomarker(null);
                setExplanation(null);
              }}
              size="large"
              sx={{
                borderRadius: 'var(--radius-xl)',
                px: 4,
                py: 1.5,
                fontWeight: 600,
                background: 'var(--gradient-secondary)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default Biomarkers;
