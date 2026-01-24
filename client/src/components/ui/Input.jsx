import React from 'react';
import { TextField } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: '#f8f9fa',
    '& fieldset': {
      borderColor: '#e9ecef',
    },
    '&:hover fieldset': {
      borderColor: '#667eea',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#667eea',
      borderWidth: '2px',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#6c757d',
    '&.Mui-focused': {
      color: '#667eea',
    },
  },
}));

const Input = ({ ...props }) => {
  return (
    <StyledTextField
      fullWidth
      variant="outlined"
      {...props}
    />
  );
};

export default Input;