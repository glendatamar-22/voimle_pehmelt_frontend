import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Box,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn,
  People,
  AccessTime,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHeader from '../components/AppHeader';
import api from '../config/axios';
import { format } from 'date-fns';
import { et } from 'date-fns/locale';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = groups.filter(
        (group) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [searchTerm, groups]);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.data);
      setFilteredGroups(response.data.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNextTraining = (nextTraining) => {
    if (!nextTraining) return 'Pole planeeritud';
    const date = new Date(nextTraining.date);
    return `${format(date, 'd MMMM', { locale: et })} kell ${nextTraining.startTime}`;
  };

  return (
    <>
      <AppHeader />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tantsugrupid
        </Typography>

        <TextField
          fullWidth
          placeholder="Otsi gruppe nime või asukoha järgi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3, mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Typography>Laadimine...</Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredGroups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="h2" gutterBottom>
                      {group.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      <LocationOn fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {group.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <People fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {group.studentCount || 0} õpilast
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <AccessTime fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                      {formatNextTraining(group.nextTraining)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      fullWidth
                      onClick={() => navigate(`/groups/${group._id}`)}
                    >
                      Vaata detailsemalt
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && filteredGroups.length === 0 && (
          <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 4 }}>
            Gruppe ei leitud
          </Typography>
        )}
      </Container>
    </>
  );
};

export default Dashboard;

