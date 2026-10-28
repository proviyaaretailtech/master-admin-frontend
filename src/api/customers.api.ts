import { httpGet, num, str, toPage } from "./_http";
import type { Page, Row } from "./_http";

/** Masked on the Master server: the full email and phone never reach the panel. */
export interface CustomerRow {
  id: string;
  email_masked?: string;
  phone_masked?: string;
  created_at?: string;
  last_sign_in_at?: string;
  is_test: boolean;
  orders: number;
  last_order_at?: string;
  devices: number;
}
export interface CustomerSummary {
  total: number;
  real: number;
  test: number;
  active_30d: number;
  ordered: number;
}
export type CustomerAccounts = "real" | "test" | "all";

export const customerApi = {
  list: async (
    p: { q?: string; accounts?: CustomerAccounts; page?: number } = {}
  ): Promise<Page<CustomerRow> & { summary: CustomerSummary }> => {
    const raw = await httpGet<Row>("/customers", p);
    const pg = toPage<Row>(raw, "customers");
    const s = (raw.summary ?? {}) as Row;
    return {
      ...pg,
      items: pg.items.map((r) => ({
        id: String(r.id),
        email_masked: str(r.email_masked),
        phone_masked: str(r.phone_masked),
        created_at: str(r.created_at),
        last_sign_in_at: str(r.last_sign_in_at),
        is_test: r.is_test === true,
        orders: num(r.orders),
        last_order_at: str(r.last_order_at),
        devices: num(r.devices),
      })),
      summary: {
        total: num(s.total),
        real: num(s.real),
        test: num(s.test),
        active_30d: num(s.active_30d),
        ordered: num(s.ordered),
      },
    };
  },
};
