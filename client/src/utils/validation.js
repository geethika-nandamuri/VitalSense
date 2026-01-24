export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

export const validateName = (name) => {
  return name.trim().length >= 2;
};

export const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    if (fieldRules.required && !validateRequired(value)) {
      errors[field] = `${fieldRules.label || field} is required`;
      return;
    }
    
    if (value && fieldRules.email && !validateEmail(value)) {
      errors[field] = 'Please enter a valid email address';
      return;
    }
    
    if (value && fieldRules.password && !validatePassword(value)) {
      errors[field] = 'Password must be at least 6 characters';
      return;
    }
    
    if (value && fieldRules.name && !validateName(value)) {
      errors[field] = 'Name must be at least 2 characters';
      return;
    }
    
    if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${fieldRules.label || field} must be at least ${fieldRules.minLength} characters`;
      return;
    }
    
    if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${fieldRules.label || field} must be less than ${fieldRules.maxLength} characters`;
      return;
    }
    
    if (fieldRules.match && value !== formData[fieldRules.match]) {
      errors[field] = 'Passwords do not match';
      return;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};