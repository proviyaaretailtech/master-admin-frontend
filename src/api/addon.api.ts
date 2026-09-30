import { apiClient } from "../lib/api-client";

export interface CommercialAddonItem {
  id: string;
  addon_code: string;
  name: string;
  description: string;
  category: string;
  status: "Draft" | "Published" | "Retired";
  version: string;
  price: number;
  currency: string;
  cadence: string;
  unit_label: string;
  pricing_subtitle: string;
  effective_date: string | null;
  min_quantity: number;
  max_quantity: number;
  compatible_plans: string[];
  billing_sync_status: string;
  entitlement_validation_status: string;
  tax_compliance_status: string;
  active_units_count: number;
  assigned_count: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAddonPayload {
  name: string;
  addon_code: string;
  description?: string;
  category: string;
  status?: "Draft" | "Published" | "Retired";
  version?: string;
  price?: number;
  currency?: string;
  cadence?: string;
  unit_label?: string;
  pricing_subtitle?: string;
  effective_date?: string | null;
  min_quantity?: number;
  max_quantity?: number;
  compatible_plans?: string[];
  billing_sync_status?: string;
  entitlement_validation_status?: string;
  tax_compliance_status?: string;
}

export type UpdateAddonPayload = Partial<CreateAddonPayload>;

export const addonApi = {
  /**
   * Fetch all commercial add-ons
   */
  async getAll(params?: {
    search?: string;
    category?: string;
    status?: string;
    compatibility?: string;
  }): Promise<{
    message: string;
    addons: CommercialAddonItem[];
    total: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.compatibility) queryParams.append("compatibility", params.compatibility);

    const qs = queryParams.toString();
    const url = `/commercials/add-ons${qs ? `?${qs}` : ""}`;
    const res = await apiClient.get<{
      message: string;
      addons: CommercialAddonItem[];
      total: number;
    }>(url);
    return res.data;
  },

  /**
   * Get unique commercial categories
   */
  async getCategories(): Promise<{ message: string; categories: string[] }> {
    const res = await apiClient.get<{ message: string; categories: string[] }>(
      "/commercials/add-ons/categories"
    );
    return res.data;
  },

  /**
   * Get single add-on by ID
   */
  async getById(id: string): Promise<{ message: string; addon: CommercialAddonItem }> {
    const res = await apiClient.get<{ message: string; addon: CommercialAddonItem }>(
      `/commercials/add-ons/${id}`
    );
    return res.data;
  },

  /**
   * Create new commercial add-on
   */
  async create(
    payload: CreateAddonPayload
  ): Promise<{ message: string; addon: CommercialAddonItem }> {
    const res = await apiClient.post<{ message: string; addon: CommercialAddonItem }>(
      "/commercials/add-ons",
      payload
    );
    return res.data;
  },

  /**
   * Update existing add-on
   */
  async update(
    id: string,
    payload: UpdateAddonPayload
  ): Promise<{ message: string; addon: CommercialAddonItem }> {
    const res = await apiClient.put<{ message: string; addon: CommercialAddonItem }>(
      `/commercials/add-ons/${id}`,
      payload
    );
    return res.data;
  },

  /**
   * Publish add-on
   */
  async publish(id: string): Promise<{ message: string; addon: CommercialAddonItem }> {
    const res = await apiClient.post<{ message: string; addon: CommercialAddonItem }>(
      `/commercials/add-ons/${id}/publish`
    );
    return res.data;
  },

  /**
   * Retire add-on
   */
  async retire(id: string): Promise<{ message: string; addon: CommercialAddonItem }> {
    const res = await apiClient.post<{ message: string; addon: CommercialAddonItem }>(
      `/commercials/add-ons/${id}/retire`
    );
    return res.data;
  },

  /**
   * Delete add-on
   */
  async delete(id: string): Promise<{ id: string; message: string }> {
    const res = await apiClient.delete<{ id: string; message: string }>(
      `/commercials/add-ons/${id}`
    );
    return res.data;
  },
};
