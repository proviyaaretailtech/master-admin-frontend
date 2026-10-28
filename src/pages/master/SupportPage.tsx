import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORT_STATUSES, supportApi } from "../../api/support.api";
import type { SupportRow, SupportSource } from "../../api/support.api";
import { usePermissions } from "../../hooks/use-permissions";
import { FEAT } from "../../lib/master-features";
import { useFormat } from "../../i18n/useFormat";
import {
  Button,
  DataTable,
  Drawer,
  FilterBar,
  KV,
  PageHeader,
  PageState,
  Pager,
  ReasonDialog,
  SelectInput,
  StatusBadge,
  TextInput,
} from "../../components/master/ui";
import { useAction, useResource } from "../../components/master/useResource";

type Open = { source: SupportSource; id: string } | null;

const RequestDrawer: React.FC<{ open: Open; onClose: () => void; onChanged: () => void }> = ({
  open,
  onClose,
  onChanged,
}) => {
  const { t } = useTranslation();
  const f = useFormat();
  const { can } = usePermissions();
  const mayHandle = can(FEAT.SUPPORT.id, FEAT.SUPPORT.handle);
  const action = useAction();
  const [dialog, setDialog] = useState<"note" | "resolve" | null>(null);
  const res = useResource(() => supportApi.get(open!.source, open!.id), [open?.source, open?.id], {
    enabled: Boolean(open),
  });
  const r = res.data;
  const dash = t("common.dash");

  const change = async (b: { status?: string; assign_to_me?: boolean; note?: string }) => {
    if (!open) return;
    const out = await action.run(() => supportApi.update(open.source, open.id, b));
    if (out !== undefined) {
      setDialog(null);
      res.reload();
      onChanged();
    }
  };

  return (
    <>
      <Drawer open={Boolean(open)} title={r?.reference || t("m.support.request")} onClose={onClose}>
        <PageState
          loading={res.loading}
          error={res.error}
          denied={res.denied}
          onRetry={res.reload}
          empty={!r}
        >
          {r && (
            <div className="space-y-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                <KV label={t("m.support.from")}>{t(`m.support.source.${r.source}`)}</KV>
                <KV label={t("common.status")}>
                  <StatusBadge code={r.status} />
                </KV>
                <KV label={t("m.support.topic")}>
                  {t(`m.support.topicName.${r.topic}`, { defaultValue: r.topic })}
                </KV>
                <KV label={t("m.support.business")}>{r.organization_name ?? dash}</KV>
                <KV label={t("m.support.raisedBy")}>{r.raised_by_email ?? dash}</KV>
                <KV label={t("m.support.received")}>
                  {r.created_at ? f.dateTime(r.created_at) : dash}
                </KV>
                <KV label={t("m.support.assigned")}>
                  {r.assigned_to_name ?? t("m.support.nobody")}
                </KV>
              </dl>
              <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-800">
                {r.message}
              </p>
              <section>
                <h3 className="mb-1 text-xs font-bold text-slate-700">{t("m.support.notes")}</h3>
                {r.notes.length === 0 ? (
                  <p className="text-xs text-slate-500">{t("m.support.noNotes")}</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {r.notes.map((n) => (
                      <li key={n.id} className="rounded-lg border border-slate-100 p-2">
                        <div className="text-[11px] text-slate-500">
                          {n.author_name ?? dash} · {f.dateTime(n.created_at)}
                        </div>
                        {n.note}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              {mayHandle && (
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {r.status !== "resolved" && (
                    <Button
                      variant="primary"
                      busy={action.busy}
                      onClick={() => change({ assign_to_me: true, status: "in_progress" })}
                    >
                      {t("m.support.take")}
                    </Button>
                  )}
                  <Button onClick={() => setDialog("note")}>{t("m.support.addNote")}</Button>
                  {r.status !== "resolved" ? (
                    <Button variant="danger" onClick={() => setDialog("resolve")}>
                      {t("m.support.resolve")}
                    </Button>
                  ) : (
                    <Button busy={action.busy} onClick={() => change({ status: "open" })}>
                      {t("m.support.reopen")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </PageState>
      </Drawer>
      <ReasonDialog
        open={dialog !== null}
        required
        title={dialog ? t(`m.support.dialog.${dialog}`) : ""}
        reasonLabel={t("m.support.note")}
        confirmLabel={t("common.confirm")}
        busy={action.busy}
        error={action.error}
        onConfirm={(note) => change(dialog === "resolve" ? { status: "resolved", note } : { note })}
        onClose={() => {
          setDialog(null);
          action.clear();
        }}
      />
    </>
  );
};

/** One inbox for customer and partner support requests. Notes are internal; nothing is sent to anyone from here. */
export const SupportPage: React.FC = () => {
  const { t } = useTranslation();
  const f = useFormat();
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("open");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Open>(null);
  const res = useResource(
    () => supportApi.list({ source, status: status === "all" ? "" : status, q, page }),
    [source, status, q, page]
  );
  const rows: SupportRow[] = res.data?.items ?? [];
  const counts = res.data?.counts ?? {};
  const dash = t("common.dash");

  return (
    <div>
      <PageHeader
        eyebrow={t("nav.items.support")}
        title={t("m.support.title")}
        subtitle={t("m.support.subtitle")}
      />
      <FilterBar>
        <TextInput
          label={t("common.search")}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t("m.support.searchPlaceholder")}
        />
        <SelectInput
          label={t("m.support.from")}
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("common.all")}</option>
          <option value="customer">{t("m.support.source.customer")}</option>
          <option value="partner">{t("m.support.source.partner")}</option>
        </SelectInput>
        <SelectInput
          label={t("common.status")}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">{t("common.all")}</option>
          {SUPPORT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`, { defaultValue: s })}
              {counts[s] !== undefined ? ` (${f.number(counts[s])})` : ""}
            </option>
          ))}
        </SelectInput>
      </FilterBar>
      <PageState
        loading={res.loading}
        error={res.error}
        denied={res.denied}
        onRetry={res.reload}
        empty={rows.length === 0}
        emptyText={t("m.support.empty")}
      >
        <DataTable
          caption={t("m.support.title")}
          rows={rows}
          rowKey={(r) => `${r.source}:${r.id}`}
          onRowClick={(r) => setOpen({ source: r.source, id: r.id })}
          columns={[
            {
              key: "m",
              header: t("m.support.request"),
              render: (r) => (
                <span>
                  <span className="font-semibold text-slate-900">
                    {t(`m.support.topicName.${r.topic}`, { defaultValue: r.topic })}
                  </span>
                  <span className="block max-w-md truncate text-[11px] text-slate-500">
                    {r.message}
                  </span>
                </span>
              ),
            },
            {
              key: "s",
              header: t("m.support.from"),
              render: (r) => t(`m.support.source.${r.source}`),
            },
            {
              key: "b",
              header: t("m.support.business"),
              render: (r) => r.organization_name ?? dash,
            },
            {
              key: "st",
              header: t("common.status"),
              render: (r) => <StatusBadge code={r.status} />,
            },
            {
              key: "a",
              header: t("m.support.assigned"),
              render: (r) => r.assigned_to_name ?? dash,
            },
            {
              key: "d",
              header: t("m.support.received"),
              render: (r) => (r.created_at ? f.dateTime(r.created_at) : dash),
            },
          ]}
        />
        <Pager page={page} totalPages={res.data?.totalPages ?? 1} onPage={setPage} />
      </PageState>
      <RequestDrawer open={open} onClose={() => setOpen(null)} onChanged={res.reload} />
    </div>
  );
};
