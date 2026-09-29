import { apiClient } from "../lib/api-client";

export interface CommercialPlanItem {
  id: string;
  plan_code: string;
  name: string;
  version: string;
  version_type: "Draft" | "Active" | "Custom" | "Legacy";
  status: "Draft" | "Published" | "Retired";
  price: number;
  currency: string;
  cadence: string;
  tax_note: string;
  trial_days: number;
  effective_date: string | null;
  locations_limit: number;
  users_limit: number;
  is_unlimited_locations: boolean;
  is_unlimited_users: boolean;
  modules: string[];
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  assignments_count?: number;
  created_by_email?: string | null;
  updated_by_email?: string | null;
}

export interface CreatePlanPayload {
  name: string;
  plan_code: string;
  version?: string;
  version_type?: "Draft" | "Active" | "Custom" | "Legacy";
  status?: "Draft" | "Published" | "Retired";
  price?: number;
  currency?: string;
  cadence?: "Monthly" | "Annual" | "Quarterly";
  tax_note?: string;
  trial_days?: number;
  effective_date?: string | null;
  locations_limit?: number;
  users_limit?: number;
  is_unlimited_locations?: boolean;
  is_unlimited_users?: boolean;
  modules?: string[];
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export const planApi = {
  /**
   * Fetch all commercial plans
   */
  async getAll(params?: { search?: string; status?: string; cadence?: string }): Promise<{
    message: string;
    plans: CommercialPlanItem[];
    total: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search && params.search.trim()) {
      queryParams.set("search", params.search.trim());
    }
    if (params?.status && params.status !== "all") {
      queryParams.set("status", params.status);
    }
    if (params?.cadence && params.cadence !== "all") {
      queryParams.set("cadence", params.cadence);
    }

    const qs = queryParams.toString();
    const url = qs ? `/commercials/plans?${qs}` : "/commercials/plans";

    const res = await apiClient.get<{
      message: string;
      plans: CommercialPlanItem[];
      total: number;
    }>(url);
    return res.data;
  },

  /**
   * Fetch single commercial plan by ID
   */
  async getById(id: string): Promise<{ message: string; plan: CommercialPlanItem }> {
    const res = await apiClient.get<{ message: string; plan: CommercialPlanItem }>(
      `/commercials/plans/${id}`
    );
    return res.data;
  },

  /**
   * Create new commercial plan
   */
  async create(payload: CreatePlanPayload): Promise<{ message: string; plan: CommercialPlanItem }> {
    const res = await apiClient.post<{ message: string; plan: CommercialPlanItem }>(
      "/commercials/plans",
      payload
    );
    return res.data;
  },

  /**
   * Update existing plan
   */
  async update(
    id: string,
    payload: UpdatePlanPayload
  ): Promise<{ message: string; plan: CommercialPlanItem }> {
    const res = await apiClient.put<{ message: string; plan: CommercialPlanItem }>(
      `/commercials/plans/${id}`,
      payload
    );
    return res.data;
  },

  /**
   * Publish a draft plan
   */
  async publish(id: string): Promise<{ message: string; plan: CommercialPlanItem }> {
    const res = await apiClient.post<{ message: string; plan: CommercialPlanItem }>(
      `/commercials/plans/${id}/publish`
    );
    return res.data;
  },

  /**
   * Duplicate plan
   */
  async duplicate(id: string): Promise<{ message: string; plan: CommercialPlanItem }> {
    const res = await apiClient.post<{ message: string; plan: CommercialPlanItem }>(
      `/commercials/plans/${id}/duplicate`
    );
    return res.data;
  },

  /**
   * Retire plan
   */
  async retire(id: string): Promise<{ message: string; plan: CommercialPlanItem }> {
    const res = await apiClient.post<{ message: string; plan: CommercialPlanItem }>(
      `/commercials/plans/${id}/retire`
    );
    return res.data;
  },

  /**
   * Delete plan
   */
  async delete(id: string): Promise<{ message: string; id: string }> {
    const res = await apiClient.delete<{ message: string; id: string }>(`/commercials/plans/${id}`);
    return res.data;
  },
};
