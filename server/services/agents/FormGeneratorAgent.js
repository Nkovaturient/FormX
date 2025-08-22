const { groqClient, modelConfigs, makeGroqCall } = require('../../config/groq');

class FormGeneratorAgent {
  constructor() {
    this.client = groqClient;
  }

  async generateOptimizedForm(request) {
    const startTime = Date.now();
    
    try {
      console.log('Generating optimized form based on requirements');

      // Generate different aspects of the form
      const [
        formStructure,
        formConfiguration,
        formImplementation,
        formValidation,
        formAnalytics,
        formDeployment
      ] = await Promise.all([
        this.generateFormStructure(request),
        this.generateFormConfiguration(request),
        this.generateFormImplementation(request),
        this.generateFormValidation(request),
        this.generateFormAnalytics(request),
        this.generateFormDeployment(request)
      ]);

      return {
        id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          purpose: request.purpose,
          targetAudience: request.targetAudience,
          industry: request.industry,
          useCase: request.useCase,
          generatedAt: new Date().toISOString(),
          processingTime: Date.now() - startTime
        },
        structure: formStructure,
        configuration: formConfiguration,
        implementation: formImplementation,
        validation: formValidation,
        analytics: formAnalytics,
        deployment: formDeployment,
        status: 'completed' 
      };

    } catch (error) {
      console.error('Form generation failed:', error);
      throw new Error(`Form generation failed: ${error.status || error.code} ${JSON.stringify(error.error || error)}`);
    }
  }

  async generateFormStructure(request) {
    const prompt = `
      Generate an optimized form structure based on the following requirements:
      
      Requirements:
      ${JSON.stringify(request, null, 2)}
      
      Create a comprehensive form structure including:
      
      1. Form Layout: Optimal layout for the specified use case
      2. Field Organization: Logical grouping of fields
      3. Section Structure: Well-organized sections
      4. Navigation Flow: Intuitive user flow
      5. Field Types: Appropriate field types for each requirement
      6. Progressive Disclosure: Multi-step form if needed
      7. Mobile Optimization: Mobile-friendly structure
      
      IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or explanatory text.
      The response must be parseable JSON.
      
      Expected JSON structure:
      {
        "layout": "single-page|multi-step|wizard",
        "sections": [
          {
            "id": "string",
            "title": "string",
            "description": "string",
            "fields": ["array of field IDs"],
            "order": number,
            "conditional": boolean
          }
        ],
        "fields": [
          {
            "id": "string",
            "type": "text|email|phone|date|select|checkbox|radio|textarea|file",
            "label": "string",
            "placeholder": "string",
            "required": boolean,
            "validation": {},
            "options": ["array for select/radio"],
            "section": "string"
          }
        ],
        "navigation": {
          "type": "linear|non-linear",
          "steps": [],
          "progressIndicator": boolean
        }
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formGeneration, prompt);
      return this.parseFormStructure(response);
    } catch (error) {
      console.error('Form structure generation failed:', error);
      return this.getDefaultFormStructure(request);
    }
  }

  async generateFormConfiguration(request) {
    const prompt = `
      Generate form configuration settings based on the requirements:
      
      Requirements:
      ${JSON.stringify(request, null, 2)}
      
      Create configuration for:
      
      1. Form Settings: Basic form configuration
      2. Styling: CSS and design settings
      3. Behavior: Form behavior and interactions
      4. Integration: Third-party integrations
      5. Security: Security settings and validations
      6. Performance: Performance optimization settings
      
      IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or explanatory text.
      The response must be parseable JSON.
      
      Expected JSON structure:
      {
        "settings": {
          "autoSave": boolean,
          "showProgress": boolean,
          "enableValidation": boolean
        },
        "styling": {
          "theme": "string",
          "primaryColor": "string",
          "borderRadius": "string"
        },
        "behavior": {
          "submitOnEnter": boolean,
          "clearOnSubmit": boolean,
          "showSuccessMessage": boolean
        },
        "integration": {
          "googleAnalytics": boolean,
          "emailService": boolean
        },
        "security": {
          "csrfProtection": boolean,
          "rateLimiting": boolean
        },
        "performance": {
          "lazyLoading": boolean,
          "caching": boolean
        }
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formGeneration, prompt);
      return this.parseFormConfiguration(response);
    } catch (error) {
      console.error('Form configuration generation failed:', error);
      return this.getDefaultFormConfiguration();
    }
  }

  async generateFormImplementation(request) {
    const prompt = `
      Generate implementation code for the optimized form:
      
      Requirements:
      ${JSON.stringify(request, null, 2)}
      
      Generate implementation including:
      
      1. HTML Structure: Semantic HTML markup
      2. CSS Styling: Responsive and accessible styling
      3. JavaScript Logic: Form handling and validation
      4. React Components: If React is specified
      5. Accessibility: ARIA labels and keyboard navigation
      6. Responsive Design: Mobile-first approach
      
      IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or explanatory text.
      The response must be parseable JSON.
      
      Expected JSON structure:
      {
        "html": "string",
        "css": "string",
        "javascript": "string",
        "react": "string|null",
        "accessibility": {
          "ariaLabels": boolean,
          "keyboardNavigation": boolean
        },
        "responsive": {
          "mobileFirst": boolean,
          "breakpoints": ["array"]
        }
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formGeneration, prompt);
      return this.parseFormImplementation(response);
    } catch (error) {
      console.error('Form implementation generation failed:', error);
      return this.getDefaultFormImplementation();
    }
  }

  async generateFormValidation(request) {
    const prompt = `
      Generate validation rules for the form based on requirements:
      
      Requirements:
      ${JSON.stringify(request, null, 2)}
      
      Create validation for:
      
      1. Field Validation: Individual field validation rules
      2. Cross-field Validation: Validation between related fields
      3. Business Logic: Business-specific validation rules
      4. Error Messages: User-friendly error messages
      5. Real-time Validation: Client-side validation
      6. Server-side Validation: Backend validation rules
      
      IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or explanatory text.
      The response must be parseable JSON.
      
      Expected JSON structure:
      {
        "fieldValidation": {
          "fieldName": {
            "required": boolean,
            "minLength": number,
            "maxLength": number,
            "pattern": "string"
          }
        },
        "crossFieldValidation": [],
        "businessLogic": [],
        "errorMessages": {
          "required": "string",
          "email": "string"
        },
        "realTimeValidation": boolean,
        "serverValidation": boolean
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formGeneration, prompt);
      return this.parseFormValidation(response);
    } catch (error) {
      console.error('Form validation generation failed:', error);
      return this.getDefaultFormValidation();
    }
  }

  async generateFormAnalytics(request) {
    const prompt = `
      Generate analytics configuration for the form:
      
      Requirements:
      ${JSON.stringify(request, null, 2)}
      
      Create analytics for:
      
      1. Conversion Tracking: Form completion tracking
      2. User Behavior: User interaction analytics
      3. Performance Metrics: Form performance tracking
      4. Error Tracking: Error and validation failure tracking
      5. A/B Testing: Testing configuration
      6. Reporting: Analytics reporting setup
      
      IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or explanatory text.
      The response must be parseable JSON.
      
      Expected JSON structure:
      {
        "conversionTracking": {
          "enabled": boolean,
          "goals": ["array"]
        },
        "userBehavior": {
          "enabled": boolean,
          "events": ["array"]
        },
        "performanceMetrics": {
          "enabled": boolean,
          "metrics": ["array"]
        },
        "errorTracking": {
          "enabled": boolean,
          "trackValidationErrors": boolean
        },
        "abTesting": {
          "enabled": boolean,
          "variants": []
        },
        "reporting": {
          "enabled": boolean,
          "frequency": "string"
        }
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formGeneration, prompt);
      return this.parseFormAnalytics(response);
    } catch (error) {
      console.error('Form analytics generation failed:', error);
      return this.getDefaultFormAnalytics();
    }
  }

  async generateFormDeployment(request) {
    const prompt = `
      Generate deployment configuration for the form:
      
      Requirements:
      ${JSON.stringify(request, null, 2)}
      
      Create deployment for:
      
      1. Hosting: Hosting platform configuration
      2. CDN: Content delivery network setup
      3. SSL: Security certificate configuration
      4. Domain: Domain and subdomain setup
      5. Environment: Development/staging/production setup
      6. Monitoring: Performance and error monitoring
      
      IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or explanatory text.
      The response must be parseable JSON.
      
      Expected JSON structure:
      {
        "hosting": {
          "platform": "string",
          "provider": "string"
        },
        "cdn": {
          "enabled": boolean,
          "provider": "string"
        },
        "ssl": {
          "enabled": boolean,
          "certificate": "string"
        },
        "domain": {
          "custom": boolean,
          "subdomain": "string"
        },
        "environment": {
          "development": "string",
          "staging": "string",
          "production": "string"
        },
        "monitoring": {
          "enabled": boolean,
          "uptime": boolean,
          "performance": boolean
        }
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formGeneration, prompt);
      return this.parseFormDeployment(response);
    } catch (error) {
      console.error('Form deployment generation failed:', error);
      return this.getDefaultFormDeployment();
    }
  }

  parseFormStructure(response) {
    try {
      // Try multiple parsing strategies
      let parsed = this.tryParseJSON(response);
      if (parsed) return parsed;
      
      // If direct parsing fails, try to extract JSON from markdown or other formats
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = this.tryParseJSON(jsonMatch[0]);
        if (parsed) return parsed;
      }
      
      console.warn('Failed to parse form structure, using default');
      return this.getDefaultFormStructure(request);
    } catch (error) {
      console.error('Failed to parse form structure:', error);
      return this.getDefaultFormStructure();
    }
  }

  parseFormConfiguration(response) {
    try {
      let parsed = this.tryParseJSON(response);
      if (parsed) return parsed;
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = this.tryParseJSON(jsonMatch[0]);
        if (parsed) return parsed;
      }
      
      console.warn('Failed to parse form configuration, using default');
      return this.getDefaultFormConfiguration();
    } catch (error) {
      console.error('Failed to parse form configuration:', error);
      return this.getDefaultFormConfiguration();
    }
  }

  parseFormImplementation(response) {
    try {
      let parsed = this.tryParseJSON(response);
      if (parsed) return parsed;
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = this.tryParseJSON(jsonMatch[0]);
        if (parsed) return parsed;
      }
      
      console.warn('Failed to parse form implementation, using default');
      return this.getDefaultFormImplementation();
    } catch (error) {
      console.error('Failed to parse form implementation:', error);
      return this.getDefaultFormImplementation();
    }
  }

  parseFormValidation(response) {
    try {
      let parsed = this.tryParseJSON(response);
      if (parsed) return parsed;
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = this.tryParseJSON(jsonMatch[0]);
        if (parsed) return parsed;
      }
      
      console.warn('Failed to parse form validation, using default');
      return this.getDefaultFormValidation();
    } catch (error) {
      console.error('Failed to parse form validation:', error);
      return this.getDefaultFormValidation();
    }
  }

  parseFormAnalytics(response) {
    try {
      let parsed = this.tryParseJSON(response);
      if (parsed) return parsed;
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = this.tryParseJSON(jsonMatch[0]);
        if (parsed) return parsed;
      }
      
      console.warn('Failed to parse form analytics, using default');
      return this.getDefaultFormAnalytics();
    } catch (error) {
      console.error('Failed to parse form analytics:', error);
      return this.getDefaultFormAnalytics();
    }
  }

  parseFormDeployment(response) {
    try {
      let parsed = this.tryParseJSON(response);
      if (parsed) return parsed;
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = this.tryParseJSON(jsonMatch[0]);
        if (parsed) return parsed;
      }
      
      console.warn('Failed to parse form deployment, using default');
      return this.getDefaultFormDeployment();
    } catch (error) {
      console.error('Failed to parse form deployment:', error);
      return this.getDefaultFormDeployment();
    }
  }

  // Helper method to try multiple JSON parsing strategies
  tryParseJSON(text) {
    if (!text || typeof text !== 'string') return null;
    
    // Strategy 1: Direct JSON parse
    try {
      return JSON.parse(text);
    } catch (e) {
      // Strategy 2: Try to fix common issues
      let cleaned = text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\\n/g, '\\n') // Fix newlines
        .replace(/\\r/g, '\\r') // Fix carriage returns
        .replace(/\\t/g, '\\t') // Fix tabs
        .replace(/\\"/g, '\\"') // Fix quotes
        .replace(/\\'/g, "\\'") // Fix single quotes
        .replace(/\\\\/g, '\\\\'); // Fix backslashes
      
      try {
        return JSON.parse(cleaned);
      } catch (e2) {
        // Strategy 3: Try to extract JSON from markdown code blocks
        const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          try {
            return JSON.parse(codeBlockMatch[1]);
          } catch (e3) {
            // Strategy 4: Try to find the largest JSON object
            const jsonMatches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
            if (jsonMatches) {
              // Find the largest match
              const largestMatch = jsonMatches.reduce((largest, current) => 
                current.length > largest.length ? current : largest
              );
              try {
                return JSON.parse(largestMatch);
              } catch (e4) {
                return null;
              }
            }
          }
        }
      }
    }
    
    return null;
  }

  getDefaultFormStructure(request) {
    // Generate fields based on user requirements
    const fields = [];
    const fieldIds = [];
    
    // Add required fields
    if (request.requiredFields && Array.isArray(request.requiredFields)) {
      request.requiredFields.forEach((fieldName, index) => {
        if (fieldName && fieldName.trim()) {
          const fieldId = fieldName.toLowerCase().replace(/\s+/g, '_');
          fieldIds.push(fieldId);
          
          // Determine field type based on field name
          let fieldType = 'text';
          let placeholder = `Enter ${fieldName.toLowerCase()}`;
          
          if (fieldName.toLowerCase().includes('email')) {
            fieldType = 'email';
            placeholder = 'Enter your email address';
          } else if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('mobile')) {
            fieldType = 'phone';
            placeholder = 'Enter your phone number';
          } else if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('birth')) {
            fieldType = 'date';
            placeholder = 'Select date';
          } else if (fieldName.toLowerCase().includes('address')) {
            fieldType = 'textarea';
            placeholder = 'Enter your address';
          }
          
          fields.push({
            id: fieldId,
            type: fieldType,
            label: fieldName,
            placeholder: placeholder,
            required: true,
            validation: {
              required: true,
              minLength: fieldType === 'email' ? 5 : 2,
              maxLength: fieldType === 'textarea' ? 500 : 100
            },
            section: 'main'
          });
        }
      });
    }
    
    // Add optional fields
    if (request.optionalFields && Array.isArray(request.optionalFields)) {
      request.optionalFields.forEach((fieldName, index) => {
        if (fieldName && fieldName.trim()) {
          const fieldId = fieldName.toLowerCase().replace(/\s+/g, '_');
          fieldIds.push(fieldId);
          
          // Determine field type based on field name
          let fieldType = 'text';
          let placeholder = `Enter ${fieldName.toLowerCase()}`;
          
          if (fieldName.toLowerCase().includes('email')) {
            fieldType = 'email';
            placeholder = 'Enter your email address';
          } else if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('mobile')) {
            fieldType = 'phone';
            placeholder = 'Enter your phone number';
          } else if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('birth')) {
            fieldType = 'date';
            placeholder = 'Select date';
          } else if (fieldName.toLowerCase().includes('address')) {
            fieldType = 'textarea';
            placeholder = 'Enter your address';
          }
          
          fields.push({
            id: fieldId,
            type: fieldType,
            label: fieldName,
            placeholder: placeholder,
            required: false,
            validation: {
              required: false,
              minLength: fieldType === 'email' ? 5 : 2,
              maxLength: fieldType === 'textarea' ? 500 : 100
            },
            section: 'main'
          });
        }
      });
    }
    
    // If no fields were specified, add some default fields
    if (fields.length === 0) {
      fields.push(
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true,
          validation: { required: true, minLength: 2, maxLength: 100 },
          section: 'main'
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'Enter your email address',
          required: true,
          validation: { required: true, pattern: 'email' },
          section: 'main'
        }
      );
      fieldIds.push('name', 'email');
    }
    
    return {
      layout: request.designPreferences?.layout === 'multi-step' ? 'multi-step' : 'single-page',
      sections: [
        {
          id: 'main',
          title: request.purpose || 'Main Information',
          description: request.useCase || 'Please provide the required information',
          fields: fieldIds,
          order: 1,
          conditional: false
        }
      ],
      fields: fields,
      navigation: {
        type: 'linear',
        steps: request.designPreferences?.layout === 'multi-step' ? [
          { id: 'main', title: 'Main Information', order: 1 }
        ] : [],
        progressIndicator: request.designPreferences?.progressIndicator || false
      }
    };
  }

  getDefaultFormConfiguration() {
    return {
      settings: {
        autoSave: true,
        showProgress: true,
        enableValidation: true
      },
      styling: {
        theme: 'default',
        primaryColor: '#007bff',
        borderRadius: '4px'
      },
      behavior: {
        submitOnEnter: false,
        clearOnSubmit: true,
        showSuccessMessage: true
      },
      integration: {
        googleAnalytics: false,
        emailService: false
      },
      security: {
        csrfProtection: true,
        rateLimiting: true
      },
      performance: {
        lazyLoading: true,
        caching: true
      }
    };
  }

  getDefaultFormImplementation() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Form</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="form-container">
        <form id="generated-form" class="generated-form">
            <div class="form-header">
                <h1>Registration Form</h1>
                <p>Please fill out the form below</p>
            </div>
            
            <div class="form-section" id="main-section">
                <h2>Main Information</h2>
                <div class="form-fields">
                    <div class="form-field">
                        <label for="name">Full Name *</label>
                        <input type="text" id="name" name="name" required placeholder="Enter your full name">
                        <span class="error-message" id="name-error"></span>
                    </div>
                    
                    <div class="form-field">
                        <label for="email">Email Address *</label>
                        <input type="email" id="email" name="email" required placeholder="Enter your email address">
                        <span class="error-message" id="email-error"></span>
                    </div>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="submit-btn">Submit Form</button>
                <button type="reset" class="reset-btn">Reset</button>
            </div>
        </form>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`;

    const css = `
