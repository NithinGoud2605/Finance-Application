import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUser } from '../hooks/useUser';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

export default function ApiKeys() {
  const { user, loading, error } = useUser();
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  useEffect(() => {
    // TODO: Implement API key fetching
    setLoadingKeys(false);
  }, []);

  const handleCreateKey = () => {
    // TODO: Implement API key creation
    setOpenCreateDialog(false);
    setNewKeyName('');
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    // TODO: Show success toast
  };

  const handleDeleteKey = (keyId) => {
    // TODO: Implement API key deletion
  };

  if (loading) {
    return <LoadingSpinner message="Loading API keys..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">API Keys</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => setOpenCreateDialog(true)}
        >
          Create New API Key
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>API Key</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingKeys ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <LoadingSpinner message="Loading API keys..." />
                    </TableCell>
                  </TableRow>
                ) : apiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography>No API keys found. Create one to get started!</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {key.value.slice(0, 10)}...
                          <IconButton
                            size="small"
                            onClick={() => handleCopyKey(key.value)}
                            title="Copy API key"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteKey(key.id)}
                          title="Delete API key"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="API Key Name"
            fullWidth
            variant="outlined"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateKey} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}