import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CommentIcon from '@mui/icons-material/Comment';
import { format } from 'date-fns';

const PointHistoryModal = ({ open, onClose, history, loading, pointName }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP'); // e.g., "April 29, 2025"
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP p'); // e.g., "April 29, 2025 at 2:30 PM"
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'not completed':
        return 'error';
      case 'APPROVED':
        return 'success';
      case 'NOT APPROVED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#f5f5f5', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '2px solid #e0e0e0'
      }}>
        <HistoryIcon sx={{ color: '#1976d2' }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Point History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {pointName}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading history...</Typography>
          </Box>
        ) : history.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No history available for this point.
            </Typography>
          </Box>
        ) : (
          <Timeline position="alternate">
            {history.map((item, index) => (
              <TimelineItem key={index}>
                <TimelineOppositeContent
                  sx={{ m: 'auto 0' }}
                  align={index % 2 === 0 ? 'right' : 'left'}
                  variant="body2"
                  color="text.secondary"
                >
                  {formatDate(item.meeting_date)}
                </TimelineOppositeContent>
                
                <TimelineSeparator>
                  <TimelineConnector sx={{ bgcolor: index === history.length - 1 ? '#1976d2' : 'grey.400' }} />
                  <TimelineDot 
                    color={index === history.length - 1 ? 'primary' : 'grey'}
                    variant={index === history.length - 1 ? 'filled' : 'outlined'}
                  >
                    <AssignmentIcon fontSize="small" />
                  </TimelineDot>
                  <TimelineConnector sx={{ bgcolor: 'grey.400' }} />
                </TimelineSeparator>
                
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      backgroundColor: index === history.length - 1 ? '#e3f2fd' : 'white',
                      border: index === history.length - 1 ? '2px solid #1976d2' : 'none'
                    }}
                  >
                    {/* Meeting Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <EventIcon fontSize="small" color="primary" />
                      <Typography variant="h6" component="span" fontWeight="bold">
                        {item.meeting_name}
                      </Typography>
                      {index === history.length - 1 && (
                        <Chip label="Current" size="small" color="primary" />
                      )}
                    </Box>

                    {/* Template Name (if available) */}
                    {item.template_name && (
                      <Box sx={{ mb: 1 }}>
                        <Chip 
                          label={`Template: ${item.template_name}`} 
                          size="small" 
                          variant="outlined"
                          color="info"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      </Box>
                    )}

                    {/* Meeting Date & Time */}
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      {formatDateTime(item.meeting_date)}
                      {item.meeting_end_time && ` - ${format(new Date(item.meeting_end_time), 'p')}`}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    {/* Creator */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>Meeting Creator:</strong> {item.meeting_creator || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Assigned Member */}
                    {item.responsible_user && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <PersonIcon fontSize="small" color="secondary" />
                        <Typography variant="body2">
                          <strong>Assigned to:</strong> {item.responsible_user}
                        </Typography>
                      </Box>
                    )}

                    {/* Deadline */}
                    {item.deadline && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Deadline:</strong> {formatDate(item.deadline)}
                      </Typography>
                    )}

                    {/* Status */}
                    {item.point_status && (
                      <Box sx={{ mb: 1 }}>
                        <Chip
                          label={item.point_status}
                          size="small"
                          color={getStatusColor(item.point_status)}
                        />
                      </Box>
                    )}

                    {/* Todo */}
                    {item.todo && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Todo:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          backgroundColor: '#f5f5f5', 
                          p: 1, 
                          borderRadius: '4px',
                          mt: 0.5 
                        }}>
                          {item.todo}
                        </Typography>
                      </Box>
                    )}

                    {/* Member Remarks */}
                    {item.remarks && (
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CommentIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            <strong>Remarks:</strong>
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ 
                          backgroundColor: '#fff3e0', 
                          p: 1, 
                          borderRadius: '4px',
                          mt: 0.5 
                        }}>
                          {item.remarks}
                        </Typography>
                      </Box>
                    )}

                    {/* Admin Remarks */}
                    {item.admin_remarks && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Admin Remarks:</strong>
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          backgroundColor: '#e8f5e9', 
                          p: 1, 
                          borderRadius: '4px',
                          mt: 0.5 
                        }}>
                          {item.admin_remarks}
                        </Typography>
                      </Box>
                    )}

                    {/* Admin Approval Status */}
                    {item.approved_by_admin && (
                      <Box sx={{ mb: 1 }}>
                        <Chip
                          label={`Admin: ${item.approved_by_admin}`}
                          size="small"
                          color={getStatusColor(item.approved_by_admin)}
                        />
                      </Box>
                    )}

                    {/* Forward Info */}
                    {item.forward_decision && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #ccc' }}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Forward Decision:</strong> {item.forward_decision}
                          {item.forward_type && ` (${item.forward_type})`}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PointHistoryModal;
