import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { STORE_TYPES, roleSetApi } from "../../api/role-sets.api";
import type { StoreType } from "../../api/role-sets.api";
import { usePermissions } from "../../hooks/use-permissions";
import { FEAT } from "../../lib/master-features";
import { Button, Notice, SelectInput } from "./ui";
import { useAction, useResource } from "./useResource";

/** A partner type from the application, read as a store type when it is one. */
const asStoreType = (v?: string): StoreType =>
  (STORE_TYPES as readonly string[]).includes(v ?? "") ? (v as StoreType) : "store";

/**
 * The roles a business holds and who holds them, applying its store type's approved set, and (outside production,
 * super admin only) a test login whose password is shown once.
 */
export const OrgRolesPanel: React.FC<{ org: string; partnerType?: string }> = ({
  org,
  partnerType,
}) => {
  const { t } = useTranslation();
  const { can, isSuperAdmin } = usePermissions();
  const mayManage = can(FEAT.ROLE_SETS.id, FEAT.ROLE_SETS.manage);
  const mayTest = isSuperAdmin;
  const action = useAction();
  const [type, setType] = useState<StoreType>(asStoreType(partnerType));
  const [role, setRole] = useState("org_owner");
  const [made, setMade] = useState<{ email: string; password: string } | null>(null);
  const res = useResource(() => roleSetApi.forOrganization(org), [org]);
  const d = res.data;

  if (!can(FEAT.ROLE_SETS.id, FEAT.ROLE_SETS.view) || !d) return null;
  return (
    <section className="space-y-2 border-t border-slate-100 pt-3">
      <h3 className="text-xs font-bold text-slate-700">{t("m.orgRoles.title")}</h3>
      {action.error ? <Notice tone="error">{t("m.orgRoles.failed")}</Notice> : null}
      <p className="text-xs text-slate-600">
        {d.grants.length
          ? t("m.orgRoles.granted", { roles: d.grants.map((g) => g.role_name).join(", ") })
          : t("m.orgRoles.noGrants")}
      </p>
      {d.members.length > 0 && (
        <ul className="space-y-1 text-xs text-slate-700">
          {d.members.map((m, i) => (
            <li key={`${m.role_slug}-${i}`}>
              <span className="font-semibold">{m.role_name}</span> ·{" "}
              {m.email_masked ?? t("common.dash")}
              {m.is_test ? ` · ${t("m.orgRoles.test")}` : ""}
            </li>
          ))}
        </ul>
      )}
      {mayManage && (
        <div className="flex flex-wrap items-end gap-2">
          <SelectInput
            label={t("m.orgRoles.storeType")}
            value={type}
            onChange={(e) => setType(e.target.value as StoreType)}
          >
            {STORE_TYPES.map((s) => (
              <option key={s} value={s}>
                {t(`m.roleSets.type.${s}`)}
              </option>
            ))}
          </SelectInput>
          <Button
            busy={action.busy}
            onClick={async () => {
              const out = await action.run(() => roleSetApi.apply(org, type));
              if (out !== undefined) res.reload();
            }}
          >
            {t("m.orgRoles.apply")}
          </Button>
        </div>
      )}
      {mayTest && d.test_logins_allowed && (
        <div className="flex flex-wrap items-end gap-2">
          <SelectInput
            label={t("m.orgRoles.testRole")}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="org_owner">{t("m.orgRoles.owner")}</option>
            {d.grants.map((g) => (
              <option key={g.role_slug} value={g.role_slug}>
                {g.role_name}
              </option>
            ))}
          </SelectInput>
          <Button
            variant="primary"
            busy={action.busy}
            onClick={async () => {
              const out = await action.run(() => roleSetApi.createTestLogin(org, role));
              if (out !== undefined) {
                setMade(out);
                res.reload();
              }
            }}
          >
            {t("m.orgRoles.createTest")}
          </Button>
        </div>
      )}
      {made && (
        <Notice>
          {t("m.orgRoles.made", { email: made.email })}{" "}
          <code className="select-all rounded bg-white px-1 font-mono">{made.password}</code>{" "}
          {t("m.orgRoles.once")}
        </Notice>
      )}
    </section>
  );
};
