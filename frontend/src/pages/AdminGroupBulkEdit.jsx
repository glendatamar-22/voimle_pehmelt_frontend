import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Container,
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Delete, Add, Save, Download } from '@mui/icons-material';
import AppHeader from '../components/AppHeader';
import api from '../config/axios';

const AdminGroupBulkEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Group basic info
  const [groupName, setGroupName] = useState('');
  const [groupLocation, setGroupLocation] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  // Excel-like table data: each row = 1 student + 1 parent
  const [rows, setRows] = useState([]);

  // All students (for linking existing ones)
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [groupRes, studentsRes] = await Promise.all([
        api.get(`/groups/${id}/full`),
        api.get('/students'),
      ]);

      const group = groupRes.data.data;
      const allStudentsData = studentsRes.data.data || [];
      
      setAllStudents(allStudentsData);
      setGroupName(group.name || '');
      setGroupLocation(group.location || '');
      setGroupDescription(group.description || '');

      // Convert existing students to table rows
      const existingRows = (group.students || []).map((student) => ({
        id: student._id,
        studentFirstName: student.firstName || '',
        studentLastName: student.lastName || '',
        studentAge: student.age || '',
        parentName: student.parentName || 
          (student.parent ? `${student.parent.firstName || ''} ${student.parent.lastName || ''}`.trim() : ''),
        parentEmail: student.parentEmail || student.parent?.email || '',
        parentPhone: student.parent?.phone || '',
        isExisting: true,
      }));

      setRows(existingRows.length > 0 ? existingRows : [createEmptyRow()]);
    } catch (error) {
      console.error('Error loading group data:', error);
      setSnackbar({
        open: true,
        message: 'Grupi andmete laadimine ebaõnnestus',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const createEmptyRow = () => ({
    id: `new-${Date.now()}-${Math.random()}`,
    studentFirstName: '',
    studentLastName: '',
    studentAge: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    isExisting: false,
  });

  const handleAddRow = () => {
    setRows([...rows, createEmptyRow()]);
  };

  const handleRemoveRow = (rowId) => {
    if (rows.length === 1) {
      setSnackbar({
        open: true,
        message: 'Peate hoidma vähemalt ühe rea',
        severity: 'warning',
      });
      return;
    }
    setRows(rows.filter((row) => row.id !== rowId));
  };

  const handleCellChange = (rowId, field, value) => {
    setRows(
      rows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const validateRows = () => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Check if row has any data
      const hasData = row.studentFirstName || row.studentLastName || row.parentEmail;
      
      if (hasData) {
        if (!row.studentFirstName || !row.studentLastName) {
          setSnackbar({
            open: true,
            message: `Rida ${i + 1}: Õpilase ees- ja perekonnanimi on kohustuslikud`,
            severity: 'error',
          });
          return false;
        }

        if (!row.parentEmail) {
          setSnackbar({
            open: true,
            message: `Rida ${i + 1}: Lapsevanema e-post on kohustuslik`,
            severity: 'error',
          });
          return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.parentEmail)) {
          setSnackbar({
            open: true,
            message: `Rida ${i + 1}: Vigane e-posti aadress`,
            severity: 'error',
          });
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateRows()) return;

    setSubmitting(true);
    try {
      // Filter out completely empty rows
      const validRows = rows.filter((row) => 
        row.studentFirstName || row.studentLastName || row.parentEmail
      );

      // Prepare students data for bulk update
      const studentsData = validRows.map((row) => ({
        _id: row.isExisting ? row.id : undefined,
        firstName: row.studentFirstName,
        lastName: row.studentLastName,
        age: row.studentAge ? parseInt(row.studentAge) : undefined,
      }));

      // Prepare parents data
      const parentsData = validRows.map((row) => ({
        name: row.parentName,
        email: row.parentEmail,
        phone: row.parentPhone,
      }));

      // Create/update students first, then link them
      const studentPromises = studentsData.map(async (student, index) => {
        const parentData = parentsData[index];
        
        if (student._id) {
          // Update existing student
          await api.put(`/students/${student._id}`, {
            ...student,
            groupId: id,
            parentName: parentData.name,
            parentEmail: parentData.email,
          });
          return student._id;
        } else {
          // Create new student
          const response = await api.post('/students', {
            ...student,
            groupId: id,
            parentName: parentData.name,
            parentEmail: parentData.email,
          });
          return response.data.data._id;
        }
      });

      const studentIds = await Promise.all(studentPromises);

      // Update group basic info and student list
      await api.patch(`/groups/${id}/full`, {
        name: groupName,
        location: groupLocation,
        description: groupDescription,
        studentIds,
        parents: parentsData,
      });

      setSnackbar({
        open: true,
        message: 'Rühm edukalt salvestatud!',
        severity: 'success',
      });

      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } catch (error) {
      console.error('Error saving group:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Rühma salvestamine ebaõnnestus',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const BOM = '\uFEFF';
      let csv = BOM + 'Grupi nimi,Õpilase eesnimi,Õpilase perekonnanimi,Vanus,Lapsevanema nimi,Lapsevanema e-post,Telefon\n';

      rows.forEach((row) => {
        const hasData = row.studentFirstName || row.studentLastName || row.parentEmail;
        if (hasData) {
          const escapeCSV = (str) => {
            if (!str) return '';
            const s = String(str);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
              return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
          };

          csv += [
            escapeCSV(groupName),
            escapeCSV(row.studentFirstName),
            escapeCSV(row.studentLastName),
            escapeCSV(row.studentAge),
            escapeCSV(row.parentName),
            escapeCSV(row.parentEmail),
            escapeCSV(row.parentPhone),
          ].join(',') + '\n';
        }
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${groupName}_õpilased.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setSnackbar({
        open: true,
        message: 'CSV eksportimine ebaõnnestus',
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppHeader title="Rühma muutmine" showBackButton backTo="/admin" />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
        {/* Group Basic Info */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Rühma põhiandmed
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Rühma nimi"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Asukoht"
                value={groupLocation}
                onChange={(e) => setGroupLocation(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Kirjeldus"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Excel-like Students + Parents Table */}
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">
              Õpilased ja lapsevanemad ({rows.length})
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="Ekspordi CSV">
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleExportCSV}
                >
                  CSV
                </Button>
              </Tooltip>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddRow}
              >
                Lisa rida
              </Button>
            </Box>
          </Box>

          <TableContainer sx={{ maxHeight: 600, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>Õpilase eesnimi *</TableCell>
                  <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>Õpilase perekonnanimi *</TableCell>
                  <TableCell sx={{ minWidth: 80, fontWeight: 'bold' }}>Vanus</TableCell>
                  <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>Lapsevanema nimi</TableCell>
                  <TableCell sx={{ minWidth: 200, fontWeight: 'bold' }}>Lapsevanema e-post *</TableCell>
                  <TableCell sx={{ minWidth: 120, fontWeight: 'bold' }}>Telefon</TableCell>
                  <TableCell sx={{ minWidth: 80, fontWeight: 'bold' }}>Tegevused</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow 
                    key={row.id}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      bgcolor: row.isExisting ? 'transparent' : 'action.selected'
                    }}
                  >
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={row.studentFirstName}
                        onChange={(e) => handleCellChange(row.id, 'studentFirstName', e.target.value)}
                        placeholder="Eesnimi"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={row.studentLastName}
                        onChange={(e) => handleCellChange(row.id, 'studentLastName', e.target.value)}
                        placeholder="Perekonnanimi"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={row.studentAge}
                        onChange={(e) => handleCellChange(row.id, 'studentAge', e.target.value)}
                        placeholder="Vanus"
                        inputProps={{ min: 1, max: 99 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={row.parentName}
                        onChange={(e) => handleCellChange(row.id, 'parentName', e.target.value)}
                        placeholder="Nt. Mari Maasikas"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type="email"
                        value={row.parentEmail}
                        onChange={(e) => handleCellChange(row.id, 'parentEmail', e.target.value)}
                        placeholder="mari@email.ee"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={row.parentPhone}
                        onChange={(e) => handleCellChange(row.id, 'parentPhone', e.target.value)}
                        placeholder="+372 5555 5555"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={rows.length === 1}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              * Kohustuslikud väljad. Uued read on esile tõstetud. Tühjad read jäetakse salvestamisel vahele.
            </Typography>
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
          <Button
            variant="outlined"
            onClick={() => navigate('/admin')}
            disabled={submitting}
          >
            Tühista
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Salvestamine...' : 'Salvesta rühm'}
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminGroupBulkEdit;
