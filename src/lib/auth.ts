import { authApi } from './api';

// Check if user has valid tokens
export const hasValidTokens = (): boolean => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  return !!(accessToken && refreshToken);
};

// Get current access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

// Get current refresh token
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

// Clear all auth data
export const clearAuth = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Verify if current token is valid
export const verifyCurrentToken = async (): Promise<boolean> => {
  const accessToken = getAccessToken();
  if (!accessToken) return false;

  try {
    const isValid = await authApi.verifyToken({ token: accessToken });
    return isValid;
  } catch (error) {
    return false;
  }
};

// Refresh current token
export const refreshCurrentToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await authApi.refreshToken({ refresh: refreshToken });
    localStorage.setItem('accessToken', response.access);
    return true;
  } catch (error) {
    clearAuth();
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  if (!hasValidTokens()) return false;
  
  // First try to verify current token
  if (await verifyCurrentToken()) return true;
  
  // If verification fails, try to refresh
  return await refreshCurrentToken();
}; 