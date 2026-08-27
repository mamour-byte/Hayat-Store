const ACCESS_TOKEN_KEY = 'hayat_access_token';
const REFRESH_TOKEN_KEY = 'hayat_refresh_token';
const SESSION_ID_KEY = 'hayat_session_id';

export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  setAccessToken: (token: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  removeAccessToken: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  removeRefreshToken: (): void => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  getSessionId: (): string => {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = `guest_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  },
  removeSessionId: (): void => {
    localStorage.removeItem(SESSION_ID_KEY);
  },

  clearAll: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
