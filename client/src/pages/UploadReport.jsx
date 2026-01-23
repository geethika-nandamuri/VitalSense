import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UploadReport = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError('');
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('report', file);

    try {
      const response = await axios.post('/api/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
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

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Upload Lab Report
      </Typography>

      <Paper sx={{ p: 4, mt: 2 }}>
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            mb: 2
          }}
        >
          <input {...getInputProps()} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop the file here' : 'Drag & drop a lab report here'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            or click to select a file
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Supports: JPEG, PNG, PDF (Max 10MB)
          </Typography>
        </Box>

        {file && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              Selected: {file.name}
            </Typography>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading}
              sx={{ mt: 2 }}
            >
              {uploading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : (
                'Upload & Analyze'
              )}
            </Button>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Report processed successfully! Found {result.biomarkers?.length || 0} biomarkers.
            </Alert>

            <Typography variant="h6" gutterBottom>
              Extracted Biomarkers:
            </Typography>
            <List>
              {result.biomarkers?.map((biomarker) => (
                <ListItem key={biomarker.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                  <ListItemText
                    primary={biomarker.testName}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Value: {biomarker.value} {biomarker.unit}
                        </Typography>
                        {biomarker.referenceRange && (
                          <Typography variant="caption" color="textSecondary">
                            Range: {biomarker.referenceRange.min} - {biomarker.referenceRange.max} {biomarker.referenceRange.unit}
                          </Typography>
                        )}
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

            <Button
              variant="contained"
              onClick={() => navigate('/biomarkers')}
              sx={{ mt: 2 }}
            >
              View All Biomarkers
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UploadReport;
