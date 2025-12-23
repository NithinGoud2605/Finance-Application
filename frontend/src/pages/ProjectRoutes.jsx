import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Button,
  alpha, 
  Stack,
  Chip 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EngineeringIcon from '@mui/icons-material/Engineering';
import ComingSoonIcon from '@mui/icons-material/Upcoming';
import { motion } from 'framer-motion';

// Styled components
const FeatureBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: alpha(theme.palette.primary.light, 0.9),
  boxShadow: theme.shadows[2],
  overflow: 'hidden',
  position: 'relative',
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.8),
  borderRadius: '50%',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  '& svg': {
    fontSize: 48,
    color: theme.palette.primary.dark,
  },
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 12,
      stiffness: 100,
    },
  },
};

// Projects Coming Soon Component
const ProjectsComingSoon = () => {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Typography 
            variant="h4" 
            component="h1" 
            align="center" 
            gutterBottom
            sx={{ mb: 3, fontWeight: 600 }}
          >
            Projects Management
            <Chip 
              label="Coming Soon" 
              color="secondary" 
              size="small" 
              icon={<ComingSoonIcon fontSize="small" />}
              sx={{ ml: 2, fontWeight: 'bold' }}
            />
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography 
            variant="body1" 
            color="textSecondary" 
            align="center" 
            sx={{ mb: 5, maxWidth: '700px', mx: 'auto' }}
          >
            We're working hard to bring you a powerful project management experience. 
            Soon you'll be able to create and manage projects, assign tasks, track progress, 
            and integrate with your existing workflows.
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <FeatureBox>
            <IconWrapper>
              <EngineeringIcon />
            </IconWrapper>
            
            <Typography variant="h5" component="h2" gutterBottom align="center" fontWeight={600}>
              Exciting Features Coming Your Way
            </Typography>
            
            <Stack spacing={2} sx={{ width: '100%', maxWidth: '500px', mt: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={500}>Project Management</Typography>
                <Typography variant="body2" color="textSecondary">
                  Create, organize, and track your projects with intuitive tools
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={500}>Task Assignment</Typography>
                <Typography variant="body2" color="textSecondary">
                  Delegate tasks to team members and track progress in real-time
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={500}>Timeline & Reporting</Typography>
                <Typography variant="body2" color="textSecondary">
                  Visualize project timelines and generate comprehensive reports
                </Typography>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={500}>Integration</Typography>
                <Typography variant="body2" color="textSecondary">
                  Seamless integration with invoices, expenses, and third-party tools
                </Typography>
              </Paper>
            </Stack>
            
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 4 }}
              disabled
            >
              Join Waiting List
            </Button>
          </FeatureBox>
        </motion.div>
      </motion.div>
    </Container>
  );
};

// Route configuration
const ProjectRoutes = () => {
  return (
    <Routes>
      <Route index element={<ProjectsComingSoon />} />
      <Route path="*" element={<ProjectsComingSoon />} />
    </Routes>
  );
};

export default ProjectRoutes; 