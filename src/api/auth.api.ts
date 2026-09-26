import { apiClient } from "../lib/api-client";
import { AuthResponse, User } from "../@types";

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  /**
   * Register a new user
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", payload);
    return response.data;
  },

  /**
   * Sign in existing user with email and password
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  /**
   * Sign out current user session
   */
  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>("/auth/logout");
    return response.data;
  },

  /**
   * Fetch currently authenticated user profile
   */
  async getMe(): Promise<{ message: string; user: User }> {
    const response = await apiClient.get<{ message: string; user: User }>("/auth/me");
    return response.data;
  },
};
