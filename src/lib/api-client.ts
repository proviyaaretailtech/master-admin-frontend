import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach custom JWT token from localStorage and log requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.baseURL || ""}${config.url}`,
        config.data || ""
      );
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to format API errors with clear validation and network error details
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${error.config?.url}:`, error.response?.data || error.message);
    }

    // 1. Connection / Server unreachable error
    if (!error.response) {
      return Promise.reject(
        new Error(
          "Cannot reach the backend server. Please verify the backend is running on http://localhost:8000."
        )
      );
    }

    // 2. Structured Zod Validation Errors from backend
    if (
      error.response.data?.errors &&
      Array.isArray(error.response.data.errors) &&
      error.response.data.errors.length > 0
    ) {
      const messages = error.response.data.errors
        .map((err: { field?: string; message: string }) => err.message)
        .filter(Boolean)
        .join(". ");
      return Promise.reject(new Error(messages || "Validation failed"));
    }

    // 3. Application error message (AppError / custom message)
    if (error.response.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }

    // 4. Fallback status error
    return Promise.reject(new Error(error.message || "An unexpected error occurred"));
  }
);
