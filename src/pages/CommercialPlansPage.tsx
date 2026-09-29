import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Filter,
  ChevronDown,
  CheckCircle2,
  Plus,
  Loader2,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { planApi, CommercialPlanItem } from "../api/plan.api";
import { moduleApi } from "../api/module.api";
import { usePermissions } from "../hooks/use-permissions";

export interface PlanItem {
  id: string;
  name: string;
  version: string;
  versionType: "Draft" | "Active" | "Custom" | "Legacy";
  price: string;
  cadence: string;
  taxNote: string;
  status: "Draft" | "Published" | "Retired";
  includedModules: string;
  includedModulesNote?: string;
  rawModules?: string[];
  locationsLimit: string;
  usersLimit: string;
  assignmentsCount: number;
  assignmentsLabel: string;
  lastUpdatedTime: string;
  lastUpdatedBy: string;
}

type StatusFilter = "All Active" | "All" | "Draft" | "Published" | "Retired";
type CurrencyFilter = "INR (₹)" | "USD ($)";

const mapApiPlanToItem = (
  p: CommercialPlanItem,
  moduleLookup?: Map<string, string>,
  totalPlatformModulesCount?: number
): PlanItem => {
  const rawList = Array.isArray(p.modules) ? p.modules : [];
  const moduleList = rawList.filter((m) => typeof m === "string" && m.toUpperCase() !== "ALL");

  let includedModules = "No Modules";
  let includedModulesNote: string | undefined = undefined;

  if (moduleList.length === 0) {
    includedModules = "No Modules";
    includedModulesNote = "Minimal Core";
  } else if (
    totalPlatformModulesCount &&
    totalPlatformModulesCount >= 3 &&
    moduleList.length >= totalPlatformModulesCount
  ) {
    includedModules = "All Platform Modules";
    includedModulesNote = "Architectural Ready";
  } else {
    // Map to friendly module names (or fallback to key)
    const names = moduleList.map((k) => {
      const lookup = moduleLookup?.get(k.toUpperCase()) || moduleLookup?.get(k);
      return lookup || k;
    });

    if (names.length <= 2) {
      includedModules = names.join(", ");
      includedModulesNote = `${names.length} Core Module${names.length === 1 ? "" : "s"}`;
    } else {
      includedModules = `${names.slice(0, 2).join(", ")},`;
      includedModulesNote = `+${names.length - 2} Core Modules`;
    }
  }

  return {
    id: p.id,
    name: p.name,
    version: `Version ${p.version || "1.0"} (${p.version_type})`,
    versionType: p.version_type,
    price: p.currency === "INR" ? `₹${p.price.toLocaleString()}` : `$${p.price}`,
    cadence: p.cadence ? `/ ${p.cadence.toLowerCase().replace("ly", "")}` : "/ mo",
    taxNote: p.tax_note || "+18% GST Applicable",
    status: p.status,
    includedModules,
    includedModulesNote,
    rawModules: moduleList,
    locationsLimit: p.is_unlimited_locations
      ? "Unlimited Locations"
      : `${p.locations_limit} Location${p.locations_limit > 1 ? "s" : ""} Allowed`,
    usersLimit: p.is_unlimited_users ? "Unlimited Admins" : `${p.users_limit} Core Admin Users`,
    assignmentsCount: p.assignments_count || 0,
    assignmentsLabel: `${p.assignments_count || 0} Active Orgs`,
    lastUpdatedTime: new Date(p.updated_at || p.created_at).toLocaleDateString(),
    lastUpdatedBy: p.updated_by_email ? `by ${p.updated_by_email}` : "by system",
  };
};

