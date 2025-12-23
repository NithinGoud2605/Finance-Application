import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Stack,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  PictureAsPdf,
  Image,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { useFormContext } from 'react-hook-form';

const FileUploadSection = ({ isBusinessAccount }) => {
  const { setValue, watch } = useFormContext();
  const fileInputRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const acceptedFormats = [
    '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff',
    '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'
  ];

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <PictureAsPdf color="error" />;
    if (fileType.includes('image')) return <Image color="info" />;
    return <Description color="action" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          id: Date.now() + i,
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target.result,
          uploadDate: new Date().toISOString(),
        };

        newFiles.push(fileData);
        
        if (newFiles.length === files.length) {
          setUploadedFiles(prev => [...prev, ...newFiles]);
          setValue('uploadedFiles', [...uploadedFiles, ...newFiles]);
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  }, [uploadedFiles, setValue]);

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileUpload(files);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, [handleFileUpload]);

  const handleDeleteFile = (fileId) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== fileId);
    setUploadedFiles(updatedFiles);
    setValue('uploadedFiles', updatedFiles);
  };

  const handleViewFile = (file) => {
    // Create a temporary URL for viewing the file
    const blob = dataURLtoBlob(file.data);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Clean up the URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  return (
    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
      {!isBusinessAccount && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Upload invoice files and attachments. Business accounts get additional file management features.
        </Alert>
      )}

      <Typography variant="h6" gutterBottom>
        File Upload & Attachments
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload invoice documents, receipts, contracts, or any related files. 
        Supported formats: {acceptedFormats.join(', ')}
      </Typography>

      {/* Upload Area */}
      <Paper
        variant="outlined"
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          cursor: 'pointer',
          border: dragActive ? '2px dashed #1976d2' : '2px dashed #e0e0e0',
          backgroundColor: dragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: '#1976d2',
            backgroundColor: 'rgba(25, 118, 210, 0.04)',
          },
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drop files here or click to browse
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Maximum file size: 10MB per file
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          sx={{ mt: 2 }}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Choose Files
        </Button>
      </Paper>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept={acceptedFormats.join(',')}
        style={{ display: 'none' }}
      />

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Uploading files...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Uploaded Files ({uploadedFiles.length})
          </Typography>
          
          <List dense>
            {uploadedFiles.map((file) => (
              <ListItem
                key={file.id}
                divider
                sx={{
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <Box sx={{ mr: 2 }}>
                  {getFileIcon(file.type)}
                </Box>
                <ListItemText
                  primary={file.name}
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={formatFileSize(file.size)} size="small" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleViewFile(file)}
                      title="View file"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDeleteFile(file.id)}
                      title="Delete file"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {isBusinessAccount && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Business Feature:</strong> All uploaded files will be automatically organized 
            and can be accessed from your document management system.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default FileUploadSection; 