/* Generated Form Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

.form-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 40px;
    width: 100%;
    max-width: 600px;
}

.form-header {
    text-align: center;
    margin-bottom: 30px;
}

.form-header h1 {
    color: #333;
    font-size: 2rem;
    margin-bottom: 10px;
}

.form-header p {
    color: #666;
    font-size: 1rem;
}

.form-section {
    margin-bottom: 30px;
}

.form-section h2 {
    color: #333;
    font-size: 1.5rem;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f0f0f0;
}

.form-fields {
    display: grid;
    gap: 20px;
}

.form-field {
    display: flex;
    flex-direction: column;
}

.form-field label {
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
    font-size: 0.9rem;
}

.form-field input,
.form-field textarea,
.form-field select {
    padding: 12px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: #fafbfc;
}

.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-field input.error,
.form-field textarea.error,
.form-field select.error {
    border-color: #e74c3c;
    background: #fdf2f2;
}

.error-message {
    color: #e74c3c;
    font-size: 0.8rem;
    margin-top: 5px;
    min-height: 16px;
}

.form-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
}

.submit-btn,
.reset-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.submit-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.reset-btn {
    background: #f8f9fa;
    color: #6c757d;
    border: 2px solid #e9ecef;
}

.reset-btn:hover {
    background: #e9ecef;
    color: #495057;
}

/* Responsive Design */
@media (max-width: 768px) {
    .form-container {
        padding: 20px;
        margin: 10px;
    }
    
    .form-header h1 {
        font-size: 1.5rem;
    }
    
    .form-actions {
        flex-direction: column;
    }
    
    .submit-btn,
    .reset-btn {
        width: 100%;
    }
}

