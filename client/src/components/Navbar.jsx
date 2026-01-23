import React from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container
} from '@mui/material';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Container>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
              VitalSense
            </Link>
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button color="inherit" component={Link} to="/dashboard">
              Dashboard
            </Button>
            <Button color="inherit" component={Link} to="/upload">
              Upload Report
            </Button>
            <Button color="inherit" component={Link} to="/biomarkers">
              Biomarkers
            </Button>
            <Button color="inherit" component={Link} to="/trends">
              Trends
            </Button>
            <Button color="inherit" component={Link} to="/recommendations">
              Recommendations
            </Button>
            <Button color="inherit" component={Link} to="/summary">
              Summary
            </Button>
            <Button color="inherit" component={Link} to="/profile">
              Profile
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
