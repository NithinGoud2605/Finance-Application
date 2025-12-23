import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { useOrganization } from '../../contexts/OrganizationContext';
import { 
  getOrganizationMembers, 
  getOrganizationRoles, 
  inviteMember, 
  updateMember, 
  removeMember 
} from '../../services/organizationService';

const TeamManagement = () => {
  const { currentOrganization } = useOrganization();
  const [members, setMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [openInvite, setOpenInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      loadMembers();
      loadRoles();
    }
  }, [currentOrganization]);

  const loadMembers = async () => {
    try {
      const data = await getOrganizationMembers(currentOrganization.id);
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await getOrganizationRoles(currentOrganization.id);
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleInvite = async () => {
    setLoading(true);
    try {
      await inviteMember(currentOrganization.id, inviteForm);
      await loadMembers();
      setOpenInvite(false);
      setInviteForm({ email: '', role: '' });
    } catch (error) {
      console.error('Failed to invite member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await updateMember(currentOrganization.id, memberId, { role: newRole });
      await loadMembers();
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this team member?')) {
      try {
        await removeMember(currentOrganization.id, memberId);
        await loadMembers();
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Team Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setOpenInvite(true)}
        >
          Invite Member
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.email}</TableCell>
              <TableCell>
                <Select
                  value={member.role}
                  onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                  size="small"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.name}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>
              <TableCell>{member.status}</TableCell>
              <TableCell>
                <Button
                  color="error"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={openInvite} onClose={() => setOpenInvite(false)}>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                label="Role"
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.name}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInvite(false)}>Cancel</Button>
          <Button 
            onClick={handleInvite} 
            variant="contained" 
            disabled={loading || !inviteForm.email || !inviteForm.role}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamManagement;