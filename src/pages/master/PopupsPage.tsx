import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button, Card, ConfirmDialog, DataTable, Drawer, EmptyBox, Field, KV, LoadingBox, Modal, Notice, PageHeader, ReasonDialog,
  SelectInput, StatusBadge, TextInput, inputCls,
} from "../../components/master/ui";
import type { Column } from "../../components/master/ui";
import {
  PHOTO_MAX_BYTES, VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS, inspectCreative, popupApi, popupError, shapeOk,
} from "../../api/popups.api";
import type { FrameStyle, Popup, PopupDraft, PopupResults, PopupStatus } from "../../api/popups.api";

/**
 * Customer app → Pop-ups (specs/marketing-popups/plan.md). Make a "royal letter" (or a classic card / sheet / strip) with
 * a photo or a video, choose who sees it and how often, then send it for approval; a second admin approves it and it goes
 * live in the customer app with no app update. The One Local server and database enforce the rules; this page explains them.
 */

const STATUSES: Array<PopupStatus | "all"> = ["all", "draft", "submitted", "live", "ended"];
const SEALS = ["#9C2A2A", "#174D37", "#1F3A93", "#B8892B"];
const LOOK: Record<FrameStyle, { paper: string; line: string; accent: string; ink: string; soft: string }> = {
  royal_gold: { paper: "linear-gradient(#FFFBF0,#F5EAD0)", line: "#B8892B", accent: "#C9A04A", ink: "#2B2116", soft: "#6B5A43" },
  festive_red: { paper: "linear-gradient(#FFF8EE,#FBE7D3)", line: "#9C2A2A", accent: "#C9A04A", ink: "#2E1712", soft: "#6E4A3E" },
  plain: { paper: "linear-gradient(#FFFFFF,#FAF8F3)", line: "#D9CBA6", accent: "#B8A57A", ink: "#1F1F1F", soft: "#6B6B6B" },
};

const isoLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const withOffset = (local: string) => {
  const d = new Date(local);
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, "0");
  const mm = String(Math.abs(off) % 60).padStart(2, "0");
  return `${local}:00${sign}${hh}:${mm}`;
};

const emptyDraft = (): PopupDraft => {
  const now = new Date();
  return {
    city_id: "latur",
    format: "letter",
    content: { en: { greeting: "", title: "", body: "", cta_label: "", cta_route: "" } },
    media: null,
    frame: { style: "royal_gold", seal: SEALS[0] },
    trigger: "app_open",
    trigger_value: null,
    screens: ["home"],
    targeting: {},
    frequency: "daily",
    frequency_value: null,
    max_shows: null,
    priority: 0,
    is_sponsored: false,
    starts_at: isoLocal(now),
    ends_at: isoLocal(new Date(now.getTime() + 14 * 86400000)),
  };
};

// The draft as the server wants it: empty texts dropped, dates with their offset.
function forServer(d: PopupDraft): PopupDraft {
  const en = Object.fromEntries(Object.entries(d.content.en).filter(([, v]) => v !== "" && v != null)) as PopupDraft["content"]["en"];
  return {
    ...d,
    content: { en },
    frame: d.format === "letter" ? d.frame : undefined,
    starts_at: d.starts_at.length === 16 ? withOffset(d.starts_at) : d.starts_at,
    ends_at: d.ends_at.length === 16 ? withOffset(d.ends_at) : d.ends_at,
  };
}

export const PopupsPage: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<PopupStatus | "all">("all");
  const [rows, setRows] = useState<Popup[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ id?: string; draft: PopupDraft } | null>(null);
  const [acting, setActing] = useState<{ popup: Popup; action: "submit" | "return" | "approve" | "end" } | null>(null);
  const [actError, setActError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ popup: Popup; data: PopupResults | null } | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try { setRows(await popupApi.list(status === "all" ? undefined : status)); } catch (e) { setError(popupError(e)); setRows([]); }
  }, [status]);
  useEffect(() => { void load(); }, [load]);

  const act = async (note?: string) => {
    if (!acting) return;
    setBusy(true); setActError(null);
    try {
      await popupApi.act(acting.popup.id, acting.action, note);
      setNotice(t(`popupsAdmin.done.${acting.action}`));
      setActing(null); await load();
    } catch (e) { setActError(new Error(popupError(e))); } finally { setBusy(false); }
  };

  const openResults = async (p: Popup) => {
    setResults({ popup: p, data: null });
    try { setResults({ popup: p, data: await popupApi.results(p.id) }); } catch (e) { setNotice(popupError(e)); setResults(null); }
  };

  const columns: Column<Popup>[] = [
    { key: "title", header: t("popupsAdmin.col.title"), render: (p) => <span className="font-semibold text-slate-900">{p.content.en.title}</span> },
    { key: "format", header: t("popupsAdmin.col.format"), render: (p) => t(`popupsAdmin.format.${p.format}`, p.format) },
    { key: "when", header: t("popupsAdmin.col.when"), render: (p) => `${t(`popupsAdmin.trigger.${p.trigger}`)} · ${t(`popupsAdmin.frequency.${p.frequency}`, { n: p.frequency_value })}` },
    { key: "dates", header: t("popupsAdmin.col.dates"), render: (p) => `${new Date(p.starts_at).toLocaleDateString()} – ${new Date(p.ends_at).toLocaleDateString()}` },
    { key: "status", header: t("popupsAdmin.col.status"), render: (p) => <StatusBadge code={p.status} /> },
    {
      key: "actions", header: "", render: (p) => (
        <div className="flex flex-wrap justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {p.status === "draft" && <Button variant="secondary" onClick={() => setActing({ popup: p, action: "submit" })}>{t("popupsAdmin.action.submit")}</Button>}
          {p.status === "submitted" && <Button onClick={() => setActing({ popup: p, action: "approve" })}>{t("popupsAdmin.action.approve")}</Button>}
          {p.status === "submitted" && <Button variant="ghost" onClick={() => setActing({ popup: p, action: "return" })}>{t("popupsAdmin.action.return")}</Button>}
          {["submitted", "approved", "live"].includes(p.status) && <Button variant="ghost" onClick={() => setActing({ popup: p, action: "end" })}>{t("popupsAdmin.action.end")}</Button>}
          {p.status !== "draft" && <Button variant="ghost" onClick={() => void openResults(p)}>{t("popupsAdmin.action.results")}</Button>}
          <Button variant="ghost" onClick={() => setEditing({ draft: { ...p, starts_at: isoLocal(new Date(p.starts_at)), ends_at: isoLocal(new Date(p.ends_at)) } })}>{t("popupsAdmin.action.copy")}</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t("popupsAdmin.eyebrow")}
        title={t("popupsAdmin.title")}
        subtitle={t("popupsAdmin.subtitle")}
        actions={<Button onClick={() => setEditing({ draft: emptyDraft() })}>{t("popupsAdmin.new")}</Button>}
      />
      {!!notice && <div className="mb-3"><Notice>{notice}</Notice></div>}
      <div className="mb-3 flex flex-wrap gap-1" role="tablist">
        {STATUSES.map((s) => (
          <button key={s} role="tab" aria-selected={status === s} onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${status === s ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>
            {t(`popupsAdmin.status.${s}`)}
          </button>
        ))}
      </div>
      {error && <div className="mb-3"><Notice tone="error">{error}</Notice></div>}
      {rows === null ? <LoadingBox /> : rows.length === 0 ? <EmptyBox text={t("popupsAdmin.empty")} hint={t("popupsAdmin.emptyHint")} /> : (
        <DataTable caption={t("popupsAdmin.title")} columns={columns} rows={rows} rowKey={(p) => p.id}
          onRowClick={(p) => p.status === "draft" && setEditing({ id: p.id, draft: { ...p, starts_at: isoLocal(new Date(p.starts_at)), ends_at: isoLocal(new Date(p.ends_at)) } })} />
      )}

      {editing && <PopupEditor initial={editing.draft} id={editing.id} onClose={() => setEditing(null)}
        onSaved={async (msg) => { setEditing(null); setNotice(msg); await load(); }} />}

      {acting && (acting.action === "return" || acting.action === "end") && (
        <ReasonDialog open title={t(`popupsAdmin.confirm.${acting.action}.title`)} description={t(`popupsAdmin.confirm.${acting.action}.body`)}
          confirmLabel={t(`popupsAdmin.action.${acting.action}`)} danger={acting.action === "end"} required={false}
          busy={busy} error={actError} onConfirm={(note) => void act(note)} onClose={() => { setActing(null); setActError(null); }} />
      )}
      {acting && (acting.action === "submit" || acting.action === "approve") && (
        <ConfirmDialog open title={t(`popupsAdmin.confirm.${acting.action}.title`)} description={t(`popupsAdmin.confirm.${acting.action}.body`)}
          confirmLabel={t(`popupsAdmin.action.${acting.action}`)} busy={busy} error={actError}
          onConfirm={() => void act()} onClose={() => { setActing(null); setActError(null); }} />
      )}

      {results && (
        <Modal open title={t("popupsAdmin.results.title", { title: results.popup.content.en.title })} onClose={() => setResults(null)}>
          {!results.data ? <LoadingBox /> : (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <KV label={t("popupsAdmin.results.people")}>{results.data.people}</KV>
                <KV label={t("popupsAdmin.results.shown")}>{results.data.total.impression}</KV>
                <KV label={t("popupsAdmin.results.tapped")}>{results.data.total.tap}</KV>
                <KV label={t("popupsAdmin.results.closed")}>{results.data.total.close}</KV>
              </div>
              {results.data.days.length === 0 ? <p className="text-slate-500">{t("popupsAdmin.results.none")}</p> : (
                <table className="w-full text-left">
                  <thead><tr className="text-slate-500"><th>{t("popupsAdmin.results.day")}</th><th>{t("popupsAdmin.results.shown")}</th><th>{t("popupsAdmin.results.tapped")}</th><th>{t("popupsAdmin.results.closed")}</th></tr></thead>
                  <tbody>{results.data.days.map((d) => <tr key={d.day}><td>{d.day}</td><td>{d.impression}</td><td>{d.tap}</td><td>{d.close}</td></tr>)}</tbody>
                </table>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ editor */

const PopupEditor: React.FC<{ initial: PopupDraft; id?: string; onClose: () => void; onSaved: (msg: string) => void }> = ({ initial, id, onClose, onSaved }) => {
  const { t } = useTranslation();
  const [d, setD] = useState<PopupDraft>(initial);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof PopupDraft>(k: K, v: PopupDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setText = (k: keyof PopupDraft["content"]["en"], v: string) => setD((x) => ({ ...x, content: { ...x.content, en: { ...x.content.en, [k]: v } } }));
  const welcome = d.trigger === "first_sign_in";

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setErr(""); setUploading(true);
    try {
      const isVideo = file.type === "video/mp4";
      if (!isVideo && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(t("popupsAdmin.upload.badType"));
      if (file.size > (isVideo ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES)) throw new Error(t(isVideo ? "popupsAdmin.upload.videoTooBig" : "popupsAdmin.upload.photoTooBig"));
      const info = await inspectCreative(file);
      if (!shapeOk(info.width, info.height)) throw new Error(t("popupsAdmin.upload.badShape", { w: info.width, h: info.height }));
      if (info.type === "video" && (info.seconds ?? 0) > VIDEO_MAX_SECONDS) throw new Error(t("popupsAdmin.upload.tooLong", { s: info.seconds }));
      const key = await popupApi.upload(file, file.name.replace(/[^A-Za-z0-9._-]/g, "-").slice(-80) || (isVideo ? "creative.mp4" : "creative.jpg"));
      const poster_key = info.poster ? await popupApi.upload(info.poster, "poster.jpg") : undefined;
      set("media", { type: info.type, key, poster_key, width: info.width, height: info.height, seconds: info.seconds, bytes: file.size });
    } catch (e) { setErr(popupError(e)); } finally { setUploading(false); }
  };

  const save = async () => {
    setErr(""); setSaving(true);
    try {
      const body = forServer(d);
      if (id) await popupApi.update(id, body); else await popupApi.create(body);
      onSaved(t("popupsAdmin.saved"));
    } catch (e) { setErr(popupError(e)); } finally { setSaving(false); }
  };

  return (
    <Drawer open title={id ? t("popupsAdmin.editTitle") : t("popupsAdmin.newTitle")} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button><Button busy={saving} disabled={uploading} onClick={() => void save()}>{t("popupsAdmin.saveDraft")}</Button></>}>
      <div className="space-y-4">
        {/* The side drawer is narrow, so the preview sits above the form instead of beside it. */}
        <div>
          <p className="mb-2 text-xs font-bold text-slate-700">{t("popupsAdmin.preview")}</p>
          <LetterPreview draft={d} />
        </div>
        <div className="space-y-4">
          {err && <Notice tone="error">{err}</Notice>}
          <Card title={t("popupsAdmin.section.look")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectInput label={t("popupsAdmin.field.format")} value={d.format} onChange={(e) => set("format", e.target.value as PopupDraft["format"])}>
                {(["letter", "popup_center", "popup_sheet", "strip"] as const).map((f) => <option key={f} value={f}>{t(`popupsAdmin.format.${f}`)}</option>)}
              </SelectInput>
              {d.format === "letter" && (
                <SelectInput label={t("popupsAdmin.field.frame")} value={d.frame?.style ?? "royal_gold"} onChange={(e) => set("frame", { ...d.frame, style: e.target.value as FrameStyle })}>
                  {(["royal_gold", "festive_red", "plain"] as const).map((s) => <option key={s} value={s}>{t(`popupsAdmin.frame.${s}`)}</option>)}
                </SelectInput>
              )}
            </div>
            {d.format === "letter" && (
              <Field label={t("popupsAdmin.field.seal")}>{() => (
                <div className="flex gap-2">{SEALS.map((c) => (
                  <button key={c} type="button" aria-label={c} onClick={() => set("frame", { style: d.frame?.style ?? "royal_gold", seal: c })}
                    className={`h-7 w-7 rounded-full border-2 ${d.frame?.seal === c ? "border-slate-900" : "border-white"}`} style={{ background: c }} />
                ))}</div>
              )}</Field>
            )}
            <div className="mt-3">
              <Field label={t("popupsAdmin.field.creative")} hint={t("popupsAdmin.upload.hint")}>{(fid) => (
                <input id={fid} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" disabled={uploading}
                  onChange={(e) => void pick(e.target.files?.[0])} className="block text-xs" />
              )}</Field>
              {uploading && <p className="mt-1 text-[11px] text-slate-500">{t("popupsAdmin.upload.working")}</p>}
              {d.media && <p className="mt-1 text-[11px] text-emerald-700">{t("popupsAdmin.upload.ok", { type: t(`popupsAdmin.media.${d.media.type}`), w: d.media.width, h: d.media.height })}</p>}
            </div>
          </Card>

          <Card title={t("popupsAdmin.section.message")}>
            <div className="grid gap-3">
              {d.format === "letter" && <TextInput label={t("popupsAdmin.field.greeting")} placeholder={t("popupsAdmin.placeholder.greeting")} maxLength={60} value={d.content.en.greeting ?? ""} onChange={(e) => setText("greeting", e.target.value)} />}
              <TextInput label={t("popupsAdmin.field.titleText")} maxLength={80} value={d.content.en.title} onChange={(e) => setText("title", e.target.value)} />
              <Field label={t("popupsAdmin.field.body")} hint={t("popupsAdmin.hint.body")}>{(fid) => (
                <textarea id={fid} rows={3} maxLength={280} className={inputCls} value={d.content.en.body ?? ""} onChange={(e) => setText("body", e.target.value)} />
              )}</Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput label={t("popupsAdmin.field.ctaLabel")} maxLength={30} value={d.content.en.cta_label ?? ""} onChange={(e) => setText("cta_label", e.target.value)} />
                <TextInput label={t("popupsAdmin.field.ctaRoute")} hint={t("popupsAdmin.hint.ctaRoute")} placeholder="/grocery" value={d.content.en.cta_route ?? ""} onChange={(e) => setText("cta_route", e.target.value)} />
              </div>
            </div>
          </Card>

          <Card title={t("popupsAdmin.section.audience")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectInput label={t("popupsAdmin.field.trigger")} value={d.trigger}
                onChange={(e) => {
                  const trigger = e.target.value as PopupDraft["trigger"];
                  setD((x) => ({ ...x, trigger, trigger_value: trigger === "after_seconds" ? (x.trigger_value ?? 5) : null,
                    ...(trigger === "first_sign_in" ? { frequency: "once" as const, frequency_value: null, targeting: { ...x.targeting, segments: ["new_signup"], signup_within_days: x.targeting.signup_within_days ?? 7 } } : {}) }));
                }}>
                {(["app_open", "screen_view", "after_seconds", "first_sign_in"] as const).map((s) => <option key={s} value={s}>{t(`popupsAdmin.trigger.${s}`)}</option>)}
              </SelectInput>
              {d.trigger === "after_seconds" && <TextInput label={t("popupsAdmin.field.seconds")} type="number" min={1} max={600} value={d.trigger_value ?? 5} onChange={(e) => set("trigger_value", Number(e.target.value))} />}
              <SelectInput label={t("popupsAdmin.field.frequency")} value={d.frequency} disabled={welcome}
                onChange={(e) => { const f = e.target.value as PopupDraft["frequency"]; setD((x) => ({ ...x, frequency: f, frequency_value: f === "every_hours" ? 24 : f === "every_nth_open" ? 3 : null })); }}>
                {(["once", "daily", "session", "every_hours", "every_nth_open"] as const).map((f) => <option key={f} value={f}>{t(`popupsAdmin.frequencyName.${f}`)}</option>)}
              </SelectInput>
              {(d.frequency === "every_hours" || d.frequency === "every_nth_open") && (
                <TextInput label={t(d.frequency === "every_hours" ? "popupsAdmin.field.hours" : "popupsAdmin.field.nthOpen")} type="number"
                  min={d.frequency === "every_hours" ? 1 : 2} max={d.frequency === "every_hours" ? 720 : 50} value={d.frequency_value ?? ""} onChange={(e) => set("frequency_value", Number(e.target.value))} />
              )}
              <TextInput label={t("popupsAdmin.field.maxShows")} hint={t("popupsAdmin.hint.maxShows")} type="number" min={1} max={100} value={d.max_shows ?? ""} onChange={(e) => set("max_shows", e.target.value ? Number(e.target.value) : null)} />
              <SelectInput label={t("popupsAdmin.field.audience")} value={welcome ? "new_signup" : d.targeting.segments?.[0] ?? "all"} disabled={welcome}
                onChange={(e) => set("targeting", { ...d.targeting, segments: e.target.value === "all" ? undefined : [e.target.value] })}>
                {(["all", "new_signup", "new", "repeat", "inactive_30d", "has_cart"] as const).map((s) => <option key={s} value={s}>{t(`popupsAdmin.segment.${s}`)}</option>)}
              </SelectInput>
              {(welcome || d.targeting.segments?.includes("new_signup")) && (
                <TextInput label={t("popupsAdmin.field.signupDays")} type="number" min={1} max={90} value={d.targeting.signup_within_days ?? 7}
                  onChange={(e) => set("targeting", { ...d.targeting, signup_within_days: Number(e.target.value) })} />
              )}
              <TextInput label={t("popupsAdmin.field.screens")} hint={t("popupsAdmin.hint.screens")} value={d.screens.join(", ")}
                onChange={(e) => set("screens", e.target.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))} />
              <TextInput label={t("popupsAdmin.field.city")} value={d.city_id} onChange={(e) => set("city_id", e.target.value.trim().toLowerCase())} />
              <TextInput label={t("popupsAdmin.field.starts")} type="datetime-local" value={d.starts_at} onChange={(e) => set("starts_at", e.target.value)} />
              <TextInput label={t("popupsAdmin.field.ends")} type="datetime-local" value={d.ends_at} onChange={(e) => set("ends_at", e.target.value)} />
            </div>
            {welcome && <p className="mt-2 text-[11px] text-slate-500">{t("popupsAdmin.hint.welcome")}</p>}
            <label className="mt-3 flex items-center gap-2 text-xs text-slate-700">
              <input type="checkbox" checked={d.is_sponsored} onChange={(e) => set("is_sponsored", e.target.checked)} /> {t("popupsAdmin.field.sponsored")}
            </label>
          </Card>
        </div>
      </div>
    </Drawer>
  );
};

/* ------------------------------------------------------------------ preview (a look-alike of the app's LetterPopup) */

const LetterPreview: React.FC<{ draft: PopupDraft }> = ({ draft }) => {
  const { t } = useTranslation();
  const look = LOOK[draft.frame?.style ?? "royal_gold"];
  const c = draft.content.en;
  const ratio = draft.media ? draft.media.width / draft.media.height : 0.8;
  const media = useMemo(() => draft.media, [draft.media]);
  if (draft.format !== "letter") return <p className="rounded-xl bg-slate-50 p-4 text-[11px] text-slate-500">{t("popupsAdmin.previewLetterOnly")}</p>;
  return (
    <div className="flex justify-center rounded-3xl bg-slate-800/80 p-4">
      <div className="relative w-[260px] rounded-[16px] p-[18px] pb-9 shadow-2xl" style={{ background: look.paper }}>
        <div className="pointer-events-none absolute inset-[6px] rounded-[11px] border-[1.5px]" style={{ borderColor: look.line }} />
        {draft.frame?.style !== "plain" && <div className="pointer-events-none absolute inset-[11px] rounded-[7px] border" style={{ borderColor: look.accent }} />}
        <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border bg-white/85 text-[11px]" style={{ borderColor: look.line, color: look.ink }}>✕</div>
        <div className="relative flex flex-col items-center gap-1.5 pt-2 text-center">
          <div className="w-full overflow-hidden rounded-[8px] border bg-slate-100" style={{ borderColor: look.accent, aspectRatio: String(ratio) }}>
            {media?.type === "photo" && <img src={media.key} alt="" className="h-full w-full object-cover" />}
            {media?.type === "video" && <video src={media.key} poster={media.poster_key} muted loop autoPlay playsInline className="h-full w-full object-cover" />}
            {!media && <div className="flex h-full items-center justify-center text-[10px] text-slate-400">{t("popupsAdmin.previewNoMedia")}</div>}
          </div>
          {c.greeting && <p className="mt-1 font-serif text-[12px] italic" style={{ color: look.soft }}>{c.greeting}</p>}
          <p className="font-serif text-[17px] font-bold leading-tight" style={{ color: look.ink }}>{c.title || t("popupsAdmin.previewTitle")}</p>
          {c.body && <p className="text-[11px] leading-snug" style={{ color: look.soft }}>{c.body}</p>}
          {c.cta_route && <span className="mt-1 rounded-full border px-4 py-1.5 text-[11px] font-bold" style={{ background: look.ink, borderColor: look.accent, color: "#F7E7B4" }}>{c.cta_label || t("popupsAdmin.previewOpen")} →</span>}
        </div>
        <div className="absolute -bottom-0 left-1/2 flex h-9 w-9 -translate-x-1/2 translate-y-1/3 items-center justify-center rounded-full text-sm font-black text-[#F7E7B4] shadow"
          style={{ background: `radial-gradient(circle at 40% 35%, rgba(255,255,255,0.3), ${draft.frame?.seal ?? SEALS[0]} 55%)` }}>1</div>
      </div>
    </div>
  );
};
