import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { CalendarMonth, Save } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../config/axios';

const ScheduleGenerator = ({ groupId, onGenerated }) => {
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '2025-09-01',
    endDate: '2026-05-31',
    dayOfWeek: 1, // Monday
    startTime: '19:20',
    endTime: '20:20',
    location: '',
    title: 'Tantsutrenn',
  });
  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  const dayNames = [
    'Pühapäev',
    'Esmaspäev',
    'Teisipäev',
    'Kolmapäev',
    'Neljapäev',
    'Reede',
    'Laupäev',
  ];

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setShowPreview(false);
  };

  const generatePreview = () => {
    setError('');
    
    if (!formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
      setError('Palun täitke kõik kohustuslikud väljad');
      return;
    }

    const start = dayjs(formData.startDate);
    const end = dayjs(formData.endDate);
    const previewSchedules = [];

    // Estonian school holidays
    const holidays = [
      ['2024-10-21', '2024-10-27'],
      ['2024-12-23', '2025-01-05'],
      ['2025-02-24', '2025-03-02'],
      ['2025-04-14', '2025-04-20'],
      ['2025-06-10', '2025-08-31'],
      ['2025-10-20', '2025-10-26'],
      ['2025-12-22', '2026-01-04'],
      ['2026-02-23', '2026-03-01'],
      ['2026-04-06', '2026-04-12'],
      ['2026-06-09', '2026-08-31'],
    ];

    const isHoliday = (date) => {
      const dateStr = date.format('YYYY-MM-DD');
      return holidays.some(([holidayStart, holidayEnd]) => 
        dateStr >= holidayStart && dateStr <= holidayEnd
      );
    };

    // Find first occurrence of selected day
    let currentDate = start;
    while (currentDate.day() !== parseInt(formData.dayOfWeek)) {
      currentDate = currentDate.add(1, 'day');
    }

    // Generate weekly schedules
    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      if (!isHoliday(currentDate)) {
        previewSchedules.push({
          date: currentDate.format('YYYY-MM-DD'),
          displayDate: currentDate.format('DD.MM.YYYY'),
          dayName: dayNames[currentDate.day()],
          title: formData.title,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
        });
      }
      currentDate = currentDate.add(7, 'days');
    }

    setPreview(previewSchedules);
    setShowPreview(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');

    try {
      const response = await api.post('/schedules/generate-bulk', {
        groupId,
        ...formData,
      });

      if (onGenerated) {
        onGenerated(response.data.data);
      }

      setShowPreview(false);
      setPreview([]);
    } catch (err) {
      console.error('Error generating schedules:', err);
      setError(err.response?.data?.message || 'Graafiku genereerimine ebaõnnestus');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <CalendarMonth sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Genereeri kogu aasta graafik</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Loo automaatselt iganädalased trennid septembrist maini. Süsteem jätab vahele Eesti koolivaheajad.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Alguskuupäev"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Lõppkuupäev"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Nädalapäev</InputLabel>
              <Select
                value={formData.dayOfWeek}
                onChange={(e) => handleChange('dayOfWeek', e.target.value)}
                label="Nädalapäev"
              >
                {dayNames.map((name, index) => (
                  <MenuItem key={index} value={index}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Algusaeg"
              type="time"
              value={formData.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Lõppaeg"
              type="time"
              value={formData.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Pealkiri"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Tantsutrenn"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Asukoht (valikuline)"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Tallinn Stuudio"
            />
          </Grid>
        </Grid>

        <Box display="flex" gap={2} mt={3}>
          <Button
            variant="outlined"
            onClick={generatePreview}
            disabled={generating}
          >
            Eelvaade ({preview.length} trenn)
          </Button>
          {showPreview && preview.length > 0 && (
            <Button
              variant="contained"
              startIcon={generating ? <CircularProgress size={20} /> : <Save />}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Salvestan...' : `Salvesta ${preview.length} trenni`}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Preview Table */}
      {showPreview && preview.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Eelvaade: {preview.length} trenni
          </Typography>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Kuupäev</TableCell>
                  <TableCell>Päev</TableCell>
                  <TableCell>Kellaaeg</TableCell>
                  <TableCell>Pealkiri</TableCell>
                  <TableCell>Asukoht</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {preview.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.displayDate}</TableCell>
                    <TableCell>
                      <Chip label={item.dayName} size="small" />
                    </TableCell>
                    <TableCell>
                      {item.startTime} - {item.endTime}
                    </TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.location || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default ScheduleGenerator;

