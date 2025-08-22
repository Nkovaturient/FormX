import { useState, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  Download, 
  AlertCircle,
  Loader,
  User,
  Shield,
  Zap,
  AlertTriangle,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { formService, type FormProcessingResult, type UserData } from '../api/index.js';
import { FormValidator } from '../utils/formValidation.js';

interface FormField {
  field: string;
  type: string;
  required: boolean;
  description: string;
  validation?: any;
  options?: string[];
  originalField?: any;
}

interface FormRequirements {
  requiredInfo: FormField[];
  requiredDocuments: any[];
  optionalInfo: FormField[];
  validationRules: any;
  formFields: {
    textFields: any[];
    checkboxes: any[];
    radioButtons: any[];
    signatures: any[];
    tables: any[];
  };
  formType: string;
  totalFields: number;
  confidence: number;
}

interface FormProcessingProps {
  onComplete?: (result: FormProcessingResult) => void;
}

const FormProcessing: React.FC<FormProcessingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'data-collection' | 'processing' | 'complete'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingResult, setProcessingResult] = useState<FormProcessingResult | null>(null);
  const [formRequirements, setFormRequirements] = useState<FormRequirements | null>(null);
  const [userData, setUserData] = useState<UserData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      nationality: ''
    },
    contactInfo: {
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    professionalInfo: {
      occupation: '',
      employer: '',
      experience: '',
      education: ''
    },
    documents: []
  });
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string[]>>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  const handleFileUpload = useCallback(async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setError(null);
    setProgress(10);

    try {
      // Start form processing
      const result = await formService.startFormProcessing(file);
      setProcessingResult(result);
      setProgress(30);

      if (result.status === 'data_collection_required' && result.dataRequirements) {
        setFormRequirements(result.dataRequirements);
        setCurrentStep('data-collection');
        setIsProcessing(false);
        
        // Initialize dynamic fields with empty values
        const initialDynamicFields: Record<string, any> = {};
        result.dataRequirements.requiredInfo.forEach((field: FormField) => {
          initialDynamicFields[field.field] = '';
        });
        result.dataRequirements.optionalInfo.forEach((field: FormField) => {
          initialDynamicFields[field.field] = '';
        });
        setDynamicFields(initialDynamicFields);
      } else {
        setCurrentStep('processing');
        await pollProcessingStatus(result.processingId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsProcessing(false);
    }
  }, []);

  const pollProcessingStatus = useCallback(async (processingId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await formService.getProcessingStatus(processingId);
        setProgress(30 + (attempts / maxAttempts) * 60);

        if (status.status === 'completed') {
          setProcessingResult(status);
          setCurrentStep('complete');
          setIsProcessing(false);
          setProgress(100);
          onComplete?.(status);
          return;
        } else if (status.status === 'failed') {
          setError('Processing failed. Please try again.');
          setIsProcessing(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setError('Processing timeout. Please check back later.');
          setIsProcessing(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Status check failed');
        setIsProcessing(false);
      }
    };

    poll();
  }, [onComplete]);

  const validateField = useCallback((fieldPath: string, value: any) => {
    // First try dynamic field validation from server requirements
    if (formRequirements?.validationRules[fieldPath]) {
      const rule = formRequirements.validationRules[fieldPath];
      const isValid = !rule.pattern || new RegExp(rule.pattern).test(value);
      
      if (!isValid) {
        setValidationErrors(prev => ({
          ...prev,
          [fieldPath]: [rule.message]
        }));
        return false;
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldPath];
          return newErrors;
        });
        return true;
      }
    }

    // Fallback to existing validation
    const rules = FormValidator.getFieldRules(fieldPath);
    const validation = FormValidator.validateFieldRealTime(fieldPath, value, rules);
    
    if (!validation.isValid) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldPath]: validation.errors
      }));
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    }

    return validation.isValid;
  }, [formRequirements]);

  const handleFieldChange = useCallback((fieldPath: string, value: any) => {
    setUserData(prev => {
      const newData = { ...prev };
      const pathParts = fieldPath.split('.');
      let current: any = newData;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
      
      return newData;
    });

    // Validate field if it has been touched
    if (fieldTouched[fieldPath]) {
      validateField(fieldPath, value);
    }
  }, [fieldTouched, validateField]);

  const handleFieldBlur = useCallback((fieldPath: string) => {
    setFieldTouched(prev => ({ ...prev, [fieldPath]: true }));
    const value = getFieldValue(fieldPath);
    validateField(fieldPath, value);
  }, [validateField]);

  const getFieldValue = useCallback((fieldPath: string) => {
    const pathParts = fieldPath.split('.');
    let current: any = userData;
    
    for (const part of pathParts) {
      current = current[part];
      if (current === undefined) return '';
    }
    
    return current;
  }, [userData]);

  const getFieldError = useCallback((fieldPath: string) => {
    return validationErrors[fieldPath]?.[0] || '';
  }, [validationErrors]);

  const getFieldWarning = useCallback((fieldPath: string) => {
    return validationWarnings[fieldPath]?.[0] || '';
  }, [validationWarnings]);

  // Dynamic field handling functions
  const handleDynamicFieldChange = useCallback((fieldName: string, value: any) => {
    setDynamicFields(prev => ({
      ...prev,
      [fieldName]: value
    }));

    if (fieldTouched[fieldName]) {
      validateField(fieldName, value);
    }
  }, [fieldTouched, validateField]);

  const handleDynamicFieldBlur = useCallback((fieldName: string) => {
    setFieldTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, dynamicFields[fieldName]);
  }, [validateField, dynamicFields]);

  const getDynamicFieldValue = useCallback((fieldName: string) => {
    return dynamicFields[fieldName] || '';
  }, [dynamicFields]);

  const getDynamicFieldError = useCallback((fieldName: string) => {
    return validationErrors[fieldName]?.[0] || '';
  }, [validationErrors]);

  const handleUserDataSubmit = useCallback(async () => {
    if (!processingResult?.processingId) {
      setError('No processing session found');
      return;
    }

    // Validate all fields
    const validation = FormValidator.validateUserData(userData);
    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);

    // Validate dynamic fields
    const dynamicErrors: Record<string, string[]> = {};
    let hasDynamicErrors = false;

    formRequirements?.requiredInfo.forEach((field: FormField) => {
      const value = dynamicFields[field.field];
      if (field.required && (!value || value.trim() === '')) {
        dynamicErrors[field.field] = [`${field.description} is required`];
        hasDynamicErrors = true;
      } else if (value && !validateField(field.field, value)) {
        hasDynamicErrors = true;
      }
    });

    if (!validation.isValid || hasDynamicErrors) {
      setValidationErrors({ ...validation.errors, ...dynamicErrors });
      setError('Please correct the errors before submitting');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(40);

    try {
      // Ensure userData has proper structure with defaults
      const sanitizedUserData = {
        personalInfo: {
          firstName: userData.personalInfo?.firstName || '',
          lastName: userData.personalInfo?.lastName || '',
          dateOfBirth: userData.personalInfo?.dateOfBirth || '',
          gender: userData.personalInfo?.gender || '',
          nationality: userData.personalInfo?.nationality || ''
        },
        contactInfo: {
          email: userData.contactInfo?.email || '',
          phone: userData.contactInfo?.phone || '',
          address: {
            street: userData.contactInfo?.address?.street || '',
            city: userData.contactInfo?.address?.city || '',
            state: userData.contactInfo?.address?.state || '',
            zipCode: userData.contactInfo?.address?.zipCode || '',
            country: userData.contactInfo?.address?.country || ''
          }
        },
        professionalInfo: {
          occupation: userData.professionalInfo?.occupation || '',
          employer: userData.professionalInfo?.employer || '',
          experience: userData.professionalInfo?.experience || '',
          education: userData.professionalInfo?.education || ''
        },
        documents: userData.documents || []
      };

      // Combine userData with dynamic fields
      const combinedData = {
        ...sanitizedUserData,
        dynamicFields: dynamicFields
      };

      const result = await formService.submitUserData(processingResult.processingId, combinedData);
      setProcessingResult(result);
      setProgress(60);

      if (result.status === 'completed') {
        setCurrentStep('complete');
        setIsProcessing(false);
        setProgress(100);
        onComplete?.(result);
      } else if (result.status === 'verification_failed') {
        setError('Data verification failed. Please check your information.');
        setIsProcessing(false);
      } else {
        setCurrentStep('processing');
        await pollProcessingStatus(result.processingId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Data submission failed');
      setIsProcessing(false);
    }
  }, [processingResult, userData, dynamicFields, formRequirements, validateField, pollProcessingStatus, onComplete]);

  const handleDownload = useCallback(async () => {
    if (!processingResult?.result?.downloadUrl) return;

    try {
      const blob = await formService.downloadProcessedForm(processingResult.result.downloadUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed-form-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }, [processingResult]);

  const resetForm = useCallback(() => {
    setCurrentStep('upload');
    setSelectedFile(null);
    setProcessingResult(null);
    setFormRequirements(null);
    setUserData({
      personalInfo: { firstName: '', lastName: '', dateOfBirth: '', gender: '', nationality: '' },
      contactInfo: { email: '', phone: '', address: { street: '', city: '', state: '', zipCode: '', country: '' } },
      professionalInfo: { occupation: '', employer: '', experience: '', education: '' },
      documents: []
    });
    setDynamicFields({});
    setIsProcessing(false);
    setError(null);
    setProgress(0);
    setValidationErrors({});
    setValidationWarnings({});
    setFieldTouched({});
  }, []);

  const renderField = useCallback((fieldPath: string, label: string, type: string = 'text', required: boolean = false, options?: string[]) => {
    const value = getFieldValue(fieldPath);
    const error = getFieldError(fieldPath);
    const warning = getFieldWarning(fieldPath);
    const isTouched = fieldTouched[fieldPath];

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
                 {type === 'select' ? (
           <select
             value={value as string}
             onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
             onBlur={() => handleFieldBlur(fieldPath)}
             className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
               error ? 'border-red-300' : warning ? 'border-yellow-300' : 'border-gray-300'
             }`}
           >
             <option value="">Select {label}</option>
             {options?.map(option => (
               <option key={option} value={option}>{option}</option>
             ))}
           </select>
         ) : (
           <input
             type={type}
             value={value as string}
             onChange={(e) => handleFieldChange(fieldPath, e.target.value)}
             onBlur={() => handleFieldBlur(fieldPath)}
             className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
               error ? 'border-red-300' : warning ? 'border-yellow-300' : 'border-gray-300'
             }`}
             required={required}
           />
         )}
        
        {error && isTouched && (
          <p className="text-red-600 text-sm mt-1">{error}</p>
        )}
        
        {warning && !error && (
          <p className="text-yellow-600 text-sm mt-1 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {warning}
          </p>
        )}
      </div>
    );
  }, [getFieldValue, getFieldError, getFieldWarning, fieldTouched, handleFieldChange, handleFieldBlur]);

  const renderDynamicField = useCallback((field: FormField) => {
    const value = getDynamicFieldValue(field.field);
    const error = getDynamicFieldError(field.field);
    const isTouched = fieldTouched[field.field];

    return (
      <div key={field.field} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.description} {field.required && <span className="text-red-500">*</span>}
        </label>
        
        {field.type === 'radio' && field.options ? (
          <div className="space-y-2">
            {field.options.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={field.field}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleDynamicFieldChange(field.field, e.target.value)}
                  onBlur={() => handleDynamicFieldBlur(field.field)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        ) : field.type === 'checkbox' && field.options ? (
          <div className="space-y-2">
            {field.options.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option);
                    handleDynamicFieldChange(field.field, newValues);
                  }}
                  onBlur={() => handleDynamicFieldBlur(field.field)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        ) : field.type === 'date' ? (
          <input
            type="date"
            value={value}
            onChange={(e) => handleDynamicFieldChange(field.field, e.target.value)}
            onBlur={() => handleDynamicFieldBlur(field.field)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error && isTouched ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        ) : field.type === 'email' ? (
          <input
            type="email"
            value={value}
            onChange={(e) => handleDynamicFieldChange(field.field, e.target.value)}
            onBlur={() => handleDynamicFieldBlur(field.field)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error && isTouched ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        ) : field.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleDynamicFieldChange(field.field, e.target.value)}
            onBlur={() => handleDynamicFieldBlur(field.field)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error && isTouched ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleDynamicFieldChange(field.field, e.target.value)}
            onBlur={() => handleDynamicFieldBlur(field.field)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              error && isTouched ? 'border-red-300' : 'border-gray-300'
            }`}
          />
        )}
        
        {error && isTouched && (
          <p className="text-red-600 text-sm mt-1">{error}</p>
        )}
      </div>
    );
  }, [getDynamicFieldValue, getDynamicFieldError, fieldTouched, handleDynamicFieldChange, handleDynamicFieldBlur]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Step 1: File Upload */}
      {currentStep === 'upload' && (
        <div className="text-center">
          <div className="mb-8">
            <Upload className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Form</h2>
            <p className="text-gray-600">Upload any form (PDF, image, document) and we'll process it for you</p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-400 transition-colors">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tiff,.html,.json"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isProcessing ? 'Processing...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-gray-500">PDF, JPG, PNG, TIFF, HTML, or JSON files</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Data Collection */}
      {currentStep === 'data-collection' && processingResult && (
        <div>
          <div className="mb-8">
            <User className="h-16 w-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Analysis Complete</h2>
            <p className="text-gray-600">We've analyzed your form and need the following information</p>
            
            {/* Form Analysis Summary */}
            {formRequirements && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-blue-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {formRequirements.formType || 'Form'} Analysis
                    </p>
                    <p className="text-sm text-blue-600">
                      {formRequirements.totalFields || 0} fields detected • 
                      Confidence: {Math.round((formRequirements.confidence || 0) * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleUserDataSubmit(); }}>
            <div className="space-y-6">
              {/* Dynamic Required Fields from Form Analysis */}
              {formRequirements?.requiredInfo.length ? (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formRequirements.requiredInfo.map(renderDynamicField)}
                  </div>
                </div>
              ) : null}

              {/* Dynamic Optional Fields from Form Analysis */}
              {formRequirements?.optionalInfo.length ? (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Optional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formRequirements.optionalInfo.map(renderDynamicField)}
                  </div>
                </div>
              ) : null}

              {/* Standard Personal Information (fallback) */}
              {(!formRequirements || (!formRequirements.requiredInfo.length && !formRequirements.optionalInfo.length)) && (
                <>
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderField('personalInfo.firstName', 'First Name', 'text', true)}
                      {renderField('personalInfo.lastName', 'Last Name', 'text', true)}
                      {renderField('personalInfo.dateOfBirth', 'Date of Birth', 'date')}
                      {renderField('personalInfo.gender', 'Gender', 'select', false, ['Male', 'Female', 'Other'])}
                    </div>
                  </div>

                  <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderField('contactInfo.email', 'Email', 'email', true)}
                      {renderField('contactInfo.phone', 'Phone', 'tel')}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                  disabled={isProcessing}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isProcessing || Object.keys(validationErrors).length > 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Process Form
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Processing */}
      {currentStep === 'processing' && (
        <div className="text-center">
          <div className="mb-8">
            <Loader className="h-16 w-16 text-primary-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Form</h2>
            <p className="text-gray-600">Our AI is analyzing and filling your form. This may take a few minutes.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Form Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Data Verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary-500 animate-pulse" />
                <span className="text-gray-700">Form Filling</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {currentStep === 'complete' && processingResult && (
        <div className="text-center">
          <div className="mb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Processing Complete!</h2>
            <p className="text-gray-600">Your form has been successfully processed and is ready for download.</p>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Shield className="h-8 w-8 text-green-500" />
                <span className="text-lg font-medium text-gray-900">Form Successfully Filled</span>
              </div>
              <p className="text-gray-600 mb-4">
                Your form has been processed with {processingResult.analysis?.confidence || 95}% accuracy.
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDownload}
                className="btn-primary"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Form
              </button>
              <button
                onClick={resetForm}
                className="btn-secondary"
              >
                Process Another Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormProcessing; 