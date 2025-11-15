import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  AppBar,
  Toolbar,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  People,
  Group,
  School,
  Person,
  Download,
} from '@mui/icons-material';
import AppHeader from '../components/AppHeader';
import api from '../config/axios';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [parentDialogOpen, setParentDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const groupDialogTitleId = 'admin-group-dialog-title';
  const studentDialogTitleId = 'admin-student-dialog-title';
  const parentDialogTitleId = 'admin-parent-dialog-title';
  const userDialogTitleId = 'admin-user-dialog-title';

  // Form states
  const [newGroup, setNewGroup] = useState({ name: '', location: '', description: '' });
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    age: '',
    groupId: '',
    parentName: '',
    parentEmail: '',
  });
  const [newParent, setNewParent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'teacher',
    assignedGroups: [],
  });
  const [editUser, setEditUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tabValue === 0) {
        const [groupsRes, statsRes] = await Promise.all([
          api.get('/groups'),
          api.get('/admin/stats'),
        ]);
        setGroups(groupsRes.data.data);
        setStats(statsRes.data.data);
      } else if (tabValue === 1) {
        const response = await api.get('/admin/users');
        setUsers(response.data.data);
      } else if (tabValue === 2) {
        const response = await api.get('/students');
        setStudents(response.data.data);
      } else if (tabValue === 3) {
        const response = await api.get('/admin/parents');
        setParents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await api.post('/groups', newGroup);
      setGroupDialogOpen(false);
      setNewGroup({ name: '', location: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Viga grupi loomisel');
    }
  };

  const handleCreateStudent = async () => {
    try {
      const ageValue = Number.parseInt(newStudent.age, 10);
      if (Number.isNaN(ageValue)) {
        alert('Palun sisestage kehtiv vanus');
        return;
      }
      if (!newStudent.parentEmail) {
        alert('Lapsevanema e-post on kohustuslik');
        return;
      }

      await api.post('/students', {
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        age: ageValue,
        groupId: newStudent.groupId,
        parentName: newStudent.parentName,
        parentEmail: newStudent.parentEmail,
      });
      setStudentDialogOpen(false);
      setNewStudent({
        firstName: '',
        lastName: '',
        age: '',
        groupId: '',
        parentName: '',
        parentEmail: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating student:', error);
      alert('Viga õpilase loomisel');
    }
  };

  const handleCreateParent = async () => {
    try {
      await api.post('/admin/parents', newParent);
      setParentDialogOpen(false);
      setNewParent({ firstName: '', lastName: '', email: '', phone: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating parent:', error);
      alert('Viga lapsevanema loomisel');
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/auth/register', newUser);
      setUserDialogOpen(false);
      setNewUser({ name: '', email: '', password: '', role: 'teacher', assignedGroups: [] });
      fetchData();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Viga kasutaja loomisel');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const updateData = {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
      };
      
      // Only include password if it was changed
      if (editUser.password && editUser.password.trim() !== '') {
        updateData.password = editUser.password;
      }
      
      await api.put(`/admin/users/${editUser._id}`, updateData);
      setUserDialogOpen(false);
      setEditUser(null);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Viga kasutaja uuendamisel');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (window.confirm('Kas olete kindel, et soovite selle grupi kustutada?')) {
      try {
        await api.delete(`/groups/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting group:', error);
        alert('Viga grupi kustutamisel');
      }
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Kas olete kindel, et soovite selle õpilase kustutada?')) {
      try {
        await api.delete(`/students/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting student:', error);
        alert('Viga õpilase kustutamisel');
      }
    }
  };

  const handleExportGroupCSV = async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/export-csv`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get group name for filename
      const group = groups.find(g => g._id === groupId);
      const filename = `${group?.name || 'grupp'}_õpilased.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Viga CSV eksportimisel');
    }
  };

  return (
    <>
      <AppHeader title="Admin Paneel" showBackButton backTo="/" />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {stats && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Grupid
                  </Typography>
                  <Typography variant="h4">{stats.totalGroups}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Õpilased
                  </Typography>
                  <Typography variant="h4">{stats.totalStudents}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Lapsevanemad
                  </Typography>
                  <Typography variant="h4">{stats.totalParents}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Õpetajad
                  </Typography>
                  <Typography variant="h4">{stats.totalTeachers}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Paper>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Grupid" icon={<Group />} iconPosition="start" />
            <Tab label="Kasutajad" icon={<People />} iconPosition="start" />
            <Tab label="Õpilased" icon={<School />} iconPosition="start" />
            <Tab label="Lapsevanemad" icon={<Person />} iconPosition="start" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => setGroupDialogOpen(true)}>
                Lisa grupp
              </Button>
            </Box>
            {loading ? (
              <CircularProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nimi</TableCell>
                      <TableCell>Asukoht</TableCell>
                      <TableCell>Õpilasi</TableCell>
                      <TableCell>Tegevused</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group._id}>
                        <TableCell>{group.name}</TableCell>
                        <TableCell>{group.location}</TableCell>
                        <TableCell>{group.studentCount || 0}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/admin/groups/${group._id}/edit`)}
                            sx={{ mr: 1 }}
                            aria-label="Muuda gruppi"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleExportGroupCSV(group._id)}
                            sx={{ mr: 1 }}
                            aria-label="Ekspordi CSV"
                          >
                            <Download />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteGroup(group._id)}
                            aria-label="Kustuta grupp"
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => setUserDialogOpen(true)}>
                Lisa kasutaja
              </Button>
            </Box>
            {loading ? (
              <CircularProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nimi</TableCell>
                      <TableCell>E-post</TableCell>
                      <TableCell>Roll</TableCell>
                      <TableCell>Määratud grupid</TableCell>
                      <TableCell>Tegevused</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip label={user.role} color={user.role === 'admin' ? 'primary' : 'default'} />
                        </TableCell>
                        <TableCell>{user.assignedGroups?.length || 0}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setEditUser(user);
                              setUserDialogOpen(true);
                            }}
                            aria-label="Muuda kasutajat"
                          >
                            <Edit />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => setStudentDialogOpen(true)}>
                Lisa õpilane
              </Button>
            </Box>
            {loading ? (
              <CircularProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nimi</TableCell>
                      <TableCell>Vanus</TableCell>
                      <TableCell>Grupp</TableCell>
                      <TableCell>Lapsevanem</TableCell>
                      <TableCell>Tegevused</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.age}</TableCell>
                        <TableCell>{student.group?.name}</TableCell>
                        <TableCell>{student.parentEmail || student.parent?.email}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteStudent(student._id)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<Add />} onClick={() => setParentDialogOpen(true)}>
                Lisa lapsevanem
              </Button>
            </Box>
            {loading ? (
              <CircularProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nimi</TableCell>
                      <TableCell>E-post</TableCell>
                      <TableCell>Telefon</TableCell>
                      <TableCell>Õpilasi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parents.map((parent) => (
                      <TableRow key={parent._id}>
                        <TableCell>
                          {parent.firstName} {parent.lastName}
                        </TableCell>
                        <TableCell>{parent.email}</TableCell>
                        <TableCell>{parent.phone}</TableCell>
                        <TableCell>{parent.students?.length || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </Paper>
      </Container>

      {/* Group Dialog */}
      <Dialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby={groupDialogTitleId}
      >
        <DialogTitle id={groupDialogTitleId}>Lisa grupp</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nimi"
            value={newGroup.name}
            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Asukoht"
            value={newGroup.location}
            onChange={(e) => setNewGroup({ ...newGroup, location: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Kirjeldus"
            multiline
            rows={3}
            value={newGroup.description}
            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialogOpen(false)}>Tühista</Button>
          <Button onClick={handleCreateGroup} variant="contained">
            Lisa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Student Dialog */}
      <Dialog
        open={studentDialogOpen}
        onClose={() => setStudentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby={studentDialogTitleId}
      >
        <DialogTitle id={studentDialogTitleId}>Lisa õpilane</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Eesnimi"
            value={newStudent.firstName}
            onChange={(e) => setNewStudent({ ...newStudent, firstName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Perekonnanimi"
            value={newStudent.lastName}
            onChange={(e) => setNewStudent({ ...newStudent, lastName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Vanus"
            type="number"
            value={newStudent.age}
            onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Grupp</InputLabel>
            <Select
              value={newStudent.groupId}
              label="Grupp"
              onChange={(e) => setNewStudent({ ...newStudent, groupId: e.target.value })}
            >
              {groups.map((group) => (
                <MenuItem key={group._id} value={group._id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Lapsevanema nimi"
            value={newStudent.parentName}
            onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Lapsevanema e-post"
            type="email"
            value={newStudent.parentEmail}
            onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDialogOpen(false)}>Tühista</Button>
          <Button onClick={handleCreateStudent} variant="contained">
            Lisa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Parent Dialog */}
      <Dialog
        open={parentDialogOpen}
        onClose={() => setParentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby={parentDialogTitleId}
      >
        <DialogTitle id={parentDialogTitleId}>Lisa lapsevanem</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Eesnimi"
            value={newParent.firstName}
            onChange={(e) => setNewParent({ ...newParent, firstName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Perekonnanimi"
            value={newParent.lastName}
            onChange={(e) => setNewParent({ ...newParent, lastName: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="E-post"
            type="email"
            value={newParent.email}
            onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Telefon"
            value={newParent.phone}
            onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setParentDialogOpen(false)}>Tühista</Button>
          <Button onClick={handleCreateParent} variant="contained">
            Lisa
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Dialog */}
      <Dialog
        open={userDialogOpen}
        onClose={() => {
          setUserDialogOpen(false);
          setEditUser(null);
          setNewUser({ name: '', email: '', password: '', role: 'teacher', assignedGroups: [] });
        }}
        maxWidth="sm"
        fullWidth
        aria-labelledby={userDialogTitleId}
      >
        <DialogTitle id={userDialogTitleId}>
          {editUser ? 'Muuda kasutajat' : 'Lisa kasutaja'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nimi"
            value={editUser ? editUser.name : newUser.name}
            onChange={(e) => editUser 
              ? setEditUser({ ...editUser, name: e.target.value })
              : setNewUser({ ...newUser, name: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="E-post"
            type="email"
            value={editUser ? editUser.email : newUser.email}
            onChange={(e) => editUser 
              ? setEditUser({ ...editUser, email: e.target.value })
              : setNewUser({ ...newUser, email: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label={editUser ? "Uus parool (jäta tühjaks kui ei muuda)" : "Parool"}
            type="password"
            value={editUser ? (editUser.password || '') : newUser.password}
            onChange={(e) => editUser 
              ? setEditUser({ ...editUser, password: e.target.value })
              : setNewUser({ ...newUser, password: e.target.value })
            }
            margin="normal"
            required={!editUser}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Roll</InputLabel>
            <Select
              value={editUser ? editUser.role : newUser.role}
              onChange={(e) => editUser 
                ? setEditUser({ ...editUser, role: e.target.value })
                : setNewUser({ ...newUser, role: e.target.value })
              }
            >
              <MenuItem value="teacher">Õpetaja</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUserDialogOpen(false);
            setEditUser(null);
            setNewUser({ name: '', email: '', password: '', role: 'teacher', assignedGroups: [] });
          }}>
            Tühista
          </Button>
          <Button 
            onClick={editUser ? handleUpdateUser : handleCreateUser} 
            variant="contained"
          >
            {editUser ? 'Salvesta' : 'Lisa'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminPanel;

