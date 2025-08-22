const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

class ApiClient {
  public baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (userId) {
      headers['user'] = userId;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const authHeaders = this.getAuthHeaders();
    
    const config: RequestInit = {
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Network error');
    }
  }

  // Form Analysis API
  async analyzeForm(files: File[], metadata?: any, options?: any): Promise<ApiResponse> {
    const formData = new FormData();
    
    // Add files
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add metadata and options
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const authHeaders = this.getAuthHeaders();
    // Remove Content-Type for FormData
    delete authHeaders['Content-Type'];
    
    const response = await fetch(`${this.baseURL}/api/form/analyze`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getAnalysisResults(analysisId: string): Promise<ApiResponse> {
    return this.request(`/api/form/results/${analysisId}`);
  }

  async generateForm(generationRequest: any): Promise<ApiResponse> {
    return this.request('/api/form/generate', {
      method: 'POST',
      body: JSON.stringify(generationRequest),
    });
  }

  async getFormTemplates(filters?: any): Promise<ApiResponse> {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/api/form/templates?${queryParams}`);
  }

  async getBestPractices(filters?: any): Promise<ApiResponse> {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/api/form/best-practices?${queryParams}`);
  }

  async generateOptimizationRoadmap(analysisId: string, targetGoals: any, timeframe?: string): Promise<ApiResponse> {
    return this.request('/api/form/optimize', {
      method: 'POST',
      body: JSON.stringify({ analysisId, targetGoals, timeframe }),
    });
  }

  async deleteAnalysis(analysisId: string): Promise<ApiResponse> {
    return this.request(`/api/form/analysis/${analysisId}`, {
      method: 'DELETE',
    });
  }

  // OCR API
  async processOCR(files: File[], options?: any): Promise<ApiResponse> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const authHeaders = this.getAuthHeaders();
    // Remove Content-Type for FormData
    delete authHeaders['Content-Type'];
    
    const response = await fetch(`${this.baseURL}/api/ocr/process`, {
      method: 'POST',
      headers: authHeaders,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getOCRResults(jobId: string): Promise<ApiResponse> {
    return this.request(`/api/ocr/results/${jobId}`);
  }

  // Analytics API
  async getAnalytics(filters?: any): Promise<ApiResponse> {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/api/analytics?${queryParams}`);
  }

  async getUserUsage(): Promise<ApiResponse> {
    return this.request('/api/analytics/usage');
  }

  // User Profile API
  async getUserProfile(): Promise<ApiResponse> {
    return this.request('/api/auth/profile');
  }

  async updateUserProfile(profileData: any): Promise<ApiResponse> {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient; 