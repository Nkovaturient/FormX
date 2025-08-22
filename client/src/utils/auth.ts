export interface AuthData {
  token: string;
  userId: string;
}

/**
 * Get authentication data from localStorage
 */
export const getAuthData = (): AuthData | null => {
  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  
  if (token && userId) {
    return { token, userId };
  }
  
  return null;
};

/**
 * Save authentication data to localStorage
 */
export const saveAuthData = (authData: AuthData): void => {
  localStorage.setItem('authToken', authData.token);
  localStorage.setItem('userId', authData.userId);
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const authData = getAuthData();
  return !!authData?.token && !!authData?.userId;
};

/**
 * Get authentication headers for API requests
 */
export const getAuthHeaders = (): Record<string, string> => {
  const authData = getAuthData();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (authData?.token) {
    headers['Authorization'] = `Bearer ${authData.token}`;
  }
  
  if (authData?.userId) {
    headers['user'] = authData.userId;
  }
  
  return headers;
};

/**
 * Get authentication headers for FormData requests
 */
export const getFormDataAuthHeaders = (): Record<string, string> => {
  const authData = getAuthData();
  
  const headers: Record<string, string> = {};
  
  if (authData?.token) {
    headers['Authorization'] = `Bearer ${authData.token}`;
  }
  
  if (authData?.userId) {
    headers['user'] = authData.userId;
  }
  
  return headers;
};

/**
 * Validate token format (basic check)
 */
export const isValidTokenFormat = (token: string): boolean => {
  // Basic JWT format validation (3 parts separated by dots)
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

/**
 * Check if token is expired (basic check)
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true; // If we can't parse, assume expired
  }
}; 