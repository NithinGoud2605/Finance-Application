import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Chip, Paper, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Stack, Grid, Divider
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useOrganization } from '../../contexts/OrganizationContext';
import {
  getOrganizationMembers,
  inviteMember,
  removeMember,
  getPendingInvitations,
  cancelInvitation
} from '../../services/organizationService';

export default function TeamManagement() {
  const { currentOrg } = useOrganization();

  /* guard: should never render without an org */
  if (!currentOrg) return null;

  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'MEMBER',
    department: '',
    position: ''
  });
  const isOwner = currentOrg.role === 'OWNER';
  const canInvite = ['ADMIN', 'OWNER', 'MANAGER'].includes(currentOrg.role);

  // Available roles for invitation
  const availableRoles = [
    { value: 'MEMBER', label: 'Member', description: 'Basic access to organization features' },
    { value: 'MANAGER', label: 'Manager', description: 'Can manage team members and projects' },
    { value: 'ADMIN', label: 'Admin', description: 'Full access except subscription management' }
  ];

  /* fetch members once org changes */
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching members for organization ID:', currentOrg.id);
        const response = await getOrganizationMembers(currentOrg.id);
        console.log('API Response:', response);
        
        // Handle different response formats
        let membersList = [];
        if (Array.isArray(response)) {
          membersList = response;
        } else if (response.members && Array.isArray(response.members)) {
          membersList = response.members;
        } else if (response.data && Array.isArray(response.data)) {
          membersList = response.data;
        } else if (typeof response === 'object') {
          setError('Unexpected API response format');
          membersList = [];
        } else {
          console.error('Unknown response format:', typeof response);
          setError('Unknown API response format');
          membersList = [];
        }
        
        setMembers(membersList);
        
        // Also fetch pending invitations
        const invitationsResponse = await getPendingInvitations(currentOrg.id);
        setPendingInvitations(invitationsResponse.invitations || []);
      } catch (err) {
        console.error('Failed to load members', err);
        setError(err?.message || 'Failed to load team members');
        setMembers([]);
        setPendingInvitations([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [currentOrg.id]);

  const handleOpenInviteDialog = () => {
    setInviteForm({
      email: '',
      role: 'MEMBER',
      department: '',
      position: ''
    });
    setInviteDialogOpen(true);
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteForm({
      email: '',
      role: 'MEMBER',
      department: '',
      position: ''
    });
  };

  const handleInviteFormChange = (field, value) => {
    setInviteForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInviteSubmit = async () => {
    if (!inviteForm.email.trim()) {
      alert('Email is required');
      return;
    }

    setInviteLoading(true);
    try {
      await inviteMember(currentOrg.id, {
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        department: inviteForm.department.trim() || undefined,
        position: inviteForm.position.trim() || undefined
      });
      
      await refresh(); // refresh member list
      handleCloseInviteDialog();
      alert('Invitation sent successfully!');
    } catch (err) {
      console.error('Invite error:', err);
      alert(err?.response?.data?.error || err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await removeMember(currentOrg.id, userId);
      setMembers(members.filter(m => m.userId !== userId));
    } catch (err) {
      alert(err?.response?.data?.error || err.message);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!window.confirm('Cancel this invitation?')) return;
    try {
      await cancelInvitation(currentOrg.id, invitationId);
      setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId));
      alert('Invitation cancelled successfully');
    } catch (err) {
      alert(err?.response?.data?.error || err.message || 'Failed to cancel invitation');
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await getOrganizationMembers(currentOrg.id);
      console.log('Refresh response:', list);
      // Ensure list is an array
      setMembers(Array.isArray(list.members) ? list.members : Array.isArray(list) ? list : []);
      
      // Also refresh pending invitations
      const invitationsResponse = await getPendingInvitations(currentOrg.id);
      setPendingInvitations(invitationsResponse.invitations || []);
    } catch (err) {
      console.error('Failed to refresh members', err);
      setMembers([]);
      setPendingInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display:'flex', justifyContent:'center', mt:4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Group members by role
  const roleOrder = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'];
  const membersByRole = {};
  
  // Initialize empty arrays for each role
  roleOrder.forEach(role => {
    membersByRole[role] = [];
  });
  
  // Group members by their roles
  if (Array.isArray(members)) {
    members.forEach(member => {
      const role = member.role || 'MEMBER'; // Default to MEMBER if role is missing
      if (membersByRole[role]) {
        membersByRole[role].push(member);
      } else {
        membersByRole[role] = [member]; // Handle any roles not in roleOrder
      }
    });
  }

  return (
    <Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', mb:3 }}>
        <Typography variant="h5">Team Members</Typography>
        {canInvite && (
          <Button 
            variant="contained" 
            startIcon={<PersonAddIcon />}
            onClick={handleOpenInviteDialog}
          >
            Invite Member
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {Array.isArray(members) && members.length > 0 ? (
        roleOrder.map(role => {
          const roleMembers = membersByRole[role] || [];
          
          if (roleMembers.length === 0) return null;
          
          return (
            <Paper key={role} sx={{ mb: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                <Typography variant="h6">{role} ({roleMembers.length})</Typography>
              </Box>
              
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    {isOwner && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roleMembers.map(m => {
                    const email = m.email || m.user?.email || '—';
                    
                    return (
                      <TableRow key={m.userId || m.id}>
                        <TableCell>{email}</TableCell>
                        <TableCell>
                          <Chip size="small" label={m.role} color={
                            m.role === 'OWNER' ? 'primary' : 
                            m.role === 'ADMIN' ? 'secondary' : 
                            m.role === 'MANAGER' ? 'info' : 'default'
                          } />
                        </TableCell>
                        {isOwner && (
                          <TableCell>
                            {m.role !== 'OWNER' && (
                              <Button color="error" size="small" onClick={() => handleRemove(m.userId)}>
                                Remove
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          );
        })
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No team members found</Typography>
          <Typography variant="body2" color="text.secondary">
            Invite members to your organization to get started.
          </Typography>
        </Paper>
      )}

      {/* Pending Invitations Section */}
      {pendingInvitations && pendingInvitations.length > 0 && (
        <Paper sx={{ mt: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <Typography variant="h6">Pending Invitations ({pendingInvitations.length})</Typography>
          </Box>
          
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Invited</TableCell>
                <TableCell>Expires</TableCell>
                {canInvite && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingInvitations.map(invitation => {
                const expiryDate = new Date(invitation.invitationExpiry);
                const isExpiringSoon = expiryDate - new Date() < 24 * 60 * 60 * 1000; // Less than 24 hours
                
                return (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Chip size="small" label={invitation.role} color={
                        invitation.role === 'OWNER' ? 'primary' : 
                        invitation.role === 'ADMIN' ? 'secondary' : 
                        invitation.role === 'MANAGER' ? 'info' : 'default'
                      } />
                    </TableCell>
                    <TableCell>{invitation.department || '—'}</TableCell>
                    <TableCell>{invitation.position || '—'}</TableCell>
                    <TableCell>
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small" 
                        label={expiryDate.toLocaleDateString()} 
                        color={isExpiringSoon ? 'warning' : 'default'}
                      />
                    </TableCell>
                    {canInvite && (
                      <TableCell>
                        <Button 
                          color="error" 
                          size="small" 
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Invite Member Dialog */}
      <Dialog 
        open={inviteDialogOpen} 
        onClose={handleCloseInviteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonAddIcon />
            <Typography variant="h6">Invite Team Member</Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Email Field */}
            <TextField
              label="Email Address"
              type="email"
              value={inviteForm.email}
              onChange={(e) => handleInviteFormChange('email', e.target.value)}
              fullWidth
              required
              helperText="Enter the email address of the person you want to invite"
            />

            {/* Role Selection */}
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteForm.role}
                onChange={(e) => handleInviteFormChange('role', e.target.value)}
                label="Role"
              >
                {availableRoles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    <Box>
                      <Typography variant="body1">{role.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {role.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider />

            {/* Optional Fields */}
            <Typography variant="subtitle2" color="text.secondary">
              Optional Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Department"
                  value={inviteForm.department}
                  onChange={(e) => handleInviteFormChange('department', e.target.value)}
                  fullWidth
                  helperText="e.g., Engineering, Marketing"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Position"
                  value={inviteForm.position}
                  onChange={(e) => handleInviteFormChange('position', e.target.value)}
                  fullWidth
                  helperText="e.g., Senior Developer, Designer"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleCloseInviteDialog}
            disabled={inviteLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleInviteSubmit}
            variant="contained"
            disabled={inviteLoading || !inviteForm.email.trim()}
            startIcon={inviteLoading ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {inviteLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
