import React from 'react';
import {
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grow
} from '@mui/material';
import { Biotech } from '@mui/icons-material';
import { computeStatus, getStatusColor } from '../utils/biomarkerStatus';

const ExtractedBiomarkersView = ({ biomarkers, fileName }) => {
  const getBiomarkerStatus = (biomarker) => {
    // Use existing status if valid, otherwise compute
    const existingStatus = biomarker.status?.toLowerCase();
    if (existingStatus && ['normal', 'high', 'low', 'critical'].includes(existingStatus)) {
      return biomarker.status;
    }
    
    // Compute status from value and reference range
    return computeStatus(biomarker.value, biomarker.referenceRange);
  };

  const formatReferenceRange = (range) => {
    if (!range) return 'N/A';
    
    if (typeof range === 'object' && !Array.isArray(range)) {
      const { min, max, unit } = range;
      if (min !== null && min !== undefined && max !== null && max !== undefined) {
        return `${min} - ${max}${unit ? ' ' + unit : ''}`;
      }
      if (max !== null && max !== undefined) {
        return `< ${max}${unit ? ' ' + unit : ''}`;
      }
      if (min !== null && min !== undefined) {
        return `> ${min}${unit ? ' ' + unit : ''}`;
      }
      return 'N/A';
    }
    
    return String(range);
  };

  return (
    <Box>
      <Alert 
        severity="success" 
        sx={{ 
          mb: 4,
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, var(--secondary-50) 0%, var(--secondary-100) 100%)',
          border: '1px solid var(--secondary-300)'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          🎉 Report processed successfully!
        </Typography>
        <Typography variant="body1">
          {fileName && `File: ${fileName} • `}
          Found {biomarkers?.length || 0} biomarkers ready for analysis.
        </Typography>
      </Alert>

      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700, 
          mb: 3,
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        Extracted Biomarkers
      </Typography>
      
      <List sx={{ mb: 2 }}>
        {biomarkers?.map((biomarker, index) => {
          const status = getBiomarkerStatus(biomarker);
          return (
          <Grow key={biomarker.id || index} in={true} timeout={300 + index * 50}>
            <ListItem 
              sx={{ 
                background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 100%)',
                border: '1px solid var(--primary-200)',
                borderRadius: 'var(--radius-xl)',
                mb: 2,
                p: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 32px rgba(14, 165, 233, 0.15)'
                }
              }}
            >
              <Biotech sx={{ color: 'var(--primary-600)', mr: 2, fontSize: 28 }} />
              <ListItemText
                primary={
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                    {biomarker.testName || biomarker.name}
                  </Typography>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                      Value: {biomarker.value} {biomarker.unit}
                    </Typography>
                    {biomarker.referenceRange && (
                      <Typography variant="body2" sx={{ color: 'var(--gray-600)' }}>
                        Reference Range: {formatReferenceRange(biomarker.referenceRange)}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <Chip
                label={status.toUpperCase()}
                color={getStatusColor(status)}
                sx={{ fontWeight: 700, minWidth: 80 }}
              />
            </ListItem>
          </Grow>
          );
        })}
      </List>
    </Box>
  );
};

export default ExtractedBiomarkersView;
