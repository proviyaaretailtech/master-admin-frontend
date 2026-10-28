import { httpGet, httpPost, num, str, toPage } from "./_http";
import type { Page, Row } from "./_http";

export type SupportSource = "customer" | "partner";
export const SUPPORT_STATUSES = ["open", "in_progress", "resolved"] as const;

export interface SupportRow {
  source: SupportSource;
  id: string;
  reference?: string;
  organization_id?: string;
  organization_name?: string;
  topic: string;
  message: string;
  status: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at?: string;
  resolved_at?: string;
}
export interface SupportDetail extends SupportRow {
  raised_by_email?: string;
  notes: Array<{ id: string; note: string; created_at: string; author_name?: string }>;
}

const mapRow = (r: Row): SupportRow => ({
  source: String(r.source) as SupportSource,
  id: String(r.id),
  reference: str(r.reference),
  organization_id: str(r.organization_id),
  organization_name: str(r.organization_name),
  topic: String(r.topic ?? ""),
  message: String(r.message ?? ""),
  status: String(r.status ?? "open"),
  assigned_to: str(r.assigned_to),
  assigned_to_name: str(r.assigned_to_name),
  created_at: str(r.created_at),
  resolved_at: str(r.resolved_at),
});

export const supportApi = {
  list: async (
    p: { source?: string; status?: string; mine?: boolean; q?: string; page?: number } = {}
  ): Promise<Page<SupportRow> & { counts: Record<string, number> }> => {
    const raw = await httpGet<Row>("/support", p);
    const pg = toPage<Row>(raw, "requests");
    const counts = (raw.counts ?? {}) as Record<string, unknown>;
    return {
      ...pg,
      items: pg.items.map(mapRow),
      counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, num(v)])),
    };
  },
  async get(source: SupportSource, id: string): Promise<SupportDetail> {
    const r = await httpGet<Row>(`/support/${source}/${id}`);
    const q = (r.request ?? {}) as Row;
    return {
      ...mapRow(q),
      raised_by_email: str(q.raised_by_email),
      notes: ((r.notes as Row[]) ?? []).map((n) => ({
        id: String(n.id),
        note: String(n.note ?? ""),
        created_at: String(n.created_at),
        author_name: str(n.author_name),
      })),
    };
  },
  update: (
    source: SupportSource,
    id: string,
    b: { status?: string; assign_to_me?: boolean; note?: string }
  ) => httpPost<Row>(`/support/${source}/${id}`, b),
};
