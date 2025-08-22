export interface FormProcessingRequest {
  options?: {
    preferences?: {
      outputFormat?: 'PDF' | 'DOCX' | 'HTML';
      includePreview?: boolean;
      autoDownload?: boolean;
    };
  };
}

export interface UserData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;
  };
  contactInfo: {
    email: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  professionalInfo?: {
    occupation?: string;
    employer?: string;
    experience?: string;
    education?: string;
  };
  documents?: Array<{
    type: string;
    name: string;
    file: File;
  }>;
  dynamicFields?: Record<string, any>;
}

export interface FormProcessingResult {
  processingId: string;
  status: string;
  analysis?: any;
  dataRequirements?: any;
  nextStep?: string;
  estimatedTime?: string;
  result?: {
    downloadUrl?: string;
    previewUrl?: string;
    formats?: string[];
  };
}

export interface FormAnalysisResponse {
  analysisId: string;
  status: string;
  summary: {
    filesProcessed: number;
    totalFields: number;
    confidence: number;
    processingTime: number;
  };
  results: {
    id: string;
    userId: string;
    timestamp: string;
    processingTime: number;
    documents: number;
    extractedData: any;
    analysis: any;
    recommendations: any[];
    metadata: any;
    confidence: number;
  };
}


import apiClient from '../config/api.js';

export class FormService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (userId) {
      headers['user'] = userId;
    }
    
    return headers;
  }

  async startFormProcessing(file: File, options?: any): Promise<FormProcessingResult> {
    try {
      const formData = new FormData();
      formData.append('form', file);
      
      if (options) {
        formData.append('options', JSON.stringify(options));
      }

      const authHeaders = this.getAuthHeaders();
      
      const response = await fetch(`${apiClient.baseURL}/api/form-processing/start`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Form processing failed:', error);
      throw new Error(`Form processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitUserData(processingId: string, userData: UserData): Promise<FormProcessingResult> {
    try {
      const formData = new FormData();
      formData.append('personalInfo', JSON.stringify(userData.personalInfo));
      formData.append('contactInfo', JSON.stringify(userData.contactInfo));
      
      if (userData.professionalInfo) {
        formData.append('professionalInfo', JSON.stringify(userData.professionalInfo));
      }

      // Add documents if any
      if (userData.documents) {
        userData.documents.forEach((doc, index) => {
          formData.append('documents', doc.file);
          formData.append(`documentTypes[${index}]`, doc.type);
        });
      }

      // Add dynamic fields if any
      if (userData.dynamicFields) {
        for (const [key, value] of Object.entries(userData.dynamicFields)) {
          formData.append(`dynamicFields[${key}]`, String(value));
        }
      }

      const authHeaders = this.getAuthHeaders();
      
      const response = await fetch(`${apiClient.baseURL}/api/form-processing/${processingId}/submit-data`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('User data submission failed:', error);
      throw new Error(`User data submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProcessingStatus(processingId: string): Promise<FormProcessingResult> {
    try {
      const authHeaders = this.getAuthHeaders();
      
      const response = await fetch(`${apiClient.baseURL}/api/form-processing/${processingId}/status`, {
        method: 'GET',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get processing status:', error);
      throw new Error(`Failed to get processing status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProcessingResult(processingId: string): Promise<FormProcessingResult> {
    try {
      const authHeaders = this.getAuthHeaders();
      
      const response = await fetch(`${apiClient.baseURL}/api/form-processing/${processingId}/result`, {
        method: 'GET',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get processing result:', error);
      throw new Error(`Failed to get processing result: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProcessingHistory(limit: number = 10): Promise<FormProcessingResult[]> {
    try {
      const authHeaders = this.getAuthHeaders();
      
      const response = await fetch(`${apiClient.baseURL}/api/form-processing/history?limit=${limit}`, {
        method: 'GET',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get processing history:', error);
      throw new Error(`Failed to get processing history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadProcessedForm(filename: string): Promise<Blob> {
    try {
      const authHeaders = this.getAuthHeaders();
      
      const response = await fetch(`${apiClient.baseURL}/api/form-processing/download/${filename}`, {
        method: 'GET',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to download processed form:', error);
      throw new Error(`Failed to download processed form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeForm(file: File, metadata?: any, options?: any): Promise<FormAnalysisResponse> {
    try {
      console.log('Client: Starting form analysis for file:', file.name, 'size:', file.size, 'type:', file.type);
      
      const formData = new FormData();
      formData.append('files', file); // Changed from 'file' to 'files' to match server expectation
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      if (options) {
        formData.append('options', JSON.stringify(options));
      }

      // Log FormData contents for debugging
      console.log('Client: FormData entries:');
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
      }

      const authHeaders = this.getAuthHeaders();
      
      console.log('Client: Making request to:', `${apiClient.baseURL}/api/form/analyze`);
      console.log('Client: Request headers:', authHeaders);
      
      const response = await fetch(`${apiClient.baseURL}/api/form/analyze`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });
      
      console.log('Client: Response status:', response.status);
      console.log('Client: Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Form analysis failed:', error);
      throw new Error(`Form analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateForm(generationRequest: any): Promise<any> {
    try {
      const authHeaders = this.getAuthHeaders();
      authHeaders['Content-Type'] = 'application/json';
      
      const response = await fetch(`${apiClient.baseURL}/api/form/generate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(generationRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Form generation failed:', error);
      throw new Error(`Form generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFormTemplates(filters?: any): Promise<any[]> {
    try {
      const authHeaders = this.getAuthHeaders();
      const queryParams = new URLSearchParams(filters).toString();
      
      const response = await fetch(`${apiClient.baseURL}/api/form/templates?${queryParams}`, {
        method: 'GET',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get form templates:', error);
      throw new Error(`Failed to get form templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBestPractices(filters?: any): Promise<any[]> {
    try {
      const authHeaders = this.getAuthHeaders();
      const queryParams = new URLSearchParams(filters).toString();
      
      const response = await fetch(`${apiClient.baseURL}/api/form/best-practices?${queryParams}`, {
        method: 'GET',
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get best practices:', error);
      throw new Error(`Failed to get best practices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const formService = new FormService();