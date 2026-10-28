import { httpDelete, httpGet, httpPost, httpPut } from "./_http";
import type { Row } from "./_http";

export const STORE_TYPES = ["restaurant", "store", "service", "logistic"] as const;
export type StoreType = (typeof STORE_TYPES)[number];

export interface RoleOption {
  slug: string;
  name: string;
  description?: string;
}
export interface RoleSetEntry {
  store_type: StoreType;
  role_slug: string;
  added_at?: string;
  added_by_name?: string;
}
export interface OrgRoles {
  grants: Array<{ role_slug: string; role_name: string; store_type: string; granted_at: string }>;
  members: Array<{
    role_slug: string;
    role_name: string;
    status: string;
    email_masked?: string;
    is_test: boolean;
  }>;
  test_logins_allowed: boolean;
}

export const roleSetApi = {
  async list(): Promise<{ roles: RoleOption[]; sets: RoleSetEntry[] }> {
    const r = await httpGet<Row>("/role-sets");
    return {
      roles: ((r.roles as Row[]) ?? []).map((x) => ({
        slug: String(x.slug),
        name: String(x.name ?? x.slug),
        description: x.description ? String(x.description) : undefined,
      })),
      sets: ((r.sets as Row[]) ?? []).map((x) => ({
        store_type: String(x.store_type) as StoreType,
        role_slug: String(x.role_slug),
        added_at: x.added_at ? String(x.added_at) : undefined,
        added_by_name: x.added_by_name ? String(x.added_by_name) : undefined,
      })),
    };
  },
  add: (storeType: StoreType, role: string) => httpPut<Row>(`/role-sets/${storeType}/${role}`),
  remove: (storeType: StoreType, role: string) =>
    httpDelete<Row>(`/role-sets/${storeType}/${role}`),
  async forOrganization(org: string): Promise<OrgRoles> {
    const r = await httpGet<Row>(`/organizations/${org}/staff-roles`);
    return {
      grants: (r.grants as OrgRoles["grants"]) ?? [],
      members: (r.members as OrgRoles["members"]) ?? [],
      test_logins_allowed: r.test_logins_allowed === true,
    };
  },
  apply: (org: string, storeType: StoreType) =>
    httpPost<Row>(`/organizations/${org}/staff-roles/apply`, { store_type: storeType }),
  /** The password comes back once; show it and let it go. */
  async createTestLogin(org: string, role: string): Promise<{ email: string; password: string }> {
    const r = await httpPost<Row>(`/organizations/${org}/test-login`, { role });
    const out = (r.result ?? {}) as Row;
    return { email: String(out.email ?? ""), password: String(out.password ?? "") };
  },
};
