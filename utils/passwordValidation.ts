export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter (A-Z)',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter (a-z)',
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'At least one number (0-9)',
    test: (password: string) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'At least one special character (!@#$%^&*)',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
];

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  PASSWORD_REQUIREMENTS.forEach(requirement => {
    if (!requirement.test(password)) {
      errors.push(requirement.label);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  const validRequirements = PASSWORD_REQUIREMENTS.filter(req => req.test(password)).length;
  
  if (validRequirements < 3) return 'weak';
  if (validRequirements < 5) return 'medium';
  return 'strong';
};
