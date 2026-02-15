import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Fade,
  Grow,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload,
  Description,
  CheckCircle,
  Error,
  Analytics
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ExtractedBiomarkersView from '../components/ExtractedBiomarkersView';

const UploadReport = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
      setResult(null);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    setResult(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('report', file);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const response = await api.post('/api/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setResult(response.data);
        setFile(null);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      setUploadProgress(0);
    } finally {
      setUploading(false);
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

  const getDropzoneStyles = () => {
    if (isDragReject) {
      return {
        borderColor: 'var(--error)',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
      };
    }
    if (isDragActive) {
      return {
        borderColor: 'var(--primary-500)',
        background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)',
        transform: 'scale(1.02)'
      };
    }
    return {
      borderColor: 'var(--gray-300)',
      background: 'rgba(255, 255, 255, 0.8)'
    };
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 50%, var(--secondary-50) 100%)',
      paddingTop: '2rem',
      paddingBottom: '2rem'
    }}>
      <Container maxWidth="md">
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
              Upload Lab Report
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'var(--gray-600)', 
                fontWeight: 400,
                maxWidth: '500px',
                mx: 'auto'
              }}
            >
              Transform your lab results into actionable health insights
            </Typography>
          </Box>
        </Fade>

        <Grow in={true} timeout={1000}>
          <div className="premium-card" style={{ padding: '3rem', marginBottom: '2rem' }}>
            {/* Premium Dropzone */}
            <Box
              {...getRootProps()}
              sx={{
                border: '3px dashed',
                borderRadius: 'var(--radius-2xl)',
                p: 6,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                mb: 3,
                ...getDropzoneStyles()
              }}
            >
              <input {...getInputProps()} />
              
              {/* Animated Background */}
              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: isDragActive 
                  ? 'radial-gradient(circle, var(--primary-200)20 0%, transparent 70%)'
                  : 'radial-gradient(circle, var(--gray-200)10 0%, transparent 70%)',
                animation: isDragActive ? 'pulse 2s ease-in-out infinite' : 'none',
                zIndex: 0
              }} />
              
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <CloudUpload 
                  sx={{ 
                    fontSize: { xs: 60, sm: 80 }, 
                    color: isDragActive ? 'var(--primary-500)' : 'var(--gray-400)',
                    mb: 2,
                    transition: 'all 0.3s ease',
                    transform: isDragActive ? 'scale(1.1)' : 'scale(1)'
                  }} 
                />
                
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    color: isDragActive ? 'var(--primary-700)' : 'var(--gray-700)'
                  }}
                >
                  {isDragActive ? 'Drop your file here!' : 'Drag & drop your lab report'}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'var(--gray-600)', 
                    mb: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  or click to browse files
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: 2, 
                  flexWrap: 'wrap',
                  mt: 3
                }}>
                  <Chip 
                    label="PDF" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                      color: 'white',
                      fontWeight: 600
                    }} 
                  />
                  <Chip 
                    label="JPEG" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: 'white',
                      fontWeight: 600
                    }} 
                  />
                  <Chip 
                    label="PNG" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
                      color: 'white',
                      fontWeight: 600
                    }} 
                  />
                </Box>
                
                <Typography 
                  variant="caption" 
                  sx={{ 
                    display: 'block', 
                    mt: 2, 
                    color: 'var(--gray-500)',
                    fontSize: '0.9rem'
                  }}
                >
                  Maximum file size: 10MB
                </Typography>
              </Box>
            </Box>

            {/* File Preview */}
            {file && (
              <Fade in={true} timeout={500}>
                <Box sx={{ 
                  p: 3, 
                  background: 'linear-gradient(135deg, var(--secondary-50) 0%, var(--secondary-100) 100%)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--secondary-200)',
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Description sx={{ color: 'var(--secondary-600)', fontSize: 40 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                      {file.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--gray-600)' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                  <CheckCircle sx={{ color: 'var(--secondary-600)' }} />
                </Box>
              </Fade>
            )}

            {/* Upload Progress */}
            {uploading && (
              <Fade in={true} timeout={300}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--primary-700)' }}>
                      Processing your report...
                    </Typography>
                    <CircularProgress size={20} sx={{ ml: 2, color: 'var(--primary-500)' }} />
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{
                      height: 8,
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--gray-200)',
                      '& .MuiLinearProgress-bar': {
                        background: 'var(--gradient-primary)',
                        borderRadius: 'var(--radius-lg)'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'var(--gray-600)', mt: 1 }}>
                    {Math.round(uploadProgress)}% complete
                  </Typography>
                </Box>
              </Fade>
            )}

            {/* Upload Button */}
            {file && !uploading && (
              <Grow in={true} timeout={600}>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  size="large"
                  sx={{
                    background: 'var(--gradient-primary)',
                    borderRadius: 'var(--radius-xl)',
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    boxShadow: '0 8px 32px rgba(14, 165, 233, 0.3)',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(14, 165, 233, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Analytics sx={{ mr: 1 }} />
                  Analyze Report
                </Button>
              </Grow>
            )}

            {/* Error Display */}
            {error && (
              <Fade in={true} timeout={500}>
                <Alert 
                  severity="error" 
                  sx={{ 
                    mt: 3,
                    borderRadius: 'var(--radius-xl)',
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    border: '1px solid #fca5a5'
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {error}
                  </Typography>
                </Alert>
              </Fade>
            )}
          </div>
        </Grow>

        {/* Results Display */}
        {result && (
          <Fade in={true} timeout={800}>
            <div className="premium-card" style={{ padding: '3rem' }}>
              <ExtractedBiomarkersView 
                biomarkers={result.biomarkers}
                fileName={null}
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 4 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/biomarkers')}
                  size="large"
                  sx={{
                    background: 'var(--gradient-secondary)',
                    borderRadius: 'var(--radius-xl)',
                    px: 4,
                    py: 2,
                    fontWeight: 600,
                    boxShadow: '0 8px 32px rgba(34, 197, 94, 0.3)',
                    '&:hover': {
                      boxShadow: '0 12px 40px rgba(34, 197, 94, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  View All Biomarkers
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/trends')}
                  size="large"
                  sx={{
                    borderColor: 'var(--primary-300)',
                    color: 'var(--primary-700)',
                    borderRadius: 'var(--radius-xl)',
                    px: 4,
                    py: 2,
                    fontWeight: 600,
                    '&:hover': {
                      background: 'var(--primary-50)',
                      borderColor: 'var(--primary-500)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Analyze Trends
                </Button>
              </Box>
            </div>
          </Fade>
        )}
      </Container>
    </div>
  );
};

export default UploadReport;
