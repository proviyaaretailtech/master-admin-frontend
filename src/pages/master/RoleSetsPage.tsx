import React from "react";
import { useTranslation } from "react-i18next";
import { STORE_TYPES, roleSetApi } from "../../api/role-sets.api";
import type { StoreType } from "../../api/role-sets.api";
import { usePermissions } from "../../hooks/use-permissions";
import { FEAT } from "../../lib/master-features";
import { Notice, PageHeader, PageState } from "../../components/master/ui";
import { useAction, useResource } from "../../components/master/useResource";

/**
 * Which staff roles each kind of store may use. Empty until the founder ticks them here: nothing is decided in code.
 * A business gets its store type's set when Master applies it (on the partner's application).
 */
export const RoleSetsPage: React.FC = () => {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const mayManage = can(FEAT.ROLE_SETS.id, FEAT.ROLE_SETS.manage);
  const action = useAction();
  const res = useResource(() => roleSetApi.list(), []);
  const inSet = (type: StoreType, slug: string) =>
    Boolean(res.data?.sets.some((s) => s.store_type === type && s.role_slug === slug));

  const toggle = async (type: StoreType, slug: string) => {
    const out = await action.run(() =>
      inSet(type, slug) ? roleSetApi.remove(type, slug) : roleSetApi.add(type, slug)
    );
    if (out !== undefined) res.reload();
  };

  return (
    <div>
      <PageHeader
        eyebrow={t("nav.accessControl")}
        title={t("m.roleSets.title")}
        subtitle={t("m.roleSets.subtitle")}
      />
      {action.error ? <Notice tone="error">{t("m.roleSets.failed")}</Notice> : null}
      <PageState
        loading={res.loading}
        error={res.error}
        denied={res.denied}
        onRetry={res.reload}
        empty={!res.data}
      >
        {res.data && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("m.roleSets.title")}</caption>
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="p-3">{t("m.roleSets.role")}</th>
                  {STORE_TYPES.map((type) => (
                    <th key={type} className="p-3 text-center">
                      {t(`m.roleSets.type.${type}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {res.data.roles.map((role) => (
                  <tr key={role.slug} className="border-b border-slate-50">
                    <td className="p-3">
                      <span className="font-semibold text-slate-900">{role.name}</span>
                      {role.description && (
                        <span className="block text-[11px] text-slate-500">{role.description}</span>
                      )}
                    </td>
                    {STORE_TYPES.map((type) => (
                      <td key={type} className="p-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={t("m.roleSets.toggle", {
                            role: role.name,
                            type: t(`m.roleSets.type.${type}`),
                          })}
                          checked={inSet(type, role.slug)}
                          disabled={!mayManage || action.busy}
                          onChange={() => toggle(type, role.slug)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageState>
    </div>
  );
};
