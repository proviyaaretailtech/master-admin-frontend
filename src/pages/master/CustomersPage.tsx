import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { customerApi } from "../../api/customers.api";
import type { CustomerAccounts, CustomerRow } from "../../api/customers.api";
import { useFormat } from "../../i18n/useFormat";
import {
  DataTable,
  FilterBar,
  PageHeader,
  PageState,
  Pager,
  SelectInput,
  StatusBadge,
  TextInput,
} from "../../components/master/ui";
import { useResource } from "../../components/master/useResource";

/**
 * People using the customer app. Every number comes from the Master server; email and phone arrive already masked.
 * Test accounts (test email domains) are hidden by default and counted on their own.
 */
export const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const f = useFormat();
  const [q, setQ] = useState("");
  const [accounts, setAccounts] = useState<CustomerAccounts>("real");
  const [page, setPage] = useState(1);
  const res = useResource(() => customerApi.list({ q, accounts, page }), [q, accounts, page]);
  const rows: CustomerRow[] = res.data?.items ?? [];
  const s = res.data?.summary;
  const dash = t("common.dash");
  const tiles = s
    ? [
        { key: "real", value: s.real },
        { key: "ordered", value: s.ordered },
        { key: "active30d", value: s.active_30d },
        { key: "test", value: s.test },
      ]
    : [];

  return (
    <div>
      <PageHeader
        eyebrow={t("nav.accessControl")}
        title={t("m.customers.title")}
        subtitle={t("m.customers.subtitle")}
      />
      {tiles.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.key} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {t(`m.customers.tile.${tile.key}`)}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">
                {f.number(tile.value)}
              </div>
            </div>
          ))}
        </div>
      )}
      <FilterBar>
        <TextInput
          label={t("common.search")}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t("m.customers.searchPlaceholder")}
        />
        <SelectInput
          label={t("m.customers.accounts")}
          value={accounts}
          onChange={(e) => {
            setAccounts(e.target.value as CustomerAccounts);
            setPage(1);
          }}
        >
          <option value="real">{t("m.customers.accountsReal")}</option>
          <option value="test">{t("m.customers.accountsTest")}</option>
          <option value="all">{t("common.all")}</option>
        </SelectInput>
      </FilterBar>
      <PageState
        loading={res.loading}
        error={res.error}
        denied={res.denied}
        onRetry={res.reload}
        empty={rows.length === 0}
        emptyText={t("m.customers.empty")}
      >
        <DataTable
          caption={t("m.customers.title")}
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "who",
              header: t("m.customers.contact"),
              render: (r) => (
                <span>
                  {r.email_masked ?? r.phone_masked ?? dash}
                  {r.email_masked && r.phone_masked && (
                    <span className="block text-[11px] text-slate-500">{r.phone_masked}</span>
                  )}
                  {r.is_test && <StatusBadge code="test" />}
                </span>
              ),
            },
            { key: "o", header: t("m.customers.orders"), render: (r) => f.number(r.orders) },
            {
              key: "lo",
              header: t("m.customers.lastOrder"),
              render: (r) => (r.last_order_at ? f.dateTime(r.last_order_at) : dash),
            },
            { key: "dv", header: t("m.customers.devices"), render: (r) => f.number(r.devices) },
            {
              key: "ls",
              header: t("m.customers.lastSignIn"),
              render: (r) => (r.last_sign_in_at ? f.dateTime(r.last_sign_in_at) : dash),
            },
            {
              key: "c",
              header: t("m.customers.joined"),
              render: (r) => (r.created_at ? f.dateTime(r.created_at) : dash),
            },
          ]}
        />
        <Pager page={page} totalPages={res.data?.totalPages ?? 1} onPage={setPage} />
      </PageState>
    </div>
  );
};
