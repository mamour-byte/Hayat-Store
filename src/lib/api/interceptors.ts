import type { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { tokenStorage } from '../storage/token.storage';
import { toast } from 'sonner';

export const setupInterceptors = (axiosInstance: any) => {
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };

  // Request Interceptor
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const accessToken = tokenStorage.getAccessToken();
      const sessionId = tokenStorage.getSessionId();

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      if (sessionId) {
        config.headers['X-Session-Id'] = sessionId;
      }

      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response Interceptor
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/register') &&
        !originalRequest.url?.includes('/auth/refresh')
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = tokenStorage.getRefreshToken();

        if (!refreshToken) {
          tokenStorage.clearAll();
          isRefreshing = false;
          return Promise.reject(error);
        }

        try {
          const { data } = await axiosInstance.post('/auth/refresh', {
            refreshToken,
          });

          const newAccessToken = data.accessToken;
          tokenStorage.setAccessToken(newAccessToken);
          if (data.refreshToken) {
            tokenStorage.setRefreshToken(data.refreshToken);
          }

          axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          isRefreshing = false;

          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          tokenStorage.clearAll();
          isRefreshing = false;
          toast.error('Session expirée, veuillez vous re-connecter.');
          return Promise.reject(refreshError);
        }
      }

      // Handle general error notifications
      if (error.response?.data) {
        const data: any = error.response.data;
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message || 'Une erreur est survenue';

        if (!originalRequest?.url?.includes('/auth/me')) {
          toast.error(message);
        }
      } else if (error.message && error.message !== 'canceled') {
        toast.error(error.message);
      }

      return Promise.reject(error);
    }
  );
};
