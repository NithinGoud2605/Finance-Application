import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  useTheme,
  Tooltip,
  Divider,
  ListItemIcon,
  LinearProgress,
  Tabs,
  Tab,
  Badge,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useUser } from '../../hooks/useUser';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import {
  getTeamMembers,
  inviteTeamMember,
  updateMemberRole,
  removeTeamMember,
  getRoles,
  getTeamAnalytics,
  updateMemberPermissions,
  getMemberPerformance,
} from '../../services/api';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

const MotionCard = motion(Card);

const ROLE_COLORS = {
  ADMIN: 'error',
  MANAGER: 'warning',
  MEMBER: 'success',
  VIEWER: 'info',
};

const ROLE_ICONS = {
  ADMIN: <AdminPanelSettingsIcon />,
  MANAGER: <VerifiedUserIcon />,
  MEMBER: <GroupIcon />,
  VIEWER: <VisibilityIcon />,
};

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '20px 0' }}>
      {value === index && children}
    </div>
  );
}

export default function TeamManagement() {
  const theme = useTheme();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'MEMBER',
    firstName: '',
    lastName: '',
  });

  const [permissionsForm, setPermissionsForm] = useState({
    canManageTeam: false,
    canManageProjects: false,
    canManageClients: false,
    canManageDocuments: false,
    canViewAnalytics: false,
    canManageBilling: false,
  });

  // Queries
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: getTeamMembers,
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: getRoles,
  });

  const { data: teamAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['team-analytics'],
    queryFn: getTeamAnalytics,
  });

  const { data: memberPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['member-performance', selectedMember?.id],
    queryFn: () => getMemberPerformance(selectedMember?.id),
    enabled: !!selectedMember,
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: inviteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members']);
      setInviteDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Invitation sent successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to send invitation',
        severity: 'error',
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateMemberRole,
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members']);
      setSnackbar({
        open: true,
        message: 'Role updated successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update role',
        severity: 'error',
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: updateMemberPermissions,
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members']);
      setPermissionsDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Permissions updated successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update permissions',
        severity: 'error',
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries(['team-members']);
      setSnackbar({
        open: true,
        message: 'Member removed successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to remove member',
        severity: 'error',
      });
    },
  });

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    inviteMutation.mutate(inviteForm);
  };

  const handleRoleUpdate = (memberId, newRole) => {
    updateRoleMutation.mutate({ memberId, role: newRole });
  };

  const handlePermissionsUpdate = () => {
    if (selectedMember) {
      updatePermissionsMutation.mutate({
        memberId: selectedMember.id,
        ...permissionsForm,
      });
    }
  };

  const handleRemoveMember = (memberId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      removeMemberMutation.mutate(memberId);
    }
  };

  const handleOpenPermissions = (member) => {
    setSelectedMember(member);
    setPermissionsForm({
      canManageTeam: member.permissions?.canManageTeam || false,
      canManageProjects: member.permissions?.canManageProjects || false,
      canManageClients: member.permissions?.canManageClients || false,
      canManageDocuments: member.permissions?.canManageDocuments || false,
      canViewAnalytics: member.permissions?.canViewAnalytics || false,
      canManageBilling: member.permissions?.canManageBilling || false,
    });
    setPermissionsDialogOpen(true);
  };

  if (membersLoading || rolesLoading || analyticsLoading) {
    return <LoadingSpinner message="Loading team data..." />;
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Team Management</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite Member
        </Button>
      </Stack>

      {/* Team Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <GroupIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Total Members
                  </Typography>
                  <Typography variant="h3">
                    {teamMembers?.length || 0}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={12} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <VerifiedUserIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Active Members
                  </Typography>
                  <Typography variant="h3">
                    {teamMembers?.filter(m => m.status === 'ACTIVE').length || 0}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={12} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PersonAddIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Pending Invites
                  </Typography>
                  <Typography variant="h3">
                    {teamMembers?.filter(m => m.status === 'PENDING').length || 0}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={12} md={3}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AssignmentIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Active Projects
                  </Typography>
                  <Typography variant="h3">
                    {teamAnalytics?.activeProjects || 0}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Team Analytics */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        sx={{ mb: 4 }}
      >
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <BarChartIcon color="primary" />
            <Typography variant="h6">Team Analytics</Typography>
          </Stack>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Project Completion Rate
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={teamAnalytics?.projectCompletionRate || 0}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {teamAnalytics?.projectCompletionRate || 0}% of projects completed on time
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Team Activity
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {teamAnalytics?.completedTasks || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed Tasks
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {teamAnalytics?.pendingTasks || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Tasks
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Team Performance
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {teamAnalytics?.highPerformers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      High Performers
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="h4" color="warning.main">
                      {teamAnalytics?.needsImprovement || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Needs Improvement
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </MotionCard>

      {/* Team Members Table */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab icon={<GroupIcon />} label="All Members" />
            <Tab icon={<StarIcon />} label="High Performers" />
            <Tab icon={<TimelineIcon />} label="Performance" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Performance</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamMembers?.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar src={member.avatar} />
                          <Box>
                            <Typography variant="subtitle2">
                              {member.firstName} {member.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {member.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small">
                          <Select
                            value={member.role}
                            onChange={(e) => handleRoleUpdate(member.id, e.target.value)}
                            disabled={member.id === user.id}
                            startAdornment={
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                {ROLE_ICONS[member.role]}
                              </ListItemIcon>
                            }
                          >
                            {roles?.map((role) => (
                              <MenuItem key={role.id} value={role.id}>
                                <ListItemIcon>
                                  {ROLE_ICONS[role.id]}
                                </ListItemIcon>
                                {role.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.status}
                          color={member.status === 'ACTIVE' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {member.performance === 'HIGH' ? (
                            <CheckCircleIcon color="success" />
                          ) : member.performance === 'MEDIUM' ? (
                            <WarningIcon color="warning" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                          <Typography variant="body2">
                            {member.performance || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit Permissions">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPermissions(member)}
                            >
                              <SecurityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove Member">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={member.id === user.id}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send Email">
                            <IconButton size="small">
                              <EmailIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Performance Metrics</TableCell>
                    <TableCell>Recent Achievements</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamMembers
                    ?.filter(m => m.performance === 'HIGH')
                    .map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar src={member.avatar} />
                            <Box>
                              <Typography variant="subtitle2">
                                {member.firstName} {member.lastName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {member.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={member.role}
                            color={ROLE_COLORS[member.role]}
                            size="small"
                            icon={ROLE_ICONS[member.role]}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={1}>
                            <Typography variant="body2">
                              Tasks Completed: {member.metrics?.completedTasks || 0}
                            </Typography>
                            <Typography variant="body2">
                              On-time Delivery: {member.metrics?.onTimeDelivery || 0}%
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={1}>
                            {member.achievements?.map((achievement, index) => (
                              <Chip
                                key={index}
                                label={achievement}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Details">
                              <IconButton size="small">
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Send Recognition">
                              <IconButton size="small">
                                <StarIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Performance Score</TableCell>
                    <TableCell>Areas of Improvement</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamMembers?.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar src={member.avatar} />
                          <Box>
                            <Typography variant="subtitle2">
                              {member.firstName} {member.lastName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {member.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.role}
                          color={ROLE_COLORS[member.role]}
                          size="small"
                          icon={ROLE_ICONS[member.role]}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={member.performanceScore || 0}
                            color={
                              member.performanceScore >= 80
                                ? 'success'
                                : member.performanceScore >= 60
                                ? 'warning'
                                : 'error'
                            }
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                          <Typography variant="body2" color="text.secondary" mt={1}>
                            {member.performanceScore || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={1}>
                          {member.improvementAreas?.map((area, index) => (
                            <Chip
                              key={index}
                              label={area}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Provide Feedback">
                            <IconButton size="small">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </MotionCard>

      {/* Invite Member Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonAddIcon />
            <Typography variant="h6">Invite Team Member</Typography>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleInviteSubmit}>
          <DialogContent>
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    required
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                required
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  label="Role"
                  startAdornment={
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {ROLE_ICONS[inviteForm.role]}
                    </ListItemIcon>
                  }
                >
                  {roles?.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <ListItemIcon>
                        {ROLE_ICONS[role.id]}
                      </ListItemIcon>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={inviteMutation.isLoading}
            >
              Send Invitation
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog
        open={permissionsDialogOpen}
        onClose={() => setPermissionsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SecurityIcon />
            <Typography variant="h6">Member Permissions</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={permissionsForm.canManageTeam}
                  onChange={(e) => setPermissionsForm({
                    ...permissionsForm,
                    canManageTeam: e.target.checked,
                  })}
                />
              }
              label="Manage Team"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={permissionsForm.canManageProjects}
                  onChange={(e) => setPermissionsForm({
                    ...permissionsForm,
                    canManageProjects: e.target.checked,
                  })}
                />
              }
              label="Manage Projects"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={permissionsForm.canManageClients}
                  onChange={(e) => setPermissionsForm({
                    ...permissionsForm,
                    canManageClients: e.target.checked,
                  })}
                />
              }
              label="Manage Clients"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={permissionsForm.canManageDocuments}
                  onChange={(e) => setPermissionsForm({
                    ...permissionsForm,
                    canManageDocuments: e.target.checked,
                  })}
                />
              }
              label="Manage Documents"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={permissionsForm.canViewAnalytics}
                  onChange={(e) => setPermissionsForm({
                    ...permissionsForm,
                    canViewAnalytics: e.target.checked,
                  })}
                />
              }
              label="View Analytics"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={permissionsForm.canManageBilling}
                  onChange={(e) => setPermissionsForm({
                    ...permissionsForm,
                    canManageBilling: e.target.checked,
                  })}
                />
              }
              label="Manage Billing"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePermissionsUpdate}
            disabled={updatePermissionsMutation.isLoading}
          >
            Update Permissions
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 