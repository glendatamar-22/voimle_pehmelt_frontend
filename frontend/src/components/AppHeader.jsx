import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  Logout,
  People,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AppHeader = ({ 
  title, 
  showBackButton = false, 
  backTo = '/',
  showUserMenu = true 
}) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {showBackButton && (
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={() => navigate(backTo)} 
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
        )}
        
        {/* Logo */}
        <Box 
          component="img"
          src="https://i.postimg.cc/pXmrwB4B/VP-logo.avif"
          alt="Võimle Pehmelt logo"
          loading="lazy"
          sx={{ 
            height: { xs: 64, sm: 72, md: 80 },
            maxHeight: 80,
            mr: 2,
            cursor: 'pointer',
            objectFit: 'contain'
          }}
          onClick={() => navigate('/')}
        />
        
        {/* Title - optional, shown next to logo */}
        {title && (
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        )}
        
        {!title && <Box sx={{ flexGrow: 1 }} />}

        {/* User Menu */}
        {showUserMenu && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isAdmin && (
              <Button
                color="inherit"
                startIcon={<AdminPanelSettings />}
                onClick={() => navigate('/admin')}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                Admin
              </Button>
            )}
            <Typography 
              variant="body2" 
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              {user?.name}
            </Typography>
            <IconButton color="inherit" onClick={handleMenuOpen}>
              <People />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {isAdmin && (
                <MenuItem 
                  onClick={() => { navigate('/admin'); handleMenuClose(); }}
                  sx={{ display: { sm: 'none' } }}
                >
                  <AdminPanelSettings sx={{ mr: 1 }} />
                  Admin
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logi välja
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;

