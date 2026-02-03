import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Upload,
  Description,
  Biotech,
  TrendingUp,
  Recommend,
  Summarize,
  Person,
  Logout
} from '@mui/icons-material';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navigationItems = [
    { text: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { text: 'Upload Report', path: '/upload', icon: <Upload /> },
    { text: 'Reports', path: '/reports', icon: <Description /> },
    { text: 'Biomarkers', path: '/biomarkers', icon: <Biotech /> },
    { text: 'Trends', path: '/trends', icon: <TrendingUp /> },
    { text: 'Recommendations', path: '/recommendations', icon: <Recommend /> },
    { text: 'Summary', path: '/summary', icon: <Summarize /> },
  ];

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 700, 
          color: '#1e293b',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          VitalSense
        </Typography>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            sx={{
              color: '#475569',
              '&:hover': {
                backgroundColor: 'rgba(14, 165, 233, 0.08)',
                color: '#0ea5e9'
              },
            }}
          >
            <ListItemIcon sx={{ color: '#0ea5e9' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: 600
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Container>
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Typography
              variant="h6"
              component={Link}
              to="/dashboard"
              sx={{
                flexGrow: 1,
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 800,
                fontSize: '1.75rem',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }
              }}
            >
              VitalSense
            </Typography>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                {navigationItems.map((item) => (
                  <Button
                    key={item.text}
                    component={Link}
                    to={item.path}
                    sx={{
                      color: '#475569',
                      textTransform: 'none',
                      borderRadius: 'var(--radius-lg)',
                      px: 2,
                      py: 1,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&:hover': {
                        color: '#0ea5e9',
                        backgroundColor: 'rgba(14, 165, 233, 0.08)',
                        transform: 'translateY(-1px)'
                      },
                      '&.active': {
                        color: '#0ea5e9',
                        fontWeight: 700,
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '60%',
                          height: '2px',
                          background: '#0ea5e9',
                          borderRadius: '1px'
                        }
                      }
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isAuthenticated ? (
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{ p: 0 }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                      color: 'white',
                      width: 44,
                      height: 44,
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: '0 6px 16px rgba(14, 165, 233, 0.4)'
                      }
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              ) : (
                <>
                  <Button
                    component={Link}
                    to="/login"
                    sx={{
                      color: '#475569',
                      textTransform: 'none',
                      borderRadius: 'var(--radius-lg)',
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: '#0ea5e9',
                        backgroundColor: 'rgba(14, 165, 233, 0.08)',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/signup"
                    variant="outlined"
                    sx={{
                      color: '#0ea5e9',
                      textTransform: 'none',
                      borderRadius: 'var(--radius-lg)',
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      borderColor: '#0ea5e9',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#0ea5e9',
                        color: 'white',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                      }
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {isAuthenticated && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              mt: 1,
              minWidth: 200,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            },
          }}
        >
          <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
            <Person sx={{ mr: 2, color: '#667eea' }} />
            Profile
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 2, color: '#f44336' }} />
            Logout
          </MenuItem>
        </Menu>
      )}

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 250,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)'
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