/* Loading States */
.submit-btn.loading {
    opacity: 0.7;
    cursor: not-allowed;
}

.submit-btn.loading::after {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-left: 8px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}`;

    const javascript = `
// Generated Form JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('generated-form');
    const submitBtn = form.querySelector('.submit-btn');
    
    // Form validation
    function validateField(field) {
        const value = field.value.trim();
        const errorElement = document.getElementById(field.id + '-error');
        
        // Clear previous error
        errorElement.textContent = '';
        field.classList.remove('error');
        
        // Required field validation
        if (field.hasAttribute('required') && !value) {
            errorElement.textContent = 'This field is required';
            field.classList.add('error');
            return false;
        }
        
        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            if (!emailRegex.test(value)) {
                errorElement.textContent = 'Please enter a valid email address';
                field.classList.add('error');
                return false;
            }
        }
        
        // Length validation
        if (field.hasAttribute('minlength')) {
            const minLength = parseInt(field.getAttribute('minlength'));
            if (value.length < minLength) {
                errorElement.textContent = \`Minimum \${minLength} characters required\`;
                field.classList.add('error');
                return false;
            }
        }
        
        if (field.hasAttribute('maxlength')) {
            const maxLength = parseInt(field.getAttribute('maxlength'));
            if (value.length > maxLength) {
                errorElement.textContent = \`Maximum \${maxLength} characters allowed\`;
                field.classList.add('error');
                return false;
            }
        }
        
        return true;
    }
    
    // Real-time validation
    form.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('blur', () => validateField(field));
        field.addEventListener('input', () => {
            if (field.classList.contains('error')) {
                validateField(field);
            }
        });
    });
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate all fields
        let isValid = true;
        form.querySelectorAll('input, textarea, select').forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            return;
        }
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.textContent = 'Submitting...';
        
        try {
            // Collect form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Simulate form submission
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show success message
            alert('Form submitted successfully!');
            form.reset();
            
        } catch (error) {
            console.error('Form submission error:', error);
            alert('An error occurred while submitting the form. Please try again.');
        } finally {
            // Reset button state
            submitBtn.classList.remove('loading');
            submitBtn.textContent = 'Submit Form';
        }
    });
    
    // Reset form
    form.querySelector('.reset-btn').addEventListener('click', function() {
        form.reset();
        form.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
        form.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });
    });
});`;

    return {
      html: html,
      css: css,
      javascript: javascript,
      react: null,
      accessibility: {
        ariaLabels: true,
        keyboardNavigation: true
      },
      responsive: {
        mobileFirst: true,
        breakpoints: ['sm', 'md', 'lg']
      }
    };
  }

  getDefaultFormValidation() {
    return {
      fieldValidation: {
        name: { required: true, minLength: 2 },
        email: { required: true, pattern: 'email' }
      },
      crossFieldValidation: [],
      businessLogic: [],
      errorMessages: {
        required: 'This field is required',
        email: 'Please enter a valid email address'
      },
      realTimeValidation: true,
      serverValidation: true
    };
  }

  getDefaultFormAnalytics() {
    return {
      conversionTracking: {
        enabled: true,
        goals: ['form_completion']
      },
      userBehavior: {
        enabled: true,
        events: ['field_focus', 'field_blur', 'validation_error']
      },
      performanceMetrics: {
        enabled: true,
        metrics: ['load_time', 'submit_time']
      },
      errorTracking: {
        enabled: true,
        trackValidationErrors: true
      },
      abTesting: {
        enabled: false,
        variants: []
      },
      reporting: {
        enabled: true,
        frequency: 'daily'
      }
    };
  }

  getDefaultFormDeployment() {
    return {
      hosting: {
        platform: 'static',
        provider: 'netlify'
      },
      cdn: {
        enabled: true,
        provider: 'cloudflare'
      },
      ssl: {
        enabled: true,
        certificate: 'auto'
      },
      domain: {
        custom: false,
        subdomain: 'forms'
      },
      environment: {
        development: 'http://localhost:3000',
        staging: 'https://staging.example.com',
        production: 'https://forms.example.com'
      },
      monitoring: {
        enabled: true,
        uptime: true,
        performance: true
      }
    };
  }
}

module.exports = { FormGeneratorAgent }; 