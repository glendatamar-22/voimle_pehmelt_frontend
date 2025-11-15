import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Checkbox,
  CircularProgress,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import { Download, CheckCircle, Cancel } from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/et';
import api from '../config/axios';

dayjs.locale('et');

const AttendanceTracker = ({ groupId }) => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});

  const months = [
    { value: '2025-09', label: 'September 2025' },
    { value: '2025-10', label: 'Oktoober 2025' },
    { value: '2025-11', label: 'November 2025' },
    { value: '2025-12', label: 'Detsember 2025' },
    { value: '2026-01', label: 'Jaanuar 2026' },
    { value: '2026-02', label: 'Veebruar 2026' },
    { value: '2026-03', label: 'Märts 2026' },
    { value: '2026-04', label: 'Aprill 2026' },
    { value: '2026-05', label: 'Mai 2026' },
  ];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, groupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch group to get students
      const groupResponse = await api.get(`/groups/${groupId}`);
      const groupStudents = groupResponse.data.data.students || [];
      setStudents(groupStudents);

      // Fetch schedules for selected month
      const startDate = dayjs(selectedMonth).startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs(selectedMonth).endOf('month').format('YYYY-MM-DD');
      
      const schedulesResponse = await api.get(
        `/schedules?groupId=${groupId}&startDate=${startDate}&endDate=${endDate}`
      );
      const monthSchedules = schedulesResponse.data.data || [];
      setSchedules(monthSchedules);

      // Fetch all attendance records for this period
      const attendanceResponse = await api.get(
        `/schedules/group/${groupId}/attendance?startDate=${startDate}&endDate=${endDate}`
      );
      
      // Build attendance map: { scheduleId_studentId: { present, _id } }
      const newAttendanceMap = {};
      if (attendanceResponse.data.data?.attendanceByStudent) {
        attendanceResponse.data.data.attendanceByStudent.forEach((studentData) => {
          studentData.records.forEach((record) => {
            const key = `${record.schedule._id}_${studentData.student._id}`;
            newAttendanceMap[key] = {
              present: record.present,
              _id: record._id,
            };
          });
        });
      }
      setAttendanceMap(newAttendanceMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = async (scheduleId, studentId) => {
    const key = `${scheduleId}_${studentId}`;
    const currentStatus = attendanceMap[key]?.present || false;

    try {
      await api.post(`/schedules/${scheduleId}/attendance`, {
        studentId,
        present: !currentStatus,
      });

      // Update local state
      setAttendanceMap((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          present: !currentStatus,
        },
      }));
    } catch (error) {
      console.error('Error toggling attendance:', error);
      alert('Viga kohaloleku märkimisel');
    }
  };

  const getAttendanceStatus = (scheduleId, studentId) => {
    const key = `${scheduleId}_${studentId}`;
    return attendanceMap[key]?.present || false;
  };

  const calculateStudentStats = (studentId) => {
    let attended = 0;
    schedules.forEach((schedule) => {
      if (getAttendanceStatus(schedule._id, studentId)) {
        attended++;
      }
    });
    const total = schedules.length;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { attended, total, percentage };
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const exportCSV = () => {
    if (students.length === 0 || schedules.length === 0) {
      alert('Ei ole andmeid eksportimiseks');
      return;
    }

    const BOM = '\uFEFF';
    let csv = BOM + 'Õpilane,E-post,Lapsevanem,Kuu,Osalenud,Kokku trenne,Protsent\n';

    students.forEach((student) => {
      const stats = calculateStudentStats(student._id);
      const studentName = `${student.firstName} ${student.lastName}`;
      const parentEmail = student.parentEmail || student.parent?.email || '';
      const parentName =
        student.parentName ||
        (student.parent
          ? `${student.parent.firstName || ''} ${student.parent.lastName || ''}`.trim()
          : '');
      const month = dayjs(selectedMonth).format('MMMM YYYY');

      const escapeCSV = (str) => {
        if (!str) return '';
        const s = String(str);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      csv += [
        escapeCSV(studentName),
        escapeCSV(parentEmail),
        escapeCSV(parentName),
        escapeCSV(month),
        stats.attended,
        stats.total,
        `${stats.percentage}%`,
      ].join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kohalolek_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (students.length === 0) {
    return (
      <Alert severity="info">
        Selles grupis pole õpilasi. Palun lisa õpilased esmalt.
      </Alert>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Kohalolek</Typography>
          <Box display="flex" gap={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Kuu</InputLabel>
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                label="Kuu"
              >
                {months.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportCSV}
              disabled={schedules.length === 0}
            >
              Ekspordi CSV
            </Button>
          </Box>
        </Box>

        {schedules.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Sellel kuul pole veel trenne planeeritud. Mine "Graafik" tabisse ja loo trennid.
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Klõpsa märkeruudul, et märkida õpilane kohal või puudu. Roheline = kohal, punane = puudu.
            </Typography>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        minWidth: 150,
                        position: 'sticky',
                        left: 0,
                        bgcolor: 'background.paper',
                        zIndex: 2,
                      }}
                    >
                      Õpilane
                    </TableCell>
                    {schedules.map((schedule) => (
                      <TableCell
                        key={schedule._id}
                        align="center"
                        sx={{ fontWeight: 'bold', minWidth: 80 }}
                      >
                        <Box>
                          <Typography variant="caption" display="block">
                            {dayjs(schedule.date).format('DD.MM')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {schedule.startTime}
                          </Typography>
                        </Box>
                      </TableCell>
                    ))}
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        minWidth: 100,
                        position: 'sticky',
                        right: 100,
                        bgcolor: 'background.paper',
                        zIndex: 2,
                      }}
                    >
                      Kokku
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        minWidth: 100,
                        position: 'sticky',
                        right: 0,
                        bgcolor: 'background.paper',
                        zIndex: 2,
                      }}
                    >
                      %
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => {
                    const stats = calculateStudentStats(student._id);

                    return (
                      <TableRow key={student._id} hover>
                        <TableCell
                          sx={{
                            position: 'sticky',
                            left: 0,
                            bgcolor: 'background.paper',
                            zIndex: 1,
                          }}
                        >
                          <Typography variant="body2" fontWeight="medium">
                            {student.firstName} {student.lastName}
                          </Typography>
                        </TableCell>
                        {schedules.map((schedule) => {
                          const isPresent = getAttendanceStatus(schedule._id, student._id);
                          return (
                            <TableCell key={schedule._id} align="center">
                              <Checkbox
                                checked={isPresent}
                                onChange={() => toggleAttendance(schedule._id, student._id)}
                                icon={<Cancel sx={{ color: 'error.main' }} />}
                                checkedIcon={<CheckCircle sx={{ color: 'success.main' }} />}
                                size="small"
                              />
                            </TableCell>
                          );
                        })}
                        <TableCell
                          align="center"
                          sx={{
                            position: 'sticky',
                            right: 100,
                            bgcolor: 'background.paper',
                            zIndex: 1,
                          }}
                        >
                          <Typography variant="body2" fontWeight="bold">
                            {stats.attended}/{stats.total}
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            position: 'sticky',
                            right: 0,
                            bgcolor: 'background.paper',
                            zIndex: 1,
                          }}
                        >
                          <Chip
                            label={`${stats.percentage}%`}
                            color={getPercentageColor(stats.percentage)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AttendanceTracker;
