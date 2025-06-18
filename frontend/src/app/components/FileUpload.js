'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Chip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload,
  PictureAsPdf,
  Delete,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

export default function FileUpload({ onUpload, uploadedFile, processing }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setErrors([]);
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejectionErrors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map(e => e.message).join(', ');
        return `${file.name}: ${errorMessages}`;
      });
      setErrors(rejectionErrors);
      return;
    }

    // Handle accepted file (only one file allowed)
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]; // Take only the first file
      const validationErrors = apiService.validateFile(file);
      
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Set the selected file
      setSelectedFile({
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        status: 'ready',
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 16 * 1024 * 1024, // 16MB
    disabled: processing || uploading,
    multiple: false,
  });

  const removeFile = () => {
    setSelectedFile(null);
    setErrors([]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrors(['Please select a file']);
      return;
    }

    try {
      setUploading(true);
      setErrors([]);

      await onUpload(selectedFile.file);
      
      // Clear file after successful upload
      setSelectedFile(null);
    } catch (error) {
      setErrors([apiService.getErrorMessage(error)]);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    return apiService.formatFileSize(bytes);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Upload PDF Document
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a single PDF file (max 16MB) containing quotations or enquiry forms
      </Typography>

      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'primary.light' : 'grey.50',
          cursor: processing || uploading ? 'not-allowed' : 'pointer',
          opacity: processing || uploading ? 0.6 : 1,
          transition: 'all 0.3s ease',
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ textAlign: 'center' }}>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          {isDragActive ? (
            <Typography variant="h6" color="primary">
              Drop the file here...
            </Typography>
          ) : (
            <>
              <Typography variant="h6" gutterBottom>
                Drag & drop a PDF file here, or click to select
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports: PDF files up to 16MB
              </Typography>
            </>
          )}
        </Box>
      </Paper>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Please fix the following issues:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Selected File */}
      {selectedFile && (
        <Paper sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            Selected File
          </Typography>
          <List>
            <ListItem divider>
              <ListItemIcon>
                <PictureAsPdf color="error" />
              </ListItemIcon>
              <ListItemText
                primary={selectedFile.name}
                secondary={formatFileSize(selectedFile.size)}
              />
              <ListItemSecondaryAction>
                <Chip
                  label="Ready"
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                />
                <IconButton
                  edge="end"
                  onClick={removeFile}
                  disabled={uploading}
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </Paper>
      )}

      {/* Uploaded File (from previous upload) */}
      {uploadedFile && (
        <Paper sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            Uploaded File
          </Typography>
          <List>
            <ListItem divider>
              <ListItemIcon>
                <CheckCircle color="success" />
              </ListItemIcon>
              <ListItemText
                primary={uploadedFile.original_name}
                secondary={formatFileSize(uploadedFile.size)}
              />
              <ListItemSecondaryAction>
                <Chip
                  label="Uploaded"
                  color="success"
                  size="small"
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </Paper>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Uploading file...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Upload Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleUpload}
          disabled={!selectedFile || uploading || processing}
          startIcon={uploading ? <div className="loading-spinner" /> : <CloudUpload />}
          sx={{ minWidth: 200 }}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </Box>
    </Box>
  );
} 