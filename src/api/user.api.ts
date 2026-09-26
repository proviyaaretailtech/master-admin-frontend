import { apiClient } from "../lib/api-client";
import { User, PaginatedUsersResponse } from "../@types";

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  panel?: string;
  role?: string;
  status?: "Active" | "Inactive";
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  panel?: string;
  status?: string;
}

export const userApi = {
  /**
   * Fetch paginated registered users with search and filter queries
   */
  async getAll(params: GetUsersParams = {}): Promise<PaginatedUsersResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));
    if (params.search && params.search.trim()) queryParams.set("search", params.search.trim());
    if (params.panel && params.panel !== "All Panels / Roles")
      queryParams.set("panel", params.panel.trim());
    if (params.status && params.status !== "All Statuses")
      queryParams.set("status", params.status.trim());

    const queryString = queryParams.toString();
    const url = queryString ? `/users?${queryString}` : "/users";

    const response = await apiClient.get<PaginatedUsersResponse>(url);
    return response.data;
  },

  /**
   * Fetch a single user by UUID
   */
  async getById(id: string): Promise<{ message: string; user: User }> {
    const response = await apiClient.get<{ message: string; user: User }>(`/users/${id}`);
    return response.data;
  },

  /**
   * Update user details
   */
  async update(id: string, payload: UpdateUserPayload): Promise<{ message: string; user: User }> {
    const response = await apiClient.put<{ message: string; user: User }>(`/users/${id}`, payload);
    return response.data;
  },

  /**
   * Delete user by UUID
   */
  async delete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },
};
