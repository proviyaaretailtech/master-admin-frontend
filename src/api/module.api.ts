import { apiClient } from "../lib/api-client";

export interface PlatformModuleItem {
  id: string;
  key: string;
  name: string;
  category: string;
  description: string;
  is_active: boolean;
  plans_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlatformModuleInput {
  key: string;
  name: string;
  category?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdatePlatformModuleInput {
  key?: string;
  name?: string;
  category?: string;
  description?: string;
  is_active?: boolean;
}

export const moduleApi = {
  /**
   * Fetch all platform modules
   */
  async getAll(): Promise<{ message: string; modules: PlatformModuleItem[] }> {
    const res = await apiClient.get<{ message: string; modules: PlatformModuleItem[] }>(
      "/commercials/modules"
    );
    return res.data;
  },

  /**
   * Fetch a single platform module by ID
   */
  async getById(id: string): Promise<{ message: string; module: PlatformModuleItem }> {
    const res = await apiClient.get<{ message: string; module: PlatformModuleItem }>(
      `/commercials/modules/${id}`
    );
    return res.data;
  },

  /**
   * Create a new platform module
   */
  async create(
    data: CreatePlatformModuleInput
  ): Promise<{ message: string; module: PlatformModuleItem }> {
    const res = await apiClient.post<{ message: string; module: PlatformModuleItem }>(
      "/commercials/modules",
      data
    );
    return res.data;
  },

  /**
   * Update an existing platform module
   */
  async update(
    id: string,
    data: UpdatePlatformModuleInput
  ): Promise<{ message: string; module: PlatformModuleItem }> {
    const res = await apiClient.put<{ message: string; module: PlatformModuleItem }>(
      `/commercials/modules/${id}`,
      data
    );
    return res.data;
  },

  /**
   * Delete a platform module
   */
  async delete(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/commercials/modules/${id}`);
    return res.data;
  },
};
