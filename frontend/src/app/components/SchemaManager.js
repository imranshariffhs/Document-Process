'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Divider,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Schema,
  CheckCircle,
  Remove,
  Save,
  Cancel,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { apiService } from '../services/apiService';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
];

const DEFAULT_MANUFACTURING_FIELDS = [
  { name: 'company_name', type: 'text', description: 'Company or supplier name', required: true },
  { name: 'contact_person', type: 'text', description: 'Contact person name', required: false },
  { name: 'email', type: 'email', description: 'Email address', required: false },
  { name: 'phone', type: 'phone', description: 'Phone number', required: false },
  { name: 'quotation_number', type: 'text', description: 'Quotation or reference number', required: false },
  { name: 'date', type: 'date', description: 'Document date', required: false },
  { name: 'total_amount', type: 'currency', description: 'Total amount or price', required: false },
];

export default function SchemaManager({ onSchemaSelect, selectedSchema }) {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [],
  });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSchemas();
      setSchemas(data);
    } catch (error) {
      toast.error('Failed to load schemas');
      console.error('Error loading schemas:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSchema(null);
    setFormData({
      name: '',
      description: '',
      fields: [],
    });
    setErrors([]);
    setDialogOpen(true);
  };

  const openEditDialog = (schema) => {
    setEditingSchema(schema);
    setFormData({
      name: schema.name,
      description: schema.description || '',
      fields: [...schema.fields],
    });
    setErrors([]);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingSchema(null);
    setFormData({ name: '', description: '', fields: [] });
    setErrors([]);
  };

  const addField = () => {
    const newField = {
      id: uuidv4(),
      name: '',
      type: 'text',
      description: '',
      required: false,
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const removeField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
    }));
  };

  const updateField = (fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    }));
  };

  const useDefaultFields = () => {
    const defaultFields = DEFAULT_MANUFACTURING_FIELDS.map(field => ({
      ...field,
      id: uuidv4(),
    }));
    setFormData(prev => ({
      ...prev,
      fields: defaultFields,
    }));
  };

  const validateForm = () => {
    const validationErrors = apiService.validateSchema(formData);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Remove id from fields before saving (backend doesn't need them)
      const schemaData = {
        ...formData,
        fields: formData.fields.map(({ id, ...field }) => field),
      };

      if (editingSchema) {
        await apiService.updateSchema(editingSchema.id, schemaData);
        toast.success('Schema updated successfully');
      } else {
        await apiService.createSchema(schemaData);
        toast.success('Schema created successfully');
      }

      closeDialog();
      loadSchemas();
    } catch (error) {
      toast.error(apiService.getErrorMessage(error));
    }
  };

  const handleDelete = async (schemaId) => {
    if (!confirm('Are you sure you want to delete this schema?')) {
      return;
    }

    try {
      await apiService.deleteSchema(schemaId);
      toast.success('Schema deleted successfully');
      loadSchemas();
      
      // Clear selection if deleted schema was selected
      if (selectedSchema && selectedSchema.id === schemaId) {
        onSchemaSelect(null);
      }
    } catch (error) {
      toast.error(apiService.getErrorMessage(error));
    }
  };

  const handleSelect = (schema) => {
    onSchemaSelect(schema);
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading schemas...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Select Extraction Schema
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose an existing schema or create a new one to define what data to extract
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateDialog}
        >
          Create Schema
        </Button>
      </Box>

      {/* Selected Schema Display */}
      {selectedSchema && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            Selected Schema: <strong>{selectedSchema.name}</strong>
          </Typography>
          <Typography variant="body2">
            {selectedSchema.fields?.length || 0} fields defined
          </Typography>
        </Alert>
      )}

      {/* Schemas Grid */}
      {schemas.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Schema sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No schemas found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first schema to define what data to extract from PDFs
          </Typography>
          <Button variant="contained" onClick={openCreateDialog}>
            Create First Schema
          </Button>
        </Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Schema Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Fields</TableCell>
                <TableCell align="center">Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schemas.map((schema) => (
                <TableRow 
                  key={schema.id}
                  sx={{ 
                    backgroundColor: selectedSchema?.id === schema.id ? 'primary.light' : 'inherit',
                    '&:hover': { backgroundColor: 'grey.50' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schema color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1" fontWeight="medium">
                        {schema.name}
                      </Typography>
                      {selectedSchema?.id === schema.id && (
                        <CheckCircle color="success" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {schema.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${schema.fields?.length || 0} fields`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption" color="text.secondary">
                      {apiService.formatDate(schema.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button
                        size="small"
                        onClick={() => handleSelect(schema)}
                        variant={selectedSchema?.id === schema.id ? "contained" : "outlined"}
                      >
                        {selectedSchema?.id === schema.id ? 'Selected' : 'Select'}
                      </Button>
                      <IconButton size="small" onClick={() => openEditDialog(schema)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(schema.id)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Create/Edit Schema Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={closeDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { minHeight: '70vh' } }}
      >
        <DialogTitle>
          {editingSchema ? 'Edit Schema' : 'Create New Schema'}
        </DialogTitle>
        
        <DialogContent>
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

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Schema Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Fields</Typography>
                <Box>
                  <Button
                    size="small"
                    onClick={useDefaultFields}
                    sx={{ mr: 1 }}
                  >
                    Use Manufacturing Template
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={addField}
                  >
                    Add Field
                  </Button>
                </Box>
              </Box>

              {formData.fields.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography color="text.secondary">
                    No fields defined. Add fields to specify what data to extract.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {formData.fields.map((field, index) => (
                    <ListItem key={field.id} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
                      <Box sx={{ width: '100%' }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Field Name"
                              value={field.name}
                              onChange={(e) => updateField(field.id, { name: e.target.value })}
                              required
                            />
                          </Grid>
                          
                          <Grid item xs={12} sm={2}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={field.type}
                                label="Type"
                                onChange={(e) => updateField(field.id, { type: e.target.value })}
                              >
                                {FIELD_TYPES.map((type) => (
                                  <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={12} sm={5}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Description (Optional)"
                              value={field.description}
                              onChange={(e) => updateField(field.id, { description: e.target.value })}
                            />
                          </Grid>
                          
                          <Grid item xs={12} sm={1}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={field.required}
                                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                  size="small"
                                />
                              }
                              label="Required"
                              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.75rem' } }}
                            />
                          </Grid>
                          
                          <Grid item xs={12} sm={1}>
                            <IconButton
                              size="small"
                              onClick={() => removeField(field.id)}
                              color="error"
                            >
                              <Remove />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            startIcon={<Save />}
            disabled={formData.fields.length === 0}
          >
            {editingSchema ? 'Update' : 'Create'} Schema
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 