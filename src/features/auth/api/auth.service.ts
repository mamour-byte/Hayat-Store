import type {
  AuthResponse,
  LoginCredentials,
  RegisterPayload,
  RefreshTokenPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  User,
} from '../../../types';
import { apiClient } from '../../../lib/api/client';
import { API_ENDPOINTS } from '../../../lib/api/endpoints';

export const authService = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, payload);
    return data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return data;
  },

  refreshToken: async (
    payload: RefreshTokenPayload
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data } = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, payload);
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
    return data;
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
  },
};
