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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
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
  Menu,
  MenuItem,
  ListItemText,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useUser } from '../../hooks/useUser';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import {
  getDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocumentVersions,
  shareDocument,
} from '../../services/api';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditNoteIcon from '@mui/icons-material/EditNote';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import ArchiveIcon from '@mui/icons-material/Archive';
import RestoreIcon from '@mui/icons-material/Restore';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const MotionCard = motion(Card);

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '20px 0' }}>
      {value === index && children}
    </div>
  );
}

export default function DocumentManagement() {
  const theme = useTheme();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedDocForMenu, setSelectedDocForMenu] = useState(null);

  // Form states
  const [documentForm, setDocumentForm] = useState({
    name: '',
    type: 'DOCUMENT',
    tags: [],
    description: '',
    file: null,
    folder: '',
    isPublic: false,
  });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [folderFilter, setFolderFilter] = useState('ALL');

  // Queries
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', searchQuery, typeFilter, dateFilter, folderFilter],
    queryFn: () => getDocuments({ search: searchQuery, type: typeFilter, date: dateFilter, folder: folderFilter }),
  });

  const { data: documentVersions, isLoading: versionsLoading } = useQuery({
    queryKey: ['document-versions', selectedDocument?.id],
    queryFn: () => getDocumentVersions(selectedDocument?.id),
    enabled: !!selectedDocument,
  });

  // Mutations
  const uploadDocumentMutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setUploadDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Document uploaded successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to upload document',
        severity: 'error',
      });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: updateDocument,
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setSnackbar({
        open: true,
        message: 'Document updated successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update document',
        severity: 'error',
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setSnackbar({
        open: true,
        message: 'Document deleted successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete document',
        severity: 'error',
      });
    },
  });

  const shareDocumentMutation = useMutation({
    mutationFn: shareDocument,
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Document shared successfully',
        severity: 'success',
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to share document',
        severity: 'error',
      });
    },
  });

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setDocumentForm({ ...documentForm, file });
    }
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', documentForm.file);
    formData.append('name', documentForm.name);
    formData.append('type', documentForm.type);
    formData.append('tags', JSON.stringify(documentForm.tags));
    formData.append('description', documentForm.description);
    formData.append('folder', documentForm.folder);
    formData.append('isPublic', documentForm.isPublic);

    uploadDocumentMutation.mutate(formData, {
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      },
    });
  };

  const handleDeleteDocument = (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const handleMenuOpen = (event, document) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedDocForMenu(document);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedDocForMenu(null);
  };

  const handleShareDocument = () => {
    if (selectedDocForMenu) {
      shareDocumentMutation.mutate(selectedDocForMenu.id);
    }
    handleMenuClose();
  };

  if (documentsLoading) {
    return <LoadingSpinner message="Loading documents..." />;
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Document Management</Typography>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Document
        </Button>
      </Stack>

      {/* Document Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <DescriptionIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Total Documents
                  </Typography>
                  <Typography variant="h3">
                    {documents?.length || 0}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CloudUploadIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Recent Uploads
                  </Typography>
                  <Typography variant="h3">
                    {documents?.filter(d => {
                      const uploadDate = new Date(d.uploadedAt);
                      const oneWeekAgo = new Date();
                      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                      return uploadDate >= oneWeekAgo;
                    }).length || 0}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <FolderIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Total Storage
                  </Typography>
                  <Typography variant="h3">
                    {documents?.reduce((acc, doc) => acc + (doc.size || 0), 0).toLocaleString()} KB
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        sx={{ mb: 3 }}
      >
        <CardContent>
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <TextField
              select
              label="Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="ALL">All Types</MenuItem>
              <MenuItem value="DOCUMENT">Documents</MenuItem>
              <MenuItem value="CONTRACT">Contracts</MenuItem>
              <MenuItem value="INVOICE">Invoices</MenuItem>
            </TextField>
            <TextField
              select
              label="Date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="ALL">All Time</MenuItem>
              <MenuItem value="TODAY">Today</MenuItem>
              <MenuItem value="WEEK">This Week</MenuItem>
              <MenuItem value="MONTH">This Month</MenuItem>
            </TextField>
            <TextField
              select
              label="Folder"
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="ALL">All Folders</MenuItem>
              <MenuItem value="CONTRACTS">Contracts</MenuItem>
              <MenuItem value="INVOICES">Invoices</MenuItem>
              <MenuItem value="REPORTS">Reports</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </MotionCard>

      {/* Document List */}
      <MotionCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents?.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <DescriptionIcon />
                        <Box>
                          <Typography variant="subtitle2">
                            {document.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {document.description}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={document.type}
                        color={
                          document.type === 'CONTRACT'
                            ? 'primary'
                            : document.type === 'INVOICE'
                            ? 'success'
                            : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {document.size?.toLocaleString()} KB
                    </TableCell>
                    <TableCell>
                      {new Date(document.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {document.tags?.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Share">
                          <IconButton size="small">
                            <ShareIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Version History">
                          <IconButton size="small">
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="More">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, document)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </MotionCard>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CloudUploadIcon />
            <Typography variant="h6">Upload Document</Typography>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleDocumentSubmit}>
          <DialogContent>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Document Name"
                value={documentForm.name}
                onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                required
              />
              <TextField
                select
                fullWidth
                label="Document Type"
                value={documentForm.type}
                onChange={(e) => setDocumentForm({ ...documentForm, type: e.target.value })}
              >
                <MenuItem value="DOCUMENT">Document</MenuItem>
                <MenuItem value="CONTRACT">Contract</MenuItem>
                <MenuItem value="INVOICE">Invoice</MenuItem>
              </TextField>
              <TextField
                select
                fullWidth
                label="Folder"
                value={documentForm.folder}
                onChange={(e) => setDocumentForm({ ...documentForm, folder: e.target.value })}
              >
                <MenuItem value="CONTRACTS">Contracts</MenuItem>
                <MenuItem value="INVOICES">Invoices</MenuItem>
                <MenuItem value="REPORTS">Reports</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={documentForm.description}
                onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
              >
                Choose File
                <input
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                  required
                />
              </Button>
              {documentForm.file && (
                <Typography variant="body2">
                  Selected file: {documentForm.file.name}
                </Typography>
              )}
              {uploadProgress > 0 && (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" color="text.secondary" align="center">
                    {uploadProgress}%
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={uploadDocumentMutation.isLoading || !documentForm.file}
            >
              Upload
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Document Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleShareDocument}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <FileCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Make a Copy</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (selectedDocForMenu) {
            handleDeleteDocument(selectedDocForMenu.id);
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

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