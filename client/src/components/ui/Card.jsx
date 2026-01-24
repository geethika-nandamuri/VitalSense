import React from 'react';
import { Card as MuiCard, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(MuiCard)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  border: '1px solid #f0f0f0',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    transform: 'translateY(-2px)',
  },
}));

const Card = ({ children, sx, ...props }) => {
  return (
    <StyledCard sx={sx} {...props}>
      <CardContent>
        {children}
      </CardContent>
    </StyledCard>
  );
};

export default Card;