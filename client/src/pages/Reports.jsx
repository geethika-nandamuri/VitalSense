import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Drawer
} from '@mui/material';
import {
  Delete,
  Description,
  CheckCircle,
  Schedule,
  Error,
  Close
} from '@mui/icons-material';
import api from '../utils/api';
import ExtractedBiomarkersView from '../components/ExtractedBiomarkersView';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, report: null });
  const [detailsDrawer, setDetailsDrawer] = useState({ open: false, report: null });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/reports');
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (report) => {
    setDeleteDialog({ open: true, report });
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/api/reports/${deleteDialog.report._id}`);
      setReports(reports.filter(r => r._id !== deleteDialog.report._id));
      setDeleteDialog({ open: false, report: null });
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, report: null });
  };

  const handleViewDetails = (report) => {
    setDetailsDrawer({ open: true, report });
  };

  const handleCloseDetails = () => {
    setDetailsDrawer({ open: false, report: null });
  };

  const adaptReportToBiomarkers = (report) => {
    if (!report) return [];
    
    // Check if extractedData is an array (raw OCR data)
    if (Array.isArray(report.extractedData)) {
      return report.extractedData.map(item => ({
        id: item._id,
        testName: item.testName,
        value: item.value,
        unit: item.unit || 'N/A',
        referenceRange: item.referenceRange,
        status: item.status || 'unknown'
      }));
    }
    
    // Check other possible paths
    const biomarkers = report.extractedData?.biomarkers ||
                      report.biomarkers ||
                      report.analysis?.biomarkers ||
                      [];
    
    return biomarkers;
  };

  const getStatusBiomarkerColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'normal': return 'success';
      case 'high': return 'error';
      case 'low': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle sx={{ color: 'var(--success)' }} />;
      case 'processing': return <Schedule sx={{ color: 'var(--warning)' }} />;
      case 'failed': return <Error sx={{ color: 'var(--error)' }} />;
      default: return <Schedule sx={{ color: 'var(--gray-400)' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--gradient-background)' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <div className="pulse">
            <div style={{ width: '100%', height: 200, background: 'var(--gray-200)', borderRadius: 'var(--radius-2xl)' }}></div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gradient-background)' }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box className="animate-on-load" sx={{ mb: 4, textAlign: 'center' }}>
          <Typography
            variant="h3"
            className="text-gradient"
            sx={{ fontWeight: 800, mb: 2 }}
          >
            Lab Reports
          </Typography>
          <Typography variant="h6" sx={{ color: 'var(--gray-500)', fontWeight: 400 }}>
            Manage your uploaded health reports
          </Typography>
        </Box>

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <div className="premium-card" style={{ textAlign: 'center', padding: '4rem' }}>
            <Description sx={{ fontSize: 80, color: 'var(--gray-300)', mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'var(--gray-500)', mb: 2 }}>
              No reports uploaded yet
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--gray-400)' }}>
              Upload your first lab report to get started with health tracking
            </Typography>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report, index) => (
              <div
                key={report._id}
                className="report-card animate-on-load hover-lift"
                style={{ animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
                onClick={() => handleViewDetails(report)}
              >
                {/* Delete Button */}
                <IconButton
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(report);
                  }}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    opacity: 0,
                    transition: 'all 0.2s ease',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    '&:hover': {
                      backgroundColor: '#ef4444',
                      color: 'white',
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>

                {/* Report Icon */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}
                  >
                    <Description sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--gray-800)', mb: 0.5 }}>
                      {report.fileName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--gray-500)' }}>
                      {report.fileType?.toUpperCase()} • {new Date(report.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>

                {/* Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip
                    icon={getStatusIcon(report.status)}
                    label={report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                    className={`status-${getStatusColor(report.status)}`}
                    size="small"
                  />
                  <Typography variant="caption" sx={{ color: 'var(--gray-400)' }}>
                    {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </div>
            ))}
          </div>
        )}

        {/* Details Drawer */}
        <Drawer
          anchor="right"
          open={detailsDrawer.open}
          onClose={handleCloseDetails}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: '600px', md: '700px' },
              background: 'linear-gradient(135deg, var(--gray-50) 0%, var(--primary-50) 100%)',
              p: 0
            }
          }}
        >
          <Box sx={{ p: 3, borderBottom: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'var(--gray-800)' }}>
                Report Details
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--gray-600)', mt: 0.5 }}>
                {detailsDrawer.report?.fileName}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDetails} sx={{ color: 'var(--gray-600)' }}>
              <Close />
            </IconButton>
          </Box>
          <Box sx={{ p: 3, overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
            <div className="premium-card" style={{ padding: '2rem' }}>
              <ExtractedBiomarkersView 
                biomarkers={adaptReportToBiomarkers(detailsDrawer.report)}
                fileName={detailsDrawer.report?.fileName}
              />
            </div>
          </Box>
        </Drawer>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialog.open}
          onClose={handleDeleteCancel}
          PaperProps={{
            sx: {
              borderRadius: 'var(--radius-2xl)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 700, color: 'var(--gray-800)' }}>
            Delete Report
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ color: 'var(--gray-600)' }}>
              Are you sure you want to delete "{deleteDialog.report?.fileName}"? 
              This action cannot be undone and will also remove all associated biomarker data.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 2 }}>
            <Button
              onClick={handleDeleteCancel}
              className="btn-secondary"
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              sx={{
                minWidth: 100,
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 'var(--radius-lg)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
};

export default Reports;