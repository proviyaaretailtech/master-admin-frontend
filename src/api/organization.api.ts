import { apiClient } from "../lib/api-client";
import {
  Organization,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  GetOrganizationsParams,
  PaginatedOrganizationsResponse,
} from "../@types";

export const organizationApi = {
  /**
   * Fetch paginated organizations with server-side search, status, and domain filtering
   */
  async getAll(params: GetOrganizationsParams = {}): Promise<PaginatedOrganizationsResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set("page", String(params.page));
    if (params.limit) queryParams.set("limit", String(params.limit));
    if (params.search && params.search.trim()) queryParams.set("search", params.search.trim());
    if (params.status && params.status !== "All" && params.status !== "All Statuses") {
      queryParams.set("status", params.status.trim());
    }
    if (params.domain && params.domain !== "All" && params.domain !== "All Types") {
      queryParams.set("domain", params.domain.trim());
    }
    if (params.sortBy) queryParams.set("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.set("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const url = queryString ? `/organizations?${queryString}` : "/organizations";

    const response = await apiClient.get<PaginatedOrganizationsResponse>(url);
    return response.data;
  },

  /**
   * Fetch single organization by UUID
   */
  async getById(id: string): Promise<{ message: string; organization: Organization }> {
    const response = await apiClient.get<{ message: string; organization: Organization }>(
      `/organizations/${id}`
    );
    return response.data;
  },

  /**
   * Create a new organization with validation
   */
  async create(
    payload: CreateOrganizationPayload
  ): Promise<{ message: string; organization: Organization }> {
    const response = await apiClient.post<{ message: string; organization: Organization }>(
      "/organizations",
      payload
    );
    return response.data;
  },

  /**
   * Update organization details
   */
  async update(
    id: string,
    payload: UpdateOrganizationPayload
  ): Promise<{ message: string; organization: Organization }> {
    const response = await apiClient.put<{ message: string; organization: Organization }>(
      `/organizations/${id}`,
      payload
    );
    return response.data;
  },

  /**
   * Delete organization by UUID
   */
  async delete(id: string): Promise<{ success: boolean; message: string; deletedId: string }> {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
      deletedId: string;
    }>(`/organizations/${id}`);
    return response.data;
  },
};
