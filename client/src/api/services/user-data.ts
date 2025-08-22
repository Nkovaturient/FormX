import apiClient from '../config/api.js';

export interface VaultUserData {
  personalInfo?: any;
  contactInfo?: any;
  professionalInfo?: any;
  sensitiveMeta?: { count: number };
}

class UserDataService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['user'] = userId;
    return headers;
  }

  async get(): Promise<VaultUserData | null> {
    const response = await fetch(`${apiClient.baseURL}/api/user-data`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return json.data;
  }

  async put(data: VaultUserData & { sensitive?: Record<string, string> }): Promise<VaultUserData> {
    const response = await fetch(`${apiClient.baseURL}/api/user-data`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    const json = await response.json();
    return json.data;
  }
}

export const userDataService = new UserDataService();