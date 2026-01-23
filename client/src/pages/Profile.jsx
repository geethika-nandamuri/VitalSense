import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert
} from '@mui/material';
import axios from 'axios';

const Profile = () => {
  const [preferences, setPreferences] = useState({
    diet: 'none',
    age: '',
    conditions: [],
    gender: 'prefer-not-to-say'
  });
  const [newCondition, setNewCondition] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      // Store preferences in localStorage since we don't have user auth
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      setMessage('Preferences saved successfully!');
    } catch (error) {
      setMessage('Error saving preferences');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCondition = () => {
    if (newCondition.trim() && !preferences.conditions.includes(newCondition.trim())) {
      setPreferences({
        ...preferences,
        conditions: [...preferences.conditions, newCondition.trim()]
      });
      setNewCondition('');
    }
  };

  const handleRemoveCondition = (condition) => {
    setPreferences({
      ...preferences,
      conditions: preferences.conditions.filter(c => c !== condition)
    });
  };

  // Load preferences from localStorage on mount
  React.useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    }
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Profile & Preferences
      </Typography>

      <Paper sx={{ p: 4, mt: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Preferences
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          These preferences help us provide personalized recommendations.
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Diet Preference</InputLabel>
          <Select
            value={preferences.diet}
            onChange={(e) => setPreferences({ ...preferences, diet: e.target.value })}
            label="Diet Preference"
          >
            <MenuItem value="none">None</MenuItem>
            <MenuItem value="vegetarian">Vegetarian</MenuItem>
            <MenuItem value="vegan">Vegan</MenuItem>
            <MenuItem value="non-vegetarian">Non-Vegetarian</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Age"
          type="number"
          value={preferences.age}
          onChange={(e) => setPreferences({ ...preferences, age: e.target.value })}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Gender</InputLabel>
          <Select
            value={preferences.gender}
            onChange={(e) => setPreferences({ ...preferences, gender: e.target.value })}
            label="Gender"
          >
            <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Health Conditions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {preferences.conditions.map((condition) => (
              <Chip
                key={condition}
                label={condition}
                onDelete={() => handleRemoveCondition(condition)}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Add condition (e.g., Diabetes, Thyroid)"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddCondition();
                }
              }}
            />
            <Button onClick={handleAddCondition}>Add</Button>
          </Box>
        </Box>

        {message && (
          <Alert severity={message.includes('Error') ? 'error' : 'success'} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          fullWidth
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Paper>
    </Container>
  );
};

export default Profile;
