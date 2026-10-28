import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { partnerApplicationApi } from "../../api/partner-applications.api";
import type { CheckKind, PartnerApplication } from "../../api/partner-applications.api";
import { usePermissions } from "../../hooks/use-permissions";
import { FEAT } from "../../lib/master-features";
import { useFormat } from "../../i18n/useFormat";
import { Button, Notice, ReasonDialog, StatusBadge } from "./ui";
import { useAction } from "./useResource";

/** Checks and documents can change only while the application is open; the database enforces it again. */
const OPEN = new Set(["submitted", "reviewing"]);

/** What a reason dialog is about to do. Fail, reject and both hold changes always need a reason. */
type Pending =
  | { kind: "check"; check: CheckKind; status: "failed" }
  | { kind: "document"; docId: string; status: "rejected" }
  | { kind: "hold"; hold: boolean };

/**
 * Everything that stands between an application and its approval, in one place: the four checks, each uploaded
 * document (opened through a recorded 60-second link, never downloaded), the bank account as last four digits, and
 * the platform hold once the partner has a business. Approval stays disabled until all of it is verified.
 */
export const PartnerVerification: React.FC<{ a: PartnerApplication; onChanged: () => void }> = ({
  a,
  onChanged,
}) => {
  const { t } = useTranslation();
  const f = useFormat();
  const { can } = usePermissions();
  const action = useAction();
  const [pending, setPending] = useState<Pending | null>(null);
  const open = OPEN.has(a.status);
  const mayVerify = can(FEAT.PARTNER_REVIEW.id, FEAT.PARTNER_REVIEW.verifyChecks) && open;
  const mayReview = can(FEAT.PARTNER_REVIEW.id, FEAT.PARTNER_REVIEW.reviewDocuments) && open;
  const mayView = can(FEAT.PARTNER_REVIEW.id, FEAT.PARTNER_REVIEW.viewDocuments);
  const mayHold = can(FEAT.PARTNER_REVIEW.id, FEAT.PARTNER_REVIEW.hold);
  const dash = t("common.dash");

  const run = async (fn: () => Promise<unknown>) => {
    const out = await action.run(fn);
    if (out !== undefined) {
      setPending(null);
      onChanged();
    }
  };
  const view = async (docId: string) => {
    const out = await action.run(() => partnerApplicationApi.viewDocument(a.id, docId));
    if (out?.url) window.open(out.url, "_blank", "noopener,noreferrer");
  };
  const confirm = (reason: string) => {
    if (!pending) return;
    if (pending.kind === "check")
      run(() => partnerApplicationApi.setCheck(a.id, pending.check, pending.status, reason));
    else if (pending.kind === "document")
      run(() => partnerApplicationApi.reviewDocument(a.id, pending.docId, pending.status, reason));
    else run(() => partnerApplicationApi.setHold(a.id, pending.hold, reason));
  };

  return (
    <>
      {a.hold?.platform_hold && (
        <Notice tone="error">
          {t("m.applications.verify.onHold", {
            reason: a.hold.platform_hold_reason ?? dash,
            by: a.hold.platform_hold_by_name ?? dash,
            at: a.hold.platform_hold_at ? f.dateTime(a.hold.platform_hold_at) : dash,
          })}
        </Notice>
      )}
      {action.error && !pending ? (
        <Notice tone="error">{t("m.applications.verify.failed")}</Notice>
      ) : null}

      <section className="border-t border-slate-100 pt-3">
        <h3 className="mb-2 text-xs font-bold text-slate-700">
          {t("m.applications.verify.checks")}
        </h3>
        <ul className="space-y-2">
          {a.checks.map((c) => (
            <li key={c.kind} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-slate-800">
                {t(`m.applications.verify.check.${c.kind}`)}
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge code={c.status} />
                {c.decided_by_name && (
                  <span className="text-[11px] text-slate-500">
                    {c.decided_by_name}
                    {c.decided_at ? ` · ${f.dateTime(c.decided_at)}` : ""}
                  </span>
                )}
                {mayVerify && c.status !== "verified" && (
                  <Button
                    variant="primary"
                    busy={action.busy}
                    onClick={() =>
                      run(() => partnerApplicationApi.setCheck(a.id, c.kind, "verified"))
                    }
                  >
                    {t("m.applications.verify.verify")}
                  </Button>
                )}
                {mayVerify && c.status !== "failed" && (
                  <Button
                    variant="danger"
                    onClick={() => setPending({ kind: "check", check: c.kind, status: "failed" })}
                  >
                    {t("m.applications.verify.fail")}
                  </Button>
                )}
              </span>
              {c.note && <span className="w-full text-xs text-slate-500">{c.note}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-slate-100 pt-3">
        <h3 className="mb-2 text-xs font-bold text-slate-700">
          {t("m.applications.verify.documents")}
        </h3>
        {a.documents.length === 0 ? (
          <p className="text-xs text-slate-500">{t("m.applications.verify.noDocuments")}</p>
        ) : (
          <ul className="space-y-2">
            {a.documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-slate-800">
                  {t(`m.applications.verify.doc.${d.kind}`, { defaultValue: d.kind })}
                  <span className="ml-1 text-[11px] font-normal text-slate-500">{d.file_name}</span>
                </span>
                <span className="flex items-center gap-2">
                  <StatusBadge code={d.status} />
                  {mayView && (
                    <Button onClick={() => view(d.id)} busy={action.busy}>
                      {t("m.applications.verify.view")}
                    </Button>
                  )}
                  {mayReview && d.status !== "verified" && (
                    <Button
                      variant="primary"
                      busy={action.busy}
                      onClick={() =>
                        run(() => partnerApplicationApi.reviewDocument(a.id, d.id, "verified"))
                      }
                    >
                      {t("m.applications.verify.verify")}
                    </Button>
                  )}
                  {mayReview && d.status !== "rejected" && (
                    <Button
                      variant="danger"
                      onClick={() =>
                        setPending({ kind: "document", docId: d.id, status: "rejected" })
                      }
                    >
                      {t("m.applications.verify.reject")}
                    </Button>
                  )}
                </span>
                {d.review_note && (
                  <span className="w-full text-xs text-slate-500">{d.review_note}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-slate-100 pt-3">
        <h3 className="mb-2 text-xs font-bold text-slate-700">{t("m.applications.verify.bank")}</h3>
        {a.bank ? (
          <p className="text-sm text-slate-700">
            {[
              a.bank.holder_name,
              a.bank.bank_name,
              a.bank.account_last4 ? `•••• ${a.bank.account_last4}` : null,
              a.bank.ifsc,
            ]
              .filter(Boolean)
              .join(" · ")}{" "}
            <StatusBadge code={a.bank.status} />
          </p>
        ) : (
          <p className="text-xs text-slate-500">{t("m.applications.verify.noBank")}</p>
        )}
      </section>

      {mayHold && a.hold && (
        <section className="border-t border-slate-100 pt-3">
          <Button
            variant={a.hold.platform_hold ? "primary" : "danger"}
            onClick={() => setPending({ kind: "hold", hold: !a.hold?.platform_hold })}
          >
            {t(
              a.hold.platform_hold ? "m.applications.verify.release" : "m.applications.verify.hold"
            )}
          </Button>
        </section>
      )}

      <ReasonDialog
        open={pending !== null}
        required
        danger={pending?.kind !== "hold" || pending.hold}
        title={
          pending
            ? t(
                pending.kind === "check"
                  ? "m.applications.verify.dialog.fail"
                  : pending.kind === "document"
                    ? "m.applications.verify.dialog.reject"
                    : pending.hold
                      ? "m.applications.verify.dialog.hold"
                      : "m.applications.verify.dialog.release",
                { name: a.business_name }
              )
            : ""
        }
        confirmLabel={t("common.confirm")}
        reasonLabel={t("common.reason")}
        busy={action.busy}
        error={action.error}
        onConfirm={confirm}
        onClose={() => {
          setPending(null);
          action.clear();
        }}
      />
    </>
  );
};

/** True when every check and every uploaded document is verified: the same rule the database applies on approval. */
export const readyToApprove = (a: PartnerApplication) =>
  a.checks.length === 4 &&
  a.checks.every((c) => c.status === "verified") &&
  a.documents.every((d) => d.status === "verified");
