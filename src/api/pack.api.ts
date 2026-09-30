import { apiClient } from "../lib/api-client";

export interface CommercialPackItem {
  id: string;
  pack_code: string;
  name: string;
  description: string;
  status: "Draft" | "Published" | "Retired";
  price: number;
  currency: string;
  cadence: string;
  effective_date: string | null;
  extended_limits: string;
  prerequisite_note: string;
  included_feature_title: string;
  included_feature_subtitle: string;
  compatible_plans: string[];
  required_modules: string[];
  assigned_count: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePackPayload {
  name: string;
  pack_code: string;
  description?: string;
  status?: "Draft" | "Published" | "Retired";
  price?: number;
  currency?: string;
  cadence?: string;
  effective_date?: string | null;
  extended_limits?: string;
  prerequisite_note?: string;
  included_feature_title?: string;
  included_feature_subtitle?: string;
  compatible_plans?: string[];
  required_modules?: string[];
}

export type UpdatePackPayload = Partial<CreatePackPayload>;

export const packApi = {
  /**
   * Fetch all commercial feature packs
   */
  async getAll(params?: { search?: string; status?: string; compatibility?: string }): Promise<{
    message: string;
    packs: CommercialPackItem[];
    total: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.compatibility) queryParams.append("compatibility", params.compatibility);

    const qs = queryParams.toString();
    const url = `/commercials/packs${qs ? `?${qs}` : ""}`;
    const res = await apiClient.get<{ message: string; packs: CommercialPackItem[]; total: number }>(
      url
    );
    return res.data;
  },

  /**
   * Get single pack by ID
   */
  async getById(id: string): Promise<{ message: string; pack: CommercialPackItem }> {
    const res = await apiClient.get<{ message: string; pack: CommercialPackItem }>(
      `/commercials/packs/${id}`
    );
    return res.data;
  },

  /**
   * Create new commercial pack
   */
  async create(payload: CreatePackPayload): Promise<{ message: string; pack: CommercialPackItem }> {
    const res = await apiClient.post<{ message: string; pack: CommercialPackItem }>(
      "/commercials/packs",
      payload
    );
    return res.data;
  },

  /**
   * Update existing pack
   */
  async update(
    id: string,
    payload: UpdatePackPayload
  ): Promise<{ message: string; pack: CommercialPackItem }> {
    const res = await apiClient.put<{ message: string; pack: CommercialPackItem }>(
      `/commercials/packs/${id}`,
      payload
    );
    return res.data;
  },

  /**
   * Publish pack
   */
  async publish(id: string): Promise<{ message: string; pack: CommercialPackItem }> {
    const res = await apiClient.post<{ message: string; pack: CommercialPackItem }>(
      `/commercials/packs/${id}/publish`
    );
    return res.data;
  },

  /**
   * Retire pack
   */
  async retire(id: string): Promise<{ message: string; pack: CommercialPackItem }> {
    const res = await apiClient.post<{ message: string; pack: CommercialPackItem }>(
      `/commercials/packs/${id}/retire`
    );
    return res.data;
  },

  /**
   * Delete pack
   */
  async delete(id: string): Promise<{ id: string; message: string }> {
    const res = await apiClient.delete<{ id: string; message: string }>(
      `/commercials/packs/${id}`
    );
    return res.data;
  },
};
