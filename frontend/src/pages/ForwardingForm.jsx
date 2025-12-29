import React, { useEffect, useState } from "react";
import {
  Box, Button, Card, Radio, RadioGroup, FormControlLabel, TextField,
  Typography, IconButton, Divider
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CancelIcon from '@mui/icons-material/Cancel';
import FastForwardIcon from '@mui/icons-material/FastForward';
import OfflinePinIcon from '@mui/icons-material/OfflinePin';
import axios from "axios";
import { Autocomplete } from "@mui/material";
import api from "../utils/apiClient"

const ForwardingForm = ({ onClose, selectedAction: initialAction, remarks, pointId, selectedPoint, handleChangeStatus, submitPoints }) => {
  const [selectedOption, setSelectedOption] = useState("NIL");
  const [selectedAction, setSelectedAction] = useState(initialAction || "DISAGREE");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    api.get('/api/templates/').then((response) => { setTemplates(response.data) });
  }, [])

  const handleActionClick = (action) => {
    submitPoints()
    setSelectedAction(action);
  };

  async function ForwardPoint(pointId, templateId, forwardType, forwardDecision, adminRemarks) {
    const token = localStorage.getItem('token');
    // console.log(token)
    // console.log({
    //   pointId,
    //   templateId,
    //   forwardType,
    //   forwardDecision,
    //   adminRemarks
    // })
    // console.log(forwardDecision)
    if (forwardType != 'SPECIFIC_MEETING') {
      templateId = null;
    }


    try {
      await api.post('/api/meetings/forward-point', {
        pointId,
        templateId,
        forwardType,
        forwardDecision
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });


      // console.log({
      //   pointId,
      //   templateId,
      //   forwardType,
      //   forwardDecision
      // })

      await api.post('/api/meetings/add-admin-remarks/', {
        pointId,
        adminRemarks
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // console.log(selectedPoint.DecisionIndex, selectedAction)
      // console.log(selectedPoint.SubPointIndex)
      if (selectedPoint.SubPointIndex !== undefined && selectedPoint.SubPointIndex !== null) {
        handleChangeStatus(selectedPoint.DecisionIndex, selectedAction, true, selectedPoint.SubPointIndex);
      } else {
        handleChangeStatus(selectedPoint.DecisionIndex, selectedAction);
      }


      onClose()

    } catch (err) {
      console.error('Failed to forward point:', err.response?.data?.message || err.message);
    }
  }
  return (
    <Card sx={{ width: '100%', p: 4, borderRadius: 3, boxShadow: 3 }}>
      {/* Warning message if no remarks */}
      {(!remarks || remarks.trim() === '') && (
        <Box 
          sx={{ 
            mb: 3, 
            p: 2, 
            backgroundColor: '#FFF3E0', 
            borderRadius: 2,
            borderLeft: '4px solid #FF9800'
          }}
        >
          <Typography variant="body2" color="#E65100" sx={{ fontWeight: 'bold' }}>
            ⚠️ Please add admin remarks before making a decision
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Admin remarks are required to proceed with any decision (AGREE, DISAGREE, or FORWARD).
          </Typography>
        </Box>
      )}
      
      {/* Header Section */}
      <Box display="flex" alignItems="center">
        <Button
          variant="outlined"
          sx={{
            width: "35%",
            color: selectedAction === "DISAGREE" ? '#FB3748' : '#6E6E6E',
            borderColor: selectedAction === "DISAGREE" ? '#FB3748' : 'transparent',
            backgroundColor: selectedAction === "DISAGREE" ? '#FB37481A' : 'transparent',
            textTransform: 'none',
            opacity: (!remarks || remarks.trim() === '') ? 0.5 : 1,
          }}
          startIcon={<CancelIcon />}
          onClick={() => handleActionClick("DISAGREE")}
          disabled={!remarks || remarks.trim() === ''}
          title={(!remarks || remarks.trim() === '') ? "Add admin remarks before selecting this option" : ""}
        >
          DISAGREE
        </Button>
        {selectedAction !== "DISAGREE" && selectedAction !== "FORWARD" && (
          <Divider orientation="vertical" flexItem sx={{ backgroundColor: 'black' }} />
        )}
        <Button
          variant="outlined"
          sx={{
            width: "35%",
            color: selectedAction === "FORWARD" ? '#000000' : '#6E6E6E',
            borderColor: selectedAction === "FORWARD" ? '#000000' : 'transparent',
            backgroundColor: selectedAction === "FORWARD" ? '#D8DEE2' : 'transparent',
            textTransform: 'none',
            opacity: (!remarks || remarks.trim() === '') ? 0.5 : 1,
          }}
          startIcon={<FastForwardIcon />}
          onClick={() => handleActionClick("FORWARD")}
          disabled={!remarks || remarks.trim() === ''}
          title={(!remarks || remarks.trim() === '') ? "Add admin remarks before selecting this option" : ""}
        >
          FORWARD
        </Button>
        {selectedAction !== "FORWARD" && selectedAction !== "AGREE" && (
          <Divider orientation="vertical" flexItem sx={{ backgroundColor: 'black' }} />
        )}
        <Button
          variant="outlined"
          sx={{
            width: "35%",
            color: selectedAction === "AGREE" ? '#1FC16B' : '#6E6E6E',
            borderColor: selectedAction === "AGREE" ? '#1FC16B' : 'transparent',
            backgroundColor: selectedAction === "AGREE" ? '#1FC16B1A' : 'transparent',
            textTransform: 'none',
            opacity: (!remarks || remarks.trim() === '') ? 0.5 : 1,
          }}
          startIcon={<OfflinePinIcon />}
          onClick={() => handleActionClick("AGREE")}
          disabled={!remarks || remarks.trim() === ''}
          title={(!remarks || remarks.trim() === '') ? "Add admin remarks before selecting this option" : ""}
        >
          AGREE
        </Button>
        <IconButton
          sx={{
            border: "2px solid #FB3748",
            borderRadius: "50%",
            p: "2px",
            ml: '30px',
            "&:hover": { backgroundColor: "transparent" },
          }}
          onClick={onClose}
        >
          <CloseIcon sx={{ fontSize: "10px", color: "#FB3748" }} />
        </IconButton>
      </Box>

      {/* Forward To Section */}
      <Typography sx={{ fontWeight: "bold", mt: '30px', mb: '10px' }}>Forward to</Typography>

      <RadioGroup value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
        {selectedAction !== "FORWARD" && (
          <Box mb={2}>
            <FormControlLabel value="NIL" control={<Radio />} label="NIL" />
          </Box>
        )}
        <Box mb={2}>
          <FormControlLabel value="NEXT" control={<Radio />} label="NEXT" />
        </Box>
        <Box mb={2}>
          <FormControlLabel
            value="SPECIFIC_MEETING"
            control={<Radio />}
            label={
              <Box display="flex" alignItems="center" gap={1}>
                SPECIFIC MEETING
                <Autocomplete
                  disabled={selectedOption !== "SPECIFIC_MEETING"}
                  options={templates}
                  getOptionLabel={(option) => option.name || ""}
                  sx={{ width: 400, marginLeft: '50px' }}
                  size="small"
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select meeting" variant="outlined" />
                  )}
                  onChange={(event, value) => {
                    if (value) {
                      setSelectedTemplate(value.id)
                      // console.log("Selected Template ID:", value.id);
                    }
                  }}
                />
              </Box>
            }
          />
        </Box>
      </RadioGroup>

      <Box display="flex" justifyContent="end" mt={4} gap={2}>
        <Button
          variant="outlined"
          sx={{
            borderColor: "red",
            color: "red",
            textTransform: "none",
            marginRight: "10px",
            width: "130px",
          }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#408FEA",
            color: "white",
            textTransform: "none",
            width: "130px",
          }}
          onClick={() => { ForwardPoint(pointId, selectedTemplate, selectedOption, selectedAction, remarks); }}
        >
          Save & Next
        </Button>
      </Box>
    </Card>
  );
};

export default ForwardingForm;
