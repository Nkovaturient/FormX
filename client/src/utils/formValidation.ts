export interface ValidationRule {
  type: 'required' | 'email' | 'phone' | 'date' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface FieldValidation {
  field: string;
  rules: ValidationRule[];
  value: any;
  isValid: boolean;
  errors: string[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export class FormValidator {
  private static emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
  private static datePattern = /^\d{4}-\d{2}-\d{2}$/;

  static validateField(field: string, value: any, rules: ValidationRule[]): FieldValidation {
    const errors: string[] = [];
    let isValid = true;

    for (const rule of rules) {
      const fieldValid = this.validateRule(value, rule);
      if (!fieldValid) {
        isValid = false;
        errors.push(rule.message);
      }
    }

    return {
      field,
      rules,
      value,
      isValid,
      errors
    };
  }

  private static validateRule(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return this.validateRequired(value);
      
      case 'email':
        return this.validateEmail(value);
      
      case 'phone':
        return this.validatePhone(value);
      
      case 'date':
        return this.validateDate(value);
      
      case 'minLength':
        return this.validateMinLength(value, rule.value);
      
      case 'maxLength':
        return this.validateMaxLength(value, rule.value);
      
      case 'pattern':
        return this.validatePattern(value, rule.value);
      
      case 'custom':
        return rule.validator ? rule.validator(value) : true;
      
      default:
        return true;
    }
  }

  private static validateRequired(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  private static validateEmail(value: string): boolean {
    if (!value) return true; // Skip if empty (use required rule for mandatory)
    return this.emailPattern.test(value);
  }

  private static validatePhone(value: string): boolean {
    if (!value) return true;
    return this.phonePattern.test(value.replace(/[\s\-\(\)]/g, ''));
  }

  private static validateDate(value: string): boolean {
    if (!value) return true;
    if (!this.datePattern.test(value)) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private static validateMinLength(value: string, minLength: number): boolean {
    if (!value) return true;
    return value.length >= minLength;
  }

  private static validateMaxLength(value: string, maxLength: number): boolean {
    if (!value) return true;
    return value.length <= maxLength;
  }

  private static validatePattern(value: string, pattern: RegExp): boolean {
    if (!value) return true;
    return pattern.test(value);
  }

  // Form-specific validation rules
  static getPersonalInfoRules() {
    return {
      firstName: [
        { type: 'required' as const, message: 'First name is required' },
        { type: 'minLength' as const, value: 2, message: 'First name must be at least 2 characters' },
        { type: 'maxLength' as const, value: 50, message: 'First name must be less than 50 characters' }
      ],
      lastName: [
        { type: 'required' as const, message: 'Last name is required' },
        { type: 'minLength' as const, value: 2, message: 'Last name must be at least 2 characters' },
        { type: 'maxLength' as const, value: 50, message: 'Last name must be less than 50 characters' }
      ],
      dateOfBirth: [
        { type: 'date' as const, message: 'Please enter a valid date' },
        {
          type: 'custom' as const,
          message: 'Date of birth must be in the past',
          validator: (value: string) => {
            if (!value) return true;
            const date = new Date(value);
            const today = new Date();
            return date < today;
          }
        }
      ],
      gender: [
        { type: 'required' as const, message: 'Please select a gender' }
      ]
    };
  }

  static getContactInfoRules() {
    return {
      email: [
        { type: 'required' as const, message: 'Email is required' },
        { type: 'email' as const, message: 'Please enter a valid email address' }
      ],
      phone: [
        { type: 'phone' as const, message: 'Please enter a valid phone number' }
      ]
    };
  }

  static getAddressRules() {
    return {
      street: [
        { type: 'minLength' as const, value: 5, message: 'Street address must be at least 5 characters' }
      ],
      city: [
        { type: 'required' as const, message: 'City is required' },
        { type: 'minLength' as const, value: 2, message: 'City must be at least 2 characters' }
      ],
      state: [
        { type: 'required' as const, message: 'State is required' }
      ],
      zipCode: [
        { type: 'pattern' as const, value: /^\d{5}(-\d{4})?$/, message: 'Please enter a valid ZIP code' }
      ]
    };
  }

  static validateUserData(userData: any): FormValidationResult {
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};
    let isValid = true;

    // Validate personal info
    const personalInfoRules = this.getPersonalInfoRules();
    for (const [field, rules] of Object.entries(personalInfoRules)) {
      const value = userData.personalInfo?.[field];
      const validation = this.validateField(field, value, rules);
      
      if (!validation.isValid) {
        errors[`personalInfo.${field}`] = validation.errors;
        isValid = false;
      }
    }

    // Validate contact info
    const contactInfoRules = this.getContactInfoRules();
    for (const [field, rules] of Object.entries(contactInfoRules)) {
      const value = userData.contactInfo?.[field];
      const validation = this.validateField(field, value, rules);
      
      if (!validation.isValid) {
        errors[`contactInfo.${field}`] = validation.errors;
        isValid = false;
      }
    }

    // Validate address if provided
    if (userData.contactInfo?.address) {
      const addressRules = this.getAddressRules();
      for (const [field, rules] of Object.entries(addressRules)) {
        const value = userData.contactInfo.address[field];
        const validation = this.validateField(field, value, rules);
        
        if (!validation.isValid) {
          errors[`contactInfo.address.${field}`] = validation.errors;
          isValid = false;
        }
      }
    }

    // Add warnings for missing optional fields
    if (!userData.contactInfo?.phone) {
      warnings['contactInfo.phone'] = ['Phone number is recommended for better form processing'];
    }

    if (!userData.personalInfo?.dateOfBirth) {
      warnings['personalInfo.dateOfBirth'] = ['Date of birth may be required for some forms'];
    }

    return {
      isValid,
      errors,
      warnings
    };
  }

  // Real-time validation for form fields
  static validateFieldRealTime(fieldPath: string, value: any, rules: ValidationRule[]): {
    isValid: boolean;
    errors: string[];
  } {
    const validation = this.validateField(fieldPath, value, rules);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  // Get field-specific rules
  static getFieldRules(fieldPath: string): ValidationRule[] {
    const [section, field] = fieldPath.split('.');
    
    switch (section) {
      case 'personalInfo':
        return this.getPersonalInfoRules()[field as keyof ReturnType<typeof this.getPersonalInfoRules>] || [];
      case 'contactInfo':
        if (field === 'address') return [];
        return this.getContactInfoRules()[field as keyof ReturnType<typeof this.getContactInfoRules>] || [];
      case 'address':
        return this.getAddressRules()[field as keyof ReturnType<typeof this.getAddressRules>] || [];
      default:
        return [];
    }
  }
} 