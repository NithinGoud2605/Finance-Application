import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  TextField,
  useTheme
} from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { useContractContext } from '../contexts/ContractContext';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import TaskIcon from '@mui/icons-material/Task';
import FlagIcon from '@mui/icons-material/Flag';
import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining';
import RemoveIcon from '@mui/icons-material/Remove';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import InventoryIcon from '@mui/icons-material/Inventory';

const ObjectivesAndDeliverables = () => {
  const { watch, setValue } = useFormContext();
  const { updateContractFormData } = useContractContext();
  const theme = useTheme();

  const [newObjective, setNewObjective] = useState('');
  const [newDeliverable, setNewDeliverable] = useState('');
  const [newMilestone, setNewMilestone] = useState({ title: '', dueDate: '', description: '' });

  const objectives = watch('objectives') || [];
  const deliverables = watch('deliverables') || [];
  const milestones = watch('milestones') || [];

  const scopeData = { objectives, deliverables, milestones };

  useEffect(() => {
    updateContractFormData({ 
      objectives,
      deliverables,
      milestones
    });
  }, [objectives, deliverables, milestones, updateContractFormData]);

  const addObjective = () => {
    const updatedObjectives = [...objectives, ''];
    setValue('objectives', updatedObjectives);
  };

  const removeObjective = (index) => {
    const updatedObjectives = objectives.filter((_, i) => i !== index);
    setValue('objectives', updatedObjectives);
  };

  const addDeliverable = () => {
    const updatedDeliverables = [...deliverables, ''];
    setValue('deliverables', updatedDeliverables);
  };

  const removeDeliverable = (index) => {
    const updatedDeliverables = deliverables.filter((_, i) => i !== index);
    setValue('deliverables', updatedDeliverables);
  };

  const addMilestone = () => {
    const updatedMilestones = [...milestones, ''];
    setValue('milestones', updatedMilestones);
  };

  const removeMilestone = (index) => {
    const updatedMilestones = milestones.filter((_, i) => i !== index);
    setValue('milestones', updatedMilestones);
  };

  const updateObjective = (index, value) => {
    const updatedObjectives = [...objectives];
    updatedObjectives[index] = value;
    setValue('objectives', updatedObjectives);
  };

  const updateDeliverable = (index, value) => {
    const updatedDeliverables = [...deliverables];
    updatedDeliverables[index] = value;
    setValue('deliverables', updatedDeliverables);
  };

  const updateMilestone = (index, value) => {
    const updatedMilestones = [...milestones];
    updatedMilestones[index] = value;
    setValue('milestones', updatedMilestones);
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        p: 2,
        bgcolor: theme.palette.success.light + '15',
        borderRadius: '12px',
        border: `1px solid ${theme.palette.success.light}`,
      }}>
        <TaskIcon sx={{ color: theme.palette.success.main, mr: 2, fontSize: '1.8rem' }} />
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              color: theme.palette.success.main,
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            Project Scope & Deliverables
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary,
              mt: 0.5,
              fontSize: '0.85rem'
            }}
          >
            Define project objectives, deliverables, and key milestones for the contract
          </Typography>
        </Box>
      </Box>

      {/* Objectives Section */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrackChangesIcon fontSize="small" color="primary" />
            Objectives
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addObjective}
            size="small"
            variant="outlined"
            sx={{ 
              borderRadius: '6px',
              fontSize: '0.75rem',
              px: 1.5,
              py: 0.5,
              minHeight: 'auto',
            }}
          >
            Add
          </Button>
        </Box>

        {objectives.map((objective, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
            <TextField
              value={typeof objective === 'string' ? objective : objective.text || ''}
              onChange={(e) => updateObjective(index, e.target.value)}
              placeholder={`Objective ${index + 1}`}
              size="small"
              variant="outlined"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                },
              }}
            />
            <IconButton
              onClick={() => removeObjective(index)}
              size="small"
              color="error"
              sx={{ mt: 0.25 }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* Deliverables Section */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            <InventoryIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} /> Deliverables
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addDeliverable}
            size="small"
            variant="outlined"
            sx={{ 
              borderRadius: '6px',
              fontSize: '0.75rem',
              px: 1.5,
              py: 0.5,
              minHeight: 'auto',
            }}
          >
            Add
          </Button>
        </Box>

        {deliverables.map((deliverable, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
            <TextField
              value={typeof deliverable === 'string' ? deliverable : deliverable.text || ''}
              onChange={(e) => updateDeliverable(index, e.target.value)}
              placeholder={`Deliverable ${index + 1}`}
              size="small"
              variant="outlined"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                },
              }}
            />
            <IconButton
              onClick={() => removeDeliverable(index)}
              size="small"
              color="error"
              sx={{ mt: 0.25 }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* Milestones Section */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            🏁 Milestones
          </Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addMilestone}
            size="small"
            variant="outlined"
            sx={{ 
              borderRadius: '6px',
              fontSize: '0.75rem',
              px: 1.5,
              py: 0.5,
              minHeight: 'auto',
            }}
          >
            Add
          </Button>
        </Box>

        {milestones.map((milestone, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
            <TextField
              value={typeof milestone === 'string' ? milestone : milestone.title || ''}
              onChange={(e) => updateMilestone(index, e.target.value)}
              placeholder={`Milestone ${index + 1}`}
              size="small"
              variant="outlined"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                },
              }}
            />
            <IconButton
              onClick={() => removeMilestone(index)}
              size="small"
              color="error"
              sx={{ mt: 0.25 }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ObjectivesAndDeliverables; 