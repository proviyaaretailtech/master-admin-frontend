import { apiClient } from "../lib/api-client";
import {
  LocationItem,
  CreateLocationPayload,
  UpdateLocationPayload,
  PaginatedLocationsResponse,
} from "../@types";

export interface GetLocationsParams {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const locationApi = {
  /**
   * Fetch all locations for a specific organization with optional filters
   */
  async getByOrganization(
    orgId: string,
    params: GetLocationsParams = {}
  ): Promise<PaginatedLocationsResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));
    if (params.search && params.search.trim()) queryParams.set("search", params.search.trim());
    if (params.status && params.status !== "All") queryParams.set("status", params.status);
    if (params.type && params.type !== "All") queryParams.set("type", params.type);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/organizations/${orgId}/locations?${queryString}`
      : `/organizations/${orgId}/locations`;

    const response = await apiClient.get<PaginatedLocationsResponse>(url);
    return response.data;
  },

  /**
   * Fetch a single location under an organization
   */
  async getById(
    orgId: string,
    locationId: string
  ): Promise<{ message: string; location: LocationItem }> {
    const response = await apiClient.get<{ message: string; location: LocationItem }>(
      `/organizations/${orgId}/locations/${locationId}`
    );
    return response.data;
  },

  /**
   * Create a new location under an organization
   */
  async create(
    orgId: string,
    payload: CreateLocationPayload
  ): Promise<{ message: string; location: LocationItem }> {
    const response = await apiClient.post<{ message: string; location: LocationItem }>(
      `/organizations/${orgId}/locations`,
      payload
    );
    return response.data;
  },

  /**
   * Update an existing location under an organization
   */
  async update(
    orgId: string,
    locationId: string,
    payload: UpdateLocationPayload
  ): Promise<{ message: string; location: LocationItem }> {
    const response = await apiClient.patch<{ message: string; location: LocationItem }>(
      `/organizations/${orgId}/locations/${locationId}`,
      payload
    );
    return response.data;
  },

  /**
   * Delete a location under an organization
   */
  async delete(orgId: string, locationId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/organizations/${orgId}/locations/${locationId}`
    );
    return response.data;
  },
};