export const CommercialPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCreate = can("feat_commercial_plans", "create_plan");
  const canEdit = can("feat_commercial_plans", "edit_plan");
  const canDuplicate = can("feat_commercial_plans", "duplicate_plan");
  const canRetire = can("feat_commercial_plans", "retire_plan");

  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [modulesCount, setModulesCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Active");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("INR (₹)");
  const [showRetiredView, setShowRetiredView] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const hasAnyPlanActions = canEdit || canDuplicate || canRetire || showRetiredView;

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const [planRes, modRes] = await Promise.all([
        planApi.getAll(),
        moduleApi.getAll().catch(() => ({ message: "OK", modules: [] })),
      ]);
      const modulesList = modRes.modules || [];
      const lookup = new Map<string, string>();
      modulesList.forEach((m) => {
        const shortName = m.name
          .replace(" Management", "")
          .replace(" Engine", "")
          .replace(" Supply", "");
        lookup.set(m.key.toUpperCase(), shortName);
        lookup.set(m.id, shortName);
      });
      setPlans((planRes.plans || []).map((p) => mapApiPlanToItem(p, lookup, modulesList.length)));
      setModulesCount(modulesList.length);
    } catch {
      setPlans([]);
      setModulesCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Status badge styling helper
  const renderStatusBadge = (status: PlanItem["status"]) => {
    switch (status) {
      case "Published":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#EAF7DB] text-[#2B7000] border border-[#CDE7B2]">
            Published
          </span>
        );
      case "Draft":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
      case "Retired":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
            Retired
          </span>
        );
    }
  };

  const filteredPlans = plans.filter((plan) => {
    if (showRetiredView) return plan.status === "Retired";
    if (statusFilter === "All Active") return plan.status !== "Retired";
    if (statusFilter === "All") return true;
    return plan.status === statusFilter;
  });

  const handleDuplicate = async (plan: PlanItem) => {
    try {
      const res = await planApi.duplicate(plan.id);
      if (res.plan) {
        setPlans((prev) => [mapApiPlanToItem(res.plan), ...prev]);
        setToastMessage(`Duplicated "${plan.name}" into new draft.`);
      }
    } catch {
      setToastMessage("Failed to duplicate plan.");
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRetire = async (planId: string) => {
    try {
      await planApi.retire(planId);
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? { ...p, status: "Retired", lastUpdatedTime: "Just now", lastUpdatedBy: "by you" }
            : p
        )
      );
      setToastMessage("Plan status updated to Retired.");
    } catch {
      setToastMessage("Failed to retire plan.");
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreatePlanClick = () => {
    if (modulesCount === 0) {
      setToastMessage("Please create platform modules first before creating a commercial plan.");
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    navigate("/commercials/plans/new");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Breadcrumbs */}
      <nav className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
        <Link to="/dashboard" className="hover:text-slate-800">
          Master
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">Commercial Plans</span>
      </nav>

      {/* 2. Top Tabs: Plans & Modules Navigation */}
      <div className="flex border-b border-slate-200 gap-8 text-sm font-semibold">
        <Link
          to="/commercials/plans"
          className="pb-3 border-b-2 border-emerald-600 text-slate-900 transition-colors"
        >
          Commercial Plans
        </Link>
        <Link
          to="/commercials/modules"
          className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition-colors"
        >
          Platform Modules
        </Link>
      </div>

      {/* 3. Header Area with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            SaaS Commercial Plans
          </h1>
          {isLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowRetiredView(!showRetiredView)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors shadow-2xs cursor-pointer ${
              showRetiredView
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {showRetiredView ? "View Active Plans" : "View Retired Plans"}
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={handleCreatePlanClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Platform Modules Required Warning Alert */}
      {!isLoading && modulesCount === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">
                Platform Modules Required Before Creating Plans
              </div>
              <p className="mt-0.5 text-amber-700">
                No platform modules currently exist in the database. Please create platform modules
                first before configuring commercial plans.
              </p>
            </div>
          </div>
          <Link
            to="/commercials/modules"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 transition-colors"
          >
            <span>View Platform Modules &rarr;</span>
          </Link>
        </div>
      )}

      {/* 5. Filters Row */}
      <div className="flex items-center gap-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold px-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>

        {/* Status Filter Pill */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filter plans by status"
            className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="All Active">Status: All Active</option>
            <option value="All">Status: All Statuses</option>
            <option value="Published">Status: Published</option>
            <option value="Draft">Status: Draft</option>
            <option value="Retired">Status: Retired</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Currency Filter Pill */}
        <div className="relative">
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value as CurrencyFilter)}
            aria-label="Filter plans by currency"
            className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="INR (₹)">Currency: INR (₹)</option>
            <option value="USD ($)">Currency: USD ($)</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 6. Plans Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading commercial plans...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {showRetiredView ? "No retired plans found" : "No commercial plans found"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {showRetiredView
                ? "There are currently no archived or retired plans."
                : "No SaaS commercial plans have been created yet."}
            </p>
            {!showRetiredView && canCreate && (
              <button
                type="button"
                onClick={handleCreatePlanClick}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Plan</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">PLAN NAME & VERSION</th>
                  <th className="py-3.5 px-4">PRICE & CADENCE</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4">INCLUDED MODULES</th>
                  <th className="py-3.5 px-4">KEY LIMITS</th>
                  <th className="py-3.5 px-4">ASSIGNMENTS</th>
                  <th className="py-3.5 px-4">LAST UPDATED</th>
                  {hasAnyPlanActions && <th className="py-3.5 px-5 text-right">ACTIONS</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Plan Name & Version */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm">{plan.name}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{plan.version}</div>
                    </td>

                    {/* Price & Cadence */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {plan.price} {plan.cadence}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{plan.taxNote}</div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {renderStatusBadge(plan.status)}
                    </td>

                    {/* Included Modules */}
                    <td className="py-4 px-4" title={plan.rawModules?.join(", ")}>
                      <div className="text-slate-800 font-medium">{plan.includedModules}</div>
                      {plan.includedModulesNote && (
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {plan.includedModulesNote}
                        </div>
                      )}
                    </td>

                    {/* Key Limits */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{plan.locationsLimit}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{plan.usersLimit}</div>
                    </td>

                    {/* Assignments */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div
                        className={`font-semibold ${
                          plan.assignmentsCount > 0 ? "text-[#15803D] font-bold" : "text-slate-700"
                        }`}
                      >
                        {plan.assignmentsLabel}
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{plan.lastUpdatedTime}</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{plan.lastUpdatedBy}</div>
                    </td>

                    {/* Actions */}
                    {hasAnyPlanActions && (
                      <td className="py-4 px-5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-3">
                          {plan.status === "Draft" ? (
                            <>
                              {canEdit && (
                                <Link
                                  to={`/commercials/plans/${plan.id}/edit`}
                                  className="font-bold text-[#15803D] hover:underline"
                                >
                                  Edit Draft
                                </Link>
                              )}
                              {canDuplicate && (
                                <button
                                  type="button"
                                  onClick={() => handleDuplicate(plan)}
                                  className="text-slate-600 hover:text-slate-900 font-medium hover:underline cursor-pointer"
                                >
                                  Duplicate
                                </button>
                              )}
                            </>
                          ) : plan.status === "Published" ? (
                            <>
                              {canEdit && (
                                <Link
                                  to={`/commercials/plans/${plan.id}/edit`}
                                  className="font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                                >
                                  Edit
                                </Link>
                              )}
                              {canDuplicate && (
                                <button
                                  type="button"
                                  onClick={() => handleDuplicate(plan)}
                                  className="font-semibold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                                >
                                  Duplicate
                                </button>
                              )}
                              {canRetire && (
                                <button
                                  type="button"
                                  onClick={() => handleRetire(plan.id)}
                                  className="text-slate-600 hover:text-rose-600 font-medium hover:underline cursor-pointer"
                                >
                                  Retire
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setToastMessage(`Displaying audit history for ${plan.name}`)
                              }
                              className="font-medium text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                            >
                              View History
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommercialPlansPage;
