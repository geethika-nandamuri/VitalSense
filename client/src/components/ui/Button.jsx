import React from 'react';
import { Button as MuiButton } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton)(({ theme, variant }) => ({
  borderRadius: '8px',
  textTransform: 'none',
  fontWeight: 600,
  padding: '12px 24px',
  fontSize: '14px',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: variant === 'contained' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
  },
  ...(variant === 'contained' && {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '&:hover': {
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
    },
  }),
}));

const Button = ({ children, ...props }) => {
  return (
    <StyledButton {...props}>
      {children}
    </StyledButton>
  );
};

export default Button;