import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useUser } from '../hooks/useUser';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { getOrganizationMembers, inviteMember } from '../services/api';

export default function TeamManagement() {
  const { user, loading, error } = useUser();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const organizationId = localStorage.getItem('organizationId');
        if (!organizationId) {
          setLoadingMembers(false);
          return;
        }
        const data = await getOrganizationMembers(organizationId);
        setTeamMembers(data.members || []);
      } catch (err) {
        console.error('Error fetching team members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchTeamMembers();
  }, []);

  const handleInvite = async () => {
    try {
      const organizationId = localStorage.getItem('organizationId');
      if (!organizationId) return;
      await inviteMember(organizationId, { email: inviteEmail, role: inviteRole });
      // Refresh the team members list
      const data = await getOrganizationMembers(organizationId);
      setTeamMembers(data.members || []);
      // Close dialog and reset form
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
    } catch (err) {
      console.error('Error inviting team member:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading team management..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Team Management</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite Team Member
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingMembers ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <LoadingSpinner message="Loading team members..." />
                        </TableCell>
                      </TableRow>
                    ) : teamMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography>No team members found. Invite someone to get started!</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      teamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>{member.name}</TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>{member.role}</TableCell>
                          <TableCell>{member.status}</TableCell>
                          <TableCell>
                            <Button size="small" color="error">Remove</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)}>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Email Address"
              type="email"
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                <MenuItem value="MEMBER">Member</MenuItem>
                <MenuItem value="VIEWER">Viewer</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInvite} variant="contained" color="primary">
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}