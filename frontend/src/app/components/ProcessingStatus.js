'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Grid,
  Paper,
  CircularProgress,
  Fade,
  Zoom,
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  PictureAsPdf,
  Schema,
  AutoAwesome,
  Timer,
  CloudUpload,
  Psychology,
  DataObject,
  Verified,
} from '@mui/icons-material';

export default function ProcessingStatus({ 
  processing, 
  onProcess, 
  uploadedFile, 
  selectedSchema, 
  canProcess 
}) {
  const [processingStep, setProcessingStep] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [processingSteps] = useState([
    { text: 'Initializing AI processing...', icon: <AutoAwesome /> },
    { text: 'Uploading PDFs to Gemini...', icon: <CloudUpload /> },
    { text: 'Analyzing document structure...', icon: <Psychology /> },
    { text: 'Extracting data fields...', icon: <DataObject /> },
    { text: 'Validating extracted data...', icon: <Verified /> },
    { text: 'Finalizing results...', icon: <CheckCircle /> },
  ]);

  useEffect(() => {
    let stepInterval;
    let phaseInterval;
    
    if (processing) {
      setProcessingStep(0);
      setAnimationPhase(0);
      
      // Change processing step every 3 seconds
      stepInterval = setInterval(() => {
        setProcessingStep(prev => {
          if (prev < processingSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3000);
      
      // Animation phase for visual effects
      phaseInterval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
      }, 800);
    } else {
      setProcessingStep(0);
      setAnimationPhase(0);
    }

    return () => {
      if (stepInterval) clearInterval(stepInterval);
      if (phaseInterval) clearInterval(phaseInterval);
    };
  }, [processing, processingSteps.length]);

  const getProcessingProgress = () => {
    return ((processingStep + 1) / processingSteps.length) * 100;
  };

  if (processing) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Processing Documents
        </Typography>
        
        <Card sx={{ 
          mb: 2, 
          overflow: 'hidden', 
          position: 'relative',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          minHeight: 300
        }}>
          {/* Animated Background Particles */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                  radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)
                `,
                animation: 'float 6s ease-in-out infinite',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                  radial-gradient(circle at 60% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                  radial-gradient(circle at 90% 40%, rgba(120, 119, 198, 0.25) 0%, transparent 50%)
                `,
                animation: 'float 8s ease-in-out infinite reverse',
              },
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                '33%': { transform: 'translateY(-10px) rotate(1deg)' },
                '66%': { transform: 'translateY(5px) rotate(-1deg)' },
              },
            }}
          />
          
          <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              {/* Multi-layered Processing Animation */}
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                {/* Outer rotating ring */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -15,
                    left: -15,
                    width: 90,
                    height: 90,
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    borderTopColor: 'rgba(255, 255, 255, 0.8)',
                    animation: 'spin 3s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
                
                {/* Middle pulsing ring */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    left: -8,
                    width: 76,
                    height: 76,
                    border: '3px solid rgba(255, 255, 255, 0.4)',
                    borderRadius: '50%',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { 
                        transform: 'scale(1)',
                        borderColor: 'rgba(255, 255, 255, 0.4)'
                      },
                      '50%': { 
                        transform: 'scale(1.1)',
                        borderColor: 'rgba(255, 255, 255, 0.8)'
                      },
                    },
                  }}
                />
                
                {/* Inner spinning progress */}
                <CircularProgress
                  size={60}
                  thickness={4}
                  sx={{
                    color: 'white',
                    animation: 'spin 1.5s linear infinite',
                    filter: 'drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))',
                  }}
                />
                
                {/* Center icon with glow effect */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow 2s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))',
                    '@keyframes glow': {
                      '0%, 100%': { 
                        transform: 'translate(-50%, -50%) scale(1)',
                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))'
                      },
                      '50%': { 
                        transform: 'translate(-50%, -50%) scale(1.2)',
                        filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 1))'
                      },
                    },
                  }}
                >
                  {processingSteps[processingStep]?.icon}
                </Box>
              </Box>
              
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                AI Processing in Progress
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                Advanced algorithms are extracting structured data from your documents
              </Typography>
            </Box>

            {/* Enhanced Step Display */}
            <Fade in={true} timeout={500} key={processingStep}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  mb: 2,
                  p: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                }}>
                  <Box sx={{ 
                    mr: 2, 
                    p: 1,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    animation: 'bounce 1s ease-in-out infinite',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'translateY(0)' },
                      '50%': { transform: 'translateY(-5px)' },
                    },
                  }}>
                    {processingSteps[processingStep]?.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {processingSteps[processingStep]?.text}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Step {processingStep + 1} of {processingSteps.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {Math.round(getProcessingProgress())}% Complete
                  </Typography>
                </Box>
                
                {/* Enhanced Progress Bar */}
                <Box sx={{ position: 'relative' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={getProcessingProgress()}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, #ffffff 0%, #f0f0f0 100%)',
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  />
                  {/* Progress glow effect */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: 8,
                      width: `${getProcessingProgress()}%`,
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
                      animation: 'shimmer 2s ease-in-out infinite',
                      '@keyframes shimmer': {
                        '0%': { opacity: 0.5 },
                        '50%': { opacity: 1 },
                        '100%': { opacity: 0.5 },
                      },
                    }}
                  />
                </Box>
              </Box>
            </Fade>

            {/* Stylized Stats */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  bgcolor: 'rgba(255, 255, 255, 0.15)', 
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {uploadedFile ? 1 : 0}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Document Processing
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 2, 
                  bgcolor: 'rgba(255, 255, 255, 0.15)', 
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}>
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #ffffff 30%, #f0f0f0 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {selectedSchema?.fields?.length || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Fields Extracting
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1
          }}>
            <Box sx={{ 
              width: 8, 
              height: 8, 
              bgcolor: 'success.main', 
              borderRadius: '50%',
              animation: 'blink 1.5s ease-in-out infinite',
              '@keyframes blink': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.3 },
              },
            }} />
            Processing in progress - Please keep this window open
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Ready to Process
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your settings and start the data extraction process
      </Typography>

      {/* Processing Summary - Compact Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 120, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Uploaded File
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {uploadedFile ? 1 : 0}
                  </Typography>
                </Box>
                <PictureAsPdf color="error" sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
              {uploadedFile && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {uploadedFile.original_name}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: 120, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Schema Fields
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {selectedSchema?.fields?.length || 0}
                  </Typography>
                </Box>
                <Schema color="primary" sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
              {selectedSchema && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {selectedSchema.name}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: 120, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Est. Time
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {uploadedFile ? '2-4' : '0'}
                  </Typography>
                </Box>
                <Timer color="action" sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                minutes (approx)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Validation Messages */}
      {!canProcess && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Cannot start processing:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {!uploadedFile && <li>No file uploaded</li>}
            {!selectedSchema && <li>No schema selected</li>}
          </ul>
        </Alert>
      )}

      {/* Schema Fields Preview - Improved Design */}
      {selectedSchema && (
        <Paper sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
            Fields to Extract ({selectedSchema.fields?.length || 0})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {selectedSchema.fields?.map((field, index) => (
              <Chip
                key={index}
                label={field.name}
                variant="outlined"
                size="small"
                color={field.required ? "primary" : "default"}
                sx={{ 
                  fontSize: '0.75rem',
                  height: 24,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Process Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={onProcess}
          disabled={!canProcess}
          startIcon={<PlayArrow />}
          sx={{ 
            minWidth: 250,
            py: 1.5,
            fontSize: '1.1rem',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
            },
          }}
        >
          Start Processing
        </Button>
      </Box>
    </Box>
  );
} 