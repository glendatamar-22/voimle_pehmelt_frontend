import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  Card,
  CardContent,
  CardMedia,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  ContentCopy,
  CheckCircle,
  Add,
  Send,
  VideoLibrary,
  Image as ImageIcon,
  Delete,
  Edit,
} from '@mui/icons-material';
import AppHeader from '../components/AppHeader';
import ScheduleGenerator from '../components/ScheduleGenerator';
import AttendanceTracker from '../components/AttendanceTracker';
import api from '../config/axios';
import { format } from 'date-fns';
import { et } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [group, setGroup] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    title: 'Tantsutrenn',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
  });
  const [newUpdate, setNewUpdate] = useState({
    content: '',
    media: [],
  });
  const [updateComment, setUpdateComment] = useState({});
  const [fileUploading, setFileUploading] = useState(false);

  useEffect(() => {
    fetchGroupData();
    fetchSchedules();
    fetchUpdates();
  }, [id]);

  const fetchGroupData = async () => {
    try {
      const response = await api.get(`/groups/${id}`);
      setGroup(response.data.data);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.get(`/schedules?groupId=${id}`);
      setSchedules(response.data.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchUpdates = async () => {
    try {
      const response = await api.get(`/updates?group=${id}`);
      setUpdates(response.data.data);
    } catch (error) {
      console.error('Error fetching updates:', error);
    }
  };

  const copyEmail = (email) => {
    if (!email) {
      return;
    }
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleScheduleSubmit = async () => {
    try {
      if (editingSchedule) {
        // Update existing schedule
        await api.put(`/schedules/${editingSchedule._id}`, newSchedule);
      } else {
        // Create new schedule
        await api.post('/schedules', {
          ...newSchedule,
          group: id,
          date: new Date(newSchedule.date),
        });
      }
      setScheduleDialogOpen(false);
      setEditingSchedule(null);
      setNewSchedule({
        title: 'Tantsutrenn',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
      });
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Viga graafiku salvestamisel');
    }
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      title: schedule.title,
      date: schedule.date.split('T')[0],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location || '',
      description: schedule.description || '',
    });
    setScheduleDialogOpen(true);
  };

  const handleFileUpload = async (file) => {
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Viga faili üleslaadimisel');
      return null;
    } finally {
      setFileUploading(false);
    }
  };

  const handleUpdateSubmit = async () => {
    try {
      await api.post('/updates', {
        ...newUpdate,
        group: id,
      });
      setUpdateDialogOpen(false);
      setNewUpdate({ content: '', media: [] });
      fetchUpdates();
    } catch (error) {
      console.error('Error creating update:', error);
      alert('Viga uuenduse lisamisel');
    }
  };

  const handleAddComment = async (updateId, content) => {
    try {
      await api.post(`/updates/${updateId}/comments`, { content });
      fetchUpdates();
      setUpdateComment({ ...updateComment, [updateId]: '' });
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const canEdit = isAdmin || (user?.assignedGroups || []).includes(id);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!group) {
    return <Typography>Gruppi ei leitud</Typography>;
  }

  return (
    <>
      <AppHeader title={group.name} showBackButton backTo="/" />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {group.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Asukoht: {group.location}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Õpilasi: {group.students?.length || 0}
          </Typography>
        </Paper>

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Õpilased" />
            <Tab label="Graafik" />
            {canEdit && <Tab label="Kohalolek" />}
            <Tab label="Uuendused" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nimi</TableCell>
                    <TableCell>Vanus</TableCell>
                    <TableCell>Lisanud</TableCell>
                    <TableCell>Lapsevanema e-post</TableCell>
                    <TableCell>Tegevused</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.students?.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>{student.age}</TableCell>
                      <TableCell>
                        {student.enrollmentDate
                          ? format(new Date(student.enrollmentDate), 'd MMMM yyyy', {
                              locale: et,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell>{student.parentEmail || student.parent?.email || '-'}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => copyEmail(student.parentEmail || student.parent?.email)}
                          color={
                            copiedEmail === (student.parentEmail || student.parent?.email)
                              ? 'success'
                              : 'default'
                          }
                        >
                          {copiedEmail === (student.parentEmail || student.parent?.email) ? (
                            <CheckCircle />
                          ) : (
                            <ContentCopy />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {canEdit && (
              <Box sx={{ mb: 3 }}>
                <ScheduleGenerator 
                  groupId={id} 
                  onGenerated={(newSchedules) => {
                    fetchSchedules();
                    alert(`${newSchedules.length} trenni edukalt loodud!`);
                  }} 
                />
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Trennide nimekiri</Typography>
              {canEdit && (
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setScheduleDialogOpen(true)}
                >
                  Lisa üks trenn
                </Button>
              )}
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pealkiri</TableCell>
                    <TableCell>Kuupäev</TableCell>
                    <TableCell>Aeg</TableCell>
                    <TableCell>Asukoht</TableCell>
                    <TableCell>Kirjeldus</TableCell>
                    {canEdit && <TableCell>Tegevused</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule._id}>
                      <TableCell>{schedule.title}</TableCell>
                      <TableCell>
                        {format(new Date(schedule.date), 'd MMMM yyyy', { locale: et })}
                      </TableCell>
                      <TableCell>
                        {schedule.startTime} - {schedule.endTime}
                      </TableCell>
                      <TableCell>{schedule.location || group.location}</TableCell>
                      <TableCell>{schedule.description}</TableCell>
                      {canEdit && (
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditSchedule(schedule)}
                            sx={{ mr: 1 }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={async () => {
                              if (window.confirm('Kas olete kindel, et soovite selle trenni kustutada?')) {
                                try {
                                  await api.delete(`/schedules/${schedule._id}`);
                                  fetchSchedules();
                                } catch (error) {
                                  console.error('Error deleting schedule:', error);
                                  alert('Viga trenni kustutamisel');
                                }
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {canEdit && (
            <TabPanel value={tabValue} index={2}>
              <AttendanceTracker groupId={id} />
            </TabPanel>
          )}

          <TabPanel value={tabValue} index={canEdit ? 3 : 2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              {canEdit && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setUpdateDialogOpen(true)}
                >
                  Lisa uuendus
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {updates.map((update) => (
                <Card key={update._id}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>
                        {update.author?.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {update.author?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(update.createdAt), 'd MMMM yyyy HH:mm', {
                            locale: et,
                          })}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {update.content}
                    </Typography>
                    {update.media && update.media.length > 0 && (
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        {update.media.map((media, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            {media.type === 'video' ? (
                              <video
                                controls
                                src={media.url}
                                style={{ width: '100%', maxHeight: '300px' }}
                              />
                            ) : (
                              <CardMedia
                                component="img"
                                image={media.url}
                                alt="Update media"
                                sx={{ maxHeight: '300px', objectFit: 'contain' }}
                              />
                            )}
                          </Grid>
                        ))}
                      </Grid>
                    )}
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Lisa kommentaar..."
                        value={updateComment[update._id] || ''}
                        onChange={(e) =>
                          setUpdateComment({ ...updateComment, [update._id]: e.target.value })
                        }
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && updateComment[update._id]) {
                            handleAddComment(update._id, updateComment[update._id]);
                          }
                        }}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={() => handleAddComment(update._id, updateComment[update._id])}
                              disabled={!updateComment[update._id]}
                            >
                              <Send />
                            </IconButton>
                          ),
                        }}
                      />
                    </Box>
                    {update.comments && update.comments.length > 0 && (
                      <Box sx={{ mt: 2, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
                        {update.comments.map((comment, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="caption" fontWeight="bold">
                              {comment.author?.name}
                            </Typography>
                            <Typography variant="body2">{comment.content}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </TabPanel>
        </Paper>
      </Container>

      {/* Schedule Dialog */}
      <Dialog 
        open={scheduleDialogOpen} 
        onClose={() => {
          setScheduleDialogOpen(false);
          setEditingSchedule(null);
          setNewSchedule({
            title: 'Tantsutrenn',
            date: '',
            startTime: '',
            endTime: '',
            location: '',
            description: '',
          });
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>{editingSchedule ? 'Muuda trenni' : 'Lisa trenn'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Pealkiri"
            value={newSchedule.title}
            onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Kuupäev"
            type="date"
            value={newSchedule.date}
            onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Algusaeg"
            type="time"
            value={newSchedule.startTime}
            onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Lõppaeg"
            type="time"
            value={newSchedule.endTime}
            onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Asukoht"
            value={newSchedule.location}
            onChange={(e) => setNewSchedule({ ...newSchedule, location: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Kirjeldus"
            multiline
            rows={3}
            value={newSchedule.description}
            onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Tühista</Button>
          <Button onClick={handleScheduleSubmit} variant="contained">
            Lisa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Lisa uuendus</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Sisu"
            multiline
            rows={4}
            value={newUpdate.content}
            onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
            margin="normal"
          />
          <Button
            variant="outlined"
            component="label"
            startIcon={<ImageIcon />}
            sx={{ mt: 2 }}
            disabled={fileUploading}
          >
            {fileUploading ? 'Laadimine...' : 'Lisa pilt/video'}
            <input
              type="file"
              hidden
              accept="image/*,video/*"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  const uploadedFile = await handleFileUpload(file);
                  if (uploadedFile) {
                    setNewUpdate({
                      ...newUpdate,
                      media: [...newUpdate.media, uploadedFile],
                    });
                  }
                }
              }}
            />
          </Button>
          {newUpdate.media.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {newUpdate.media.map((media, index) => (
                <Chip
                  key={index}
                  label={media.filename}
                  onDelete={() => {
                    setNewUpdate({
                      ...newUpdate,
                      media: newUpdate.media.filter((_, i) => i !== index),
                    });
                  }}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Tühista</Button>
          <Button onClick={handleUpdateSubmit} variant="contained">
            Lisa
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GroupDetail;

