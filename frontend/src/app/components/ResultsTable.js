'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
  Collapse,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
} from '@mui/material';
import {
  GetApp,
  Edit,
  Save,
  Cancel,
  CheckCircle,
  Error,
  ExpandMore,
  ExpandLess,
  Visibility,
  Code,
  TableChart,
  ViewModule,
  Refresh,
} from '@mui/icons-material';
import { apiService } from '../services/apiService';

export default function ResultsTable({ results, onExport, processing, onReprocess }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editableResults, setEditableResults] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showRawData, setShowRawData] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  useEffect(() => {
    if (results) {
      setEditableResults(results.map(result => ({ ...result })));
    }
  }, [results]);

  const handleEditStart = (documentIndex, fieldName, currentValue) => {
    setEditingCell({ documentIndex, fieldName });
    setEditValue(currentValue || '');
  };

  const handleEditSave = () => {
    if (editingCell) {
      const { documentIndex, fieldName } = editingCell;
      setEditableResults(prev => {
        const updated = [...prev];
        if (updated[documentIndex] && updated[documentIndex].data) {
          updated[documentIndex].data[fieldName] = editValue;
        }
        return updated;
      });
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const toggleRowExpansion = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const toggleRawData = (index) => {
    setShowRawData(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getProcessingStats = () => {
    if (!editableResults || editableResults.length === 0) {
      return { total: 0, success: 0, failed: 0, successRate: 0 };
    }

    const total = editableResults.length;
    const success = editableResults.filter(r => r.status === 'success').length;
    const failed = total - success;
    const successRate = Math.round((success / total) * 100);

    return { total, success, failed, successRate };
  };

  const getAllFields = () => {
    const fields = new Set();
    if (!editableResults || editableResults.length === 0) {
      return [];
    }
    
    editableResults.forEach(result => {
      if (result?.data) {
        // First add all non-array fields
        Object.entries(result.data).forEach(([key, value]) => {
          if (!Array.isArray(value)) {
            fields.add(key);
          }
        });

        // Then handle formulation data
        Object.entries(result.data).forEach(([formulaName, formulaData]) => {
          if (Array.isArray(formulaData) && formulaData.length > 0) {
            // Add formulation name as a section header
            fields.add(formulaName);
          }
        });
      }
    });
    return Array.from(fields);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return <Typography color="text.secondary" variant="body2">-</Typography>;
    }
    
    if (Array.isArray(value)) {
      return (
        <Box>
          {value.map((item, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              {typeof item === 'object' ? (
                Object.entries(item).map(([key, val]) => (
                  <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
                    <strong>{key}:</strong> {typeof val === 'object' ? JSON.stringify(val) : val || '-'}
                  </Typography>
                ))
              ) : (
                <Typography variant="body2">{String(item)}</Typography>
              )}
            </Box>
          ))}
        </Box>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      if (value.hasOwnProperty('Max') || value.hasOwnProperty('Min')) {
        return (
          <Typography variant="body2">
            {Object.entries(value).map(([key, val]) => `${key}: ${val}`).join(', ')}
          </Typography>
        );
      }
      return (
        <Box>
          {Object.entries(value).map(([key, val]) => (
            <Box key={key} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                {key}
              </Typography>
              {Array.isArray(val) ? (
                val.map((item, idx) => (
                  <Box key={idx} sx={{ ml: 2, mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {Object.entries(item || {}).map(([itemKey, itemVal]) => (
                      <Typography key={itemKey} variant="body2" sx={{ mb: 0.5 }}>
                        <strong>{itemKey}:</strong> {typeof itemVal === 'object' ? JSON.stringify(itemVal) : itemVal || '-'}
                      </Typography>
                    ))}
                  </Box>
                ))
              ) : (
                <Typography variant="body2">{typeof val === 'object' ? JSON.stringify(val) : val || '-'}</Typography>
              )}
            </Box>
          ))}
        </Box>
      );
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object' && value.error) {
      return (
        <Alert severity="error" sx={{ mt: 1 }}>
          {value.error}
          {value.details && (
            <Typography variant="caption" display="block">
              {value.details}
            </Typography>
          )}
        </Alert>
      );
    }
    
    return String(value);
  };

  const renderTableCell = (result, fieldName, documentIndex) => {
    if (!result?.data) {
      return (
        <TableCell>
          <Typography variant="body2" color="text.secondary">-</Typography>
        </TableCell>
      );
    }

    const isEditing = editingCell?.documentIndex === documentIndex && editingCell?.fieldName === fieldName;
    const value = result.data[fieldName];
    
    // If this is a formulation field (contains array data)
    if (Array.isArray(value)) {
      return (
        <TableCell 
          colSpan={paginatedResults.length} 
          sx={{ 
            bgcolor: 'primary.light',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          <Typography variant="subtitle2">
            {fieldName}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(value[0] || {}).map((header) => (
                    <TableCell 
                      key={header}
                      sx={{ 
                        color: 'white',
                        fontWeight: 'bold',
                        borderBottom: '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {value.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Object.entries(row || {}).map(([key, cellValue], cellIndex) => (
                      <TableCell 
                        key={`${rowIndex}-${cellIndex}`}
                        sx={{ 
                          color: 'white',
                          borderBottom: '1px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        {typeof cellValue === 'object' ? JSON.stringify(cellValue) : cellValue || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </TableCell>
      );
    }

    if (isEditing) {
      return (
        <TableCell>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
              fullWidth
              variant="outlined"
            />
            <IconButton size="small" onClick={handleEditSave} color="primary">
              <Save fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleEditCancel}>
              <Cancel fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      );
    }

    return (
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            {typeof value === 'object' ? renderValue(value) : value || '-'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleEditStart(documentIndex, fieldName, value)}
          >
            <Edit fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
    );
  };

  if (!results || results.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircle sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No results to display
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Process some documents to see the extracted data here
        </Typography>
      </Box>
    );
  }

  const stats = getProcessingStats();
  const allFields = getAllFields();
  const successfulResults = editableResults.filter(r => r.status === 'success');
  const paginatedResults = successfulResults.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderTableView = () => {
    if (!paginatedResults || paginatedResults.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No results to display in this page.
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: 'grey.100', 
                    width: '200px',
                    position: 'sticky',
                    left: 0,
                    zIndex: 2
                  }}
                >
                  Field Name
                </TableCell>
                {paginatedResults.map((result, index) => (
                  <TableCell 
                    key={index} 
                    sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: 'grey.100',
                      minWidth: '250px'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircle color="success" sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2" noWrap title={result.filename}>
                          {result.filename?.length > 20 
                            ? `${result.filename.substring(0, 20)}...` 
                            : result.filename || 'Untitled'
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => toggleRawData(page * rowsPerPage + index)}
                          title="View Raw Data"
                        >
                          <Code fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {getAllFields().map((field) => (
                <TableRow key={field}>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      bgcolor: 'grey.50',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1
                    }}
                  >
                    {field}
                  </TableCell>
                  {paginatedResults.map((result, docIndex) => {
                    const actualDocIndex = page * rowsPerPage + docIndex;
                    return renderTableCell(result, field, actualDocIndex);
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <TablePagination
            rowsPerPageOptions={[3, 5, 10]}
            component="div"
            count={successfulResults.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </Paper>
    );
  };

  const renderCardView = () => (
    <Box>
      {paginatedResults.map((result, index) => {
        const actualIndex = page * rowsPerPage + index;
        return (
          <Card key={actualIndex} sx={{ mb: 2 }}>
            <CardContent>
              {/* Document Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {result.filename}
                  </Typography>
                </Box>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => toggleRawData(actualIndex)}
                    title="View Raw Data"
                  >
                    <Code />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => toggleRowExpansion(actualIndex)}
                    title="View Details"
                  >
                    {expandedRows.has(actualIndex) ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
              </Box>

              {/* Extracted Fields - Vertical Layout */}
              <Grid container spacing={2}>
                {allFields.map((field) => {
                  const isEditing = editingCell?.documentIndex === actualIndex && 
                                   editingCell?.fieldName === field;
                  const value = result.data?.[field] || '';

                  return (
                    <Grid item xs={12} sm={6} md={4} key={field}>
                      <Box sx={{ p: 2, border: 1, borderColor: 'grey.200', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                        
                        {isEditing ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              size="small"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleEditSave();
                                if (e.key === 'Escape') handleEditCancel();
                              }}
                              autoFocus
                              fullWidth
                            />
                            <IconButton size="small" onClick={handleEditSave}>
                              <Save fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={handleEditCancel}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              cursor: 'pointer',
                              p: 1,
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'grey.100' },
                              minHeight: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onClick={() => handleEditStart(actualIndex, field, value)}
                          >
                            {value ? (
                              <Typography variant="body2">
                                {String(value)}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                Click to add
                              </Typography>
                            )}
                            <Edit sx={{ fontSize: 14, opacity: 0.5 }} />
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Raw Data - Collapsible */}
              {showRawData[actualIndex] && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Raw Extracted Data
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}

              {/* Expanded Details */}
              <Collapse in={expandedRows.has(actualIndex)}>
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'grey.200' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Processing Status
                      </Typography>
                      <Chip
                        label={result.status}
                        color={result.status === 'success' ? 'success' : 'error'}
                        icon={result.status === 'success' ? <CheckCircle /> : <Error />}
                      />
                    </Grid>
                    
                    {result.error && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Error Details
                        </Typography>
                        <Typography variant="body2" color="error">
                          {result.error}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}

      {/* Pagination for Card View */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={successfulResults.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Extraction Results
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review and edit the extracted data. Click on any field value to modify it.
      </Typography>



      {/* Failed Documents Alert */}
      {stats.failed > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {stats.failed} document(s) failed to process:
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {editableResults
              .filter(r => r.status === 'error')
              .map((result, index) => (
                <li key={index}>
                  {result.filename}: {result.error || 'Unknown error'}
                </li>
              ))}
          </ul>
        </Alert>
      )}

      {/* View Mode Toggle and Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)}>
          <Tab 
            icon={<TableChart />} 
            label="Table View" 
            value="table"
            sx={{ minHeight: 48 }}
          />
          <Tab 
            icon={<ViewModule />} 
            label="Card View" 
            value="cards"
            sx={{ minHeight: 48 }}
          />
        </Tabs>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {onReprocess && (
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={onReprocess}
              disabled={processing}
            >
              Re-process
            </Button>
          )}
          {stats.success > 0 && (
            <Button
              variant="contained"
              startIcon={<GetApp />}
              onClick={onExport}
              disabled={processing}
              color="secondary"
            >
              Export to Excel
            </Button>
          )}
        </Box>
      </Box>

      {/* Results Display */}
      {successfulResults.length > 0 ? (
        viewMode === 'table' ? renderTableView() : renderCardView()
      ) : (
        <Alert severity="info">
          <Typography variant="body2">
            No successful extractions to display. All documents failed to process.
          </Typography>
        </Alert>
      )}

      {/* Raw Data Display for Table View */}
      {viewMode === 'table' && Object.keys(showRawData).some(key => showRawData[key]) && (
        <Box sx={{ mt: 3 }}>
          {Object.keys(showRawData).map(index => {
            if (!showRawData[index]) return null;
            const result = editableResults[parseInt(index)];
            if (!result) return null;
            
            return (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Raw Data: {result.filename}
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </Paper>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Expanded Details for Table View */}
      {viewMode === 'table' && expandedRows.size > 0 && (
        <Box sx={{ mt: 3 }}>
          {Array.from(expandedRows).map((rowIndex) => {
            const result = editableResults[rowIndex];
            if (!result) return null;

            return (
              <Card key={rowIndex} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Document Details: {result.filename}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Extraction Status
                      </Typography>
                      <Chip
                        label={result.status}
                        color={result.status === 'success' ? 'success' : 'error'}
                        icon={result.status === 'success' ? <CheckCircle /> : <Error />}
                      />
                    </Grid>
                    
                    {result.error && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Error Details
                        </Typography>
                        <Typography variant="body2" color="error">
                          {result.error}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
} 