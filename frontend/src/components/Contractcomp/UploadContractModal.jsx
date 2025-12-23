import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Stack,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import { uploadContract, createContract } from '../../services/api';
import { useTheme } from '@mui/material/styles';

const UploadContractModal = ({ open, onClose, onSuccess }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [contractType, setContractType] = useState('service_agreement');

  const acceptedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file) => {
    setError('');
    
    // Validate file type
    if (!acceptedFileTypes.includes(file.type)) {
      setError('Please upload a PDF, Word document, or text file');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('idle');
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setError('');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload the file using the dedicated contract upload function
      const uploadResponse = await uploadContract(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Create contract record with PDF URL
      const contractData = {
        title: selectedFile.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        contractType: contractType, // Use selected contract type
        status: 'DRAFT',
        pdfUrl: uploadResponse.pdfUrl, // Save the PDF URL from upload response
        fileKey: uploadResponse.fileKey,
        uploadedFileName: selectedFile.name,
        uploadedAt: new Date().toISOString(),
      };

      await createContract(contractData);
      
      setUploadStatus('success');
      
      // Refresh contracts list
      queryClient.invalidateQueries(['contracts']);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(contractData);
      }

      // Auto-close after success
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload contract');
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    setUploadProgress(0);
    setUploadStatus('idle');
    setUploading(false);
    setContractType('service_agreement');
    onClose();
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <PdfIcon color="error" />;
    return <DocIcon color="primary" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: theme.palette.mode === 'light' 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <CloudUploadIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Upload Contract
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {!selectedFile ? (
          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: `2px dashed ${dragActive ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 2,
              p: 6,
              textAlign: 'center',
              bgcolor: dragActive ? `${theme.palette.primary.main}10` : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: `${theme.palette.primary.main}05`,
              }
            }}
            onClick={() => document.getElementById('contract-file-input').click()}
          >
            <CloudUploadIcon 
              sx={{ 
                fontSize: 48, 
                color: dragActive ? theme.palette.primary.main : theme.palette.text.secondary,
                mb: 2 
              }} 
            />
            <Typography variant="h6" gutterBottom>
              Drop your contract file here
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              or click to browse files
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supports PDF, Word documents, and text files (max 10MB)
            </Typography>
            <input
              id="contract-file-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </Box>
        ) : (
          <Box>
            <Stack spacing={3}>
              {/* File Preview */}
              <Box
                sx={{
                  p: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  bgcolor: theme.palette.background.default,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  {getFileIcon(selectedFile.type)}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(selectedFile.size)}
                    </Typography>
                  </Box>
                  <Chip 
                    label={selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'} 
                    size="small" 
                    color="primary"
                    variant="outlined"
                  />
                </Stack>
              </Box>

              {/* Contract Type Selector */}
              <FormControl fullWidth>
                <InputLabel>Contract Type</InputLabel>
                <Select
                  value={contractType}
                  label="Contract Type"
                  onChange={(e) => setContractType(e.target.value)}
                  disabled={uploading || uploadStatus === 'success'}
                >
                  <MenuItem value="service_agreement">Service Agreement</MenuItem>
                  <MenuItem value="consulting">Consulting</MenuItem>
                  <MenuItem value="fixed_price">Fixed Price</MenuItem>
                  <MenuItem value="time_and_materials">Time & Materials</MenuItem>
                  <MenuItem value="retainer">Retainer</MenuItem>
                  <MenuItem value="employment">Employment</MenuItem>
                  <MenuItem value="nda">Non-Disclosure Agreement</MenuItem>
                  <MenuItem value="partnership">Partnership</MenuItem>
                  <MenuItem value="freelance">Freelance</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="license">License Agreement</MenuItem>
                  <MenuItem value="vendor_agreement">Vendor Agreement</MenuItem>
                  <MenuItem value="software_license">Software License</MenuItem>
                  <MenuItem value="saas_agreement">SaaS Agreement</MenuItem>
                  <MenuItem value="consulting_retainer">Consulting Retainer</MenuItem>
                  <MenuItem value="subscription">Subscription</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              {/* Upload Progress */}
              {uploading && (
                <Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2">Uploading...</Typography>
                    <Typography variant="body2">{uploadProgress}%</Typography>
                  </Stack>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}

              {/* Status Messages */}
              {uploadStatus === 'success' && (
                <Alert 
                  severity="success" 
                  icon={<CheckIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Contract uploaded successfully! It will appear in your contracts list.
                </Alert>
              )}

              {error && (
                <Alert 
                  severity="error" 
                  icon={<ErrorIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  {error}
                </Alert>
              )}

              <Divider />

              {/* Information */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  What happens next?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Your contract will be added to your contracts list as a draft
                  • You can edit the contract details and add additional information
                  • The original file will be preserved and can be downloaded anytime
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        {selectedFile && uploadStatus !== 'success' && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            startIcon={uploading ? null : <CloudUploadIcon />}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Contract'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UploadContractModal; 