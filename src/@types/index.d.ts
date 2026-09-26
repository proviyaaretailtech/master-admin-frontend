export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role?: string;
  panel?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedUsersResponse {
  message: string;
  users: User[];
  pagination: Pagination;
}

export interface ApiResponse<T = unknown> {
  message?: string;
  data?: T;
  errorCode?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface Organization {
  id: string;
  business_name: string;
  domain: string;
  status: "Active" | "Inactive" | "Pending" | "Suspended" | string;
  email: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationPayload {
  business_name: string;
  domain: string;
  email: string;
  phone_number: string;
  status?: string;
}

export interface UpdateOrganizationPayload {
  business_name?: string;
  domain?: string;
  email?: string;
  phone_number?: string;
  status?: string;
}

export interface GetOrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  domain?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | "ASC" | "DESC";
}

export interface PaginatedOrganizationsResponse {
  message: string;
  organizations: Organization[];
  pagination: Pagination;
}
