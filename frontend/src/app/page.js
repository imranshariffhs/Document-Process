'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  Schema,
  PlayArrow,
  GetApp,
  Refresh,
  Description,
  ArrowBack,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import FileUpload from './components/FileUpload';
import SchemaManager from './components/SchemaManager';
import ProcessingStatus from './components/ProcessingStatus';
import ResultsTable from './components/ResultsTable';
import { apiService } from './services/apiService';

const steps = ['Upload PDF', 'Select Schema', 'Process Document', 'View Results'];

export default function Home() {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [resultId, setResultId] = useState(null);

  const handleFileUpload = async (file) => {
    try {
      setProcessing(true);
      const response = await apiService.uploadFile(file);
      
      setUploadedFile(response.file);
      setSessionId(response.session_id);
      setActiveStep(1);
      
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setProcessing(false);
    }
  };

  const handleSchemaSelect = (schema) => {
    setSelectedSchema(schema);
    setActiveStep(2);
    toast.success(`Schema "${schema.name}" selected`);
  };

  const handleProcessDocuments = async () => {
    if (!sessionId || !selectedSchema) {
      toast.error('Please upload files and select a schema first');
      return;
    }

    try {
      setProcessing(true);
      setActiveStep(2);
      
      const response = await apiService.processDocuments(sessionId, selectedSchema.id);
      
      setResults(response.results);
      setResultId(response.result_id);
      setActiveStep(3);
      
      toast.success('Documents processed successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to process documents');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportResults = async () => {
    if (!resultId) {
      toast.error('No results to export');
      return;
    }

    try {
      await apiService.exportResults(resultId);
      toast.success('Results exported successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to export results');
    }
  };

  const handleReset = async () => {
    if (sessionId) {
      try {
        await apiService.resetSession(sessionId);
      } catch (error) {
        console.error('Failed to reset session:', error);
      }
    }

    setActiveStep(0);
    setUploadedFile(null);
    setSessionId(null);
    setSelectedSchema(null);
    setResults(null);
    setResultId(null);
    setProcessing(false);
    
    toast.success('Session reset successfully');
  };

  const handleReprocess = async () => {
    if (!sessionId || !selectedSchema) {
      toast.error('Cannot re-process: missing session or schema');
      return;
    }

    try {
      setProcessing(true);
      setActiveStep(2);
      
      const response = await apiService.processDocuments(sessionId, selectedSchema.id);
      
      setResults(response.results);
      setResultId(response.result_id);
      setActiveStep(3);
      
      toast.success('Documents re-processed successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to re-process documents');
      setActiveStep(3);
    } finally {
      setProcessing(false);
    }
  };

  const handleGoBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      toast.success('Navigated to previous step');
    }
  };

  const canGoBack = () => {
    return activeStep > 0 && !processing;
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <FileUpload
            onUpload={handleFileUpload}
            uploadedFile={uploadedFile}
            processing={processing}
          />
        );
      case 1:
        return (
          <SchemaManager
            onSchemaSelect={handleSchemaSelect}
            selectedSchema={selectedSchema}
          />
        );
      case 2:
        return (
          <ProcessingStatus
            processing={processing}
            onProcess={handleProcessDocuments}
            uploadedFile={uploadedFile}
            selectedSchema={selectedSchema}
            canProcess={!processing && sessionId && selectedSchema}
          />
        );
      case 3:
        return (
          <ResultsTable
            results={results}
            onExport={handleExportResults}
            processing={processing}
            onReprocess={handleReprocess}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Description sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PDF Data Extractor
          </Typography>
          <Button
            color="inherit"
            startIcon={<Refresh />}
            onClick={handleReset}
            disabled={processing}
          >
            Reset
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ py: 2, px: 3 }}>
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
          <Typography variant="h5" gutterBottom align="center" color="primary">
            AI Document Processing & Extraction
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            Upload your quotation and enquiry PDF, define extraction schema, and get structured data
          </Typography>
        </Paper>

        {/* Navigation Bar */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleGoBack}
              disabled={!canGoBack()}
              variant="outlined"
              size="small"
            >
              Back
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {activeStep === 0 && 'Upload your PDF document'}
            {activeStep === 1 && 'Select or create extraction schema'}
            {activeStep === 2 && 'Process your document'}
            {activeStep === 3 && 'Review and export results'}
          </Typography>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
          {getStepContent(activeStep)}
        </Paper>

      </Container>
    </Box>
  );
} 