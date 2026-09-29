import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, X, Loader2, AlertTriangle } from "lucide-react";
import { planApi } from "../api/plan.api";
import { moduleApi } from "../api/module.api";
import { usePermissions } from "../hooks/use-permissions";

interface PlatformModule {
  id: string;
  key: string;
  name: string;
  selected: boolean;
  isFuture?: boolean;
}

export const PlanEditorPage: React.FC = () => {
  const { planId } = useParams<{ planId?: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const isNew = !planId || planId === "new";
  const canCreate = can("feat_commercial_plans", "create_plan");
  const canEdit = can("feat_commercial_plans", "edit_plan");
  const canPublish = can("feat_commercial_plans", "publish_plan");
  const canManageModules = can("feat_commercial_plans", "manage_modules");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Plan Details State (No static mock data)
  const [planName, setPlanName] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [billingCadence, setBillingCadence] = useState("Monthly");
  const [trialDays, setTrialDays] = useState("14");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);

  // Hard Provision Limits State
  const [locationsAllowed, setLocationsAllowed] = useState("1");
  const [coreAdminUsers, setCoreAdminUsers] = useState("3");

  // Modules State - Pure DB-driven
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Modals & Feedback
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load modules & existing plan if editing
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch live platform modules from DB
        const modRes = await moduleApi.getAll();
        let loadedModules: PlatformModule[] = (modRes.modules || []).map((m) => ({
          id: m.id,
          key: m.key,
          name: m.name,
          selected: isNew, // Select all existing modules by default when creating new plan
        }));

        // If editing an existing plan, fetch plan details
        if (!isNew && planId) {
          const planRes = await planApi.getById(planId);
          if (planRes.plan) {
            const p = planRes.plan;
            setPlanName(p.name);
            setPlanCode(p.plan_code);
            setPrice(p.price.toString());
            setCurrency(p.currency);
            setBillingCadence(p.cadence || "Monthly");
            setTrialDays(p.trial_days.toString());
            setEffectiveDate(
              p.effective_date
                ? p.effective_date.split("T")[0]
                : new Date().toISOString().split("T")[0]
            );
            setLocationsAllowed(p.locations_limit.toString());
            setCoreAdminUsers(p.users_limit.toString());

            // Match module selections strictly by module key/code, supporting case-insensitivity and legacy ALL
            const planModules = Array.isArray(p.modules) ? p.modules : [];
            const hasAllFlag = planModules.some(
              (k) => typeof k === "string" && k.toUpperCase() === "ALL"
            );

            loadedModules = loadedModules.map((m) => {
              const isIncluded =
                hasAllFlag ||
                planModules.some(
                  (k) =>
                    typeof k === "string" && (k.toUpperCase() === m.key.toUpperCase() || k === m.id)
                );
              return {
                ...m,
                selected: isIncluded,
              };
            });
          }
        }

        setModules(loadedModules);
      } catch {
        setModules([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [planId, isNew]);

  const selectedCount = modules.filter((m) => m.selected).length;

  const toggleModule = (id: string) => {
    if (!canManageModules) {
      setToastMessage("You don't have permission to modify module bundles.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m)));
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    if (modules.length === 0) {
      setToastMessage(
        "Platform modules are required before saving a plan. Please register platform modules first."
      );
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    if (!isNew && !canEdit) {
      setToastMessage("You don't have permission to edit plans.");
      return;
    }
    if (isNew && !canCreate) {
      setToastMessage("You don't have permission to create plans.");
      return;
    }

    setIsSaving(true);
    const selectedKeys = modules.filter((m) => m.selected).map((m) => m.key);
    const payload = {
      name: planName,
      plan_code: planCode,
      price: parseFloat(price.replace(/,/g, "")) || 0,
      currency,
      cadence: (billingCadence as "Monthly" | "Quarterly" | "Annual") || "Monthly",
      trial_days: parseInt(trialDays, 10) || 3,
      effective_date: effectiveDate,
      locations_limit: parseInt(locationsAllowed, 10) || 1,
      users_limit: parseInt(coreAdminUsers, 10) || 3,
      modules: selectedKeys, // Always store explicit module codes
      status: "Draft" as const,
      version_type: "Draft" as const,
    };

    try {
      if (isNew) {
        const res = await planApi.create(payload);
        setToastMessage("Plan draft created successfully.");
        setHasUnsavedChanges(false);
        setTimeout(() => navigate(`/commercials/plans/${res.plan.id}/edit`), 1000);
      } else if (planId) {
        await planApi.update(planId, payload);
        setToastMessage("Plan draft saved successfully.");
        setHasUnsavedChanges(false);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save draft.";
      setToastMessage(msg);
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handlePublish = async () => {
    if (modules.length === 0) {
      setToastMessage(
        "Platform modules are required before publishing a plan. Please register platform modules first."
      );
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    if (!canPublish) {
      setToastMessage("You don't have permission to publish plans.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      const selectedKeys = modules.filter((m) => m.selected).map((m) => m.key);
      if (isNew) {
        await planApi.create({
          name: planName,
          plan_code: planCode,
          price: parseFloat(price.replace(/,/g, "")) || 0,
          currency,
          cadence: (billingCadence as "Monthly" | "Quarterly" | "Annual") || "Monthly",
          trial_days: parseInt(trialDays, 10) || 3,
          effective_date: effectiveDate,
          locations_limit: parseInt(locationsAllowed, 10) || 1,
          users_limit: parseInt(coreAdminUsers, 10) || 3,
          modules: selectedKeys, // Always store explicit module codes
          status: "Published",
          version_type: "Active",
        });
        setToastMessage(`Plan "${planName}" created and published!`);
      } else if (planId) {
        await planApi.update(planId, {
          name: planName,
          plan_code: planCode,
          price: parseFloat(price.replace(/,/g, "")) || 0,
          currency,
          cadence: (billingCadence as "Monthly" | "Quarterly" | "Annual") || "Monthly",
          trial_days: parseInt(trialDays, 10) || 3,
          effective_date: effectiveDate,
          locations_limit: parseInt(locationsAllowed, 10) || 1,
          users_limit: parseInt(coreAdminUsers, 10) || 3,
          modules: selectedKeys,
        });
        await planApi.publish(planId);
        setToastMessage(`Plan "${planName}" published successfully!`);
      }
      setHasUnsavedChanges(false);
      setTimeout(() => navigate("/commercials/plans"), 1200);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to publish plan.";
      setToastMessage(msg);
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16 antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Breadcrumb Navigation */}
      <nav className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
        <Link to="/dashboard" className="hover:text-slate-800">
          Master
        </Link>
        <span>/</span>
        <Link to="/commercials" className="hover:text-slate-800">
          Commercials
        </Link>
        <span>/</span>
        <Link to="/commercials/plans" className="hover:text-slate-800">
          Plans
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">
          {isNew ? "New Plan" : planName || "Edit Plan"}
        </span>
      </nav>

      {/* 2. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isNew ? "Create Commercial Plan" : `Edit ${planName || "Plan"}`}
          </h1>
          {isLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            Preview Publish Impact
          </button>

          {(isNew ? canCreate : canEdit) && (
            <button
              type="button"
              disabled={isSaving || modules.length === 0}
              onClick={handleSaveDraft}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
          )}

          {canPublish && (
            <button
              type="button"
              disabled={isSaving || modules.length === 0}
              onClick={handlePublish}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSaving ? "Publishing..." : "Publish Plan"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Platform Modules Required Warning Banner */}
      {!isLoading && modules.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">
                Platform Modules Required Before Creating Plans
              </div>
              <p className="mt-0.5 text-amber-700">
                No platform modules currently exist in the database. Please register platform
                modules first before configuring a commercial plan.
              </p>
            </div>
          </div>
          <Link
            to="/commercials/modules"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 transition-colors"
          >
            <span>Go to Platform Modules &rarr;</span>
          </Link>
        </div>
      )}

      {/* 4. Unsaved Changes Alert Notice */}
      {hasUnsavedChanges && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-xl px-4 py-2.5 text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span>
            You have unsaved module limit changes. Previewing impact is recommended prior to
            publishing.
          </span>
        </div>
      )}

      {/* 5. Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Plan Basics & Hard Limits */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Plan Basics */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Plan Basics</h2>

            {/* Row 0: Plan Name & Plan Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                  PLAN NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Growth"
                  value={planName}
                  onChange={(e) => {
                    setPlanName(e.target.value);
                    if (isNew) {
                      setPlanCode(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "_")
                          .replace(/_+/g, "_")
                      );
                    }
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                  PLAN CODE (SLUG) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. standard_growth"
                  value={planCode}
                  onChange={(e) => {
                    setPlanCode(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                  PRICE (INR) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4999"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                  BILLING CADENCE
                </label>
                <select
                  value={billingCadence}
                  onChange={(e) => {
                    setBillingCadence(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                  TRIAL PERIOD (DAYS)
                </label>
                <input
                  type="number"
                  min="0"
                  value={trialDays}
                  onChange={(e) => {
                    setTrialDays(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                  EFFECTIVE DATE
                </label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => {
                    setEffectiveDate(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Hard Provision Limits */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Hard Provision Limits
            </h2>

            <div className="space-y-4">
              {/* Row 1: Locations allowed */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-800 min-w-[120px]">
                  Locations allowed
                </span>
                <input
                  type="number"
                  min="1"
                  value={locationsAllowed}
                  onChange={(e) => {
                    setLocationsAllowed(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-20 text-center bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 text-right flex-1">
                  Defines maximum tenant deployment sites
                </span>
              </div>

              {/* Row 2: Core admin users */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-medium text-slate-800 min-w-[120px]">
                  Core admin users
                </span>
                <input
                  type="number"
                  min="1"
                  value={coreAdminUsers}
                  onChange={(e) => {
                    setCoreAdminUsers(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-20 text-center bg-white border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 text-right flex-1">
                  Total master administration personnel permitted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Included Platform Modules */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Included Platform Modules
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select which modular capabilities are enabled for this commercial tier.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isLoading && modules.length > 0 && (
                  <span className="text-xs font-extrabold text-[#15803D] tracking-wider uppercase">
                    {selectedCount} SELECTED
                  </span>
                )}
              </div>
            </div>

            {/* Modules Checkable List or Empty State */}
            {isLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Loading platform modules...</p>
              </div>
            ) : modules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/50 p-8 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                <div className="text-sm font-bold text-amber-900">
                  No Platform Modules Available
                </div>
                <p className="text-xs text-amber-700 max-w-sm mx-auto">
                  No platform modules currently exist in the database. You must register platform
                  modules first before configuring commercial plan bundles.
                </p>
                <Link
                  to="/commercials/modules"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs"
                >
                  <span>Go to Platform Modules &rarr;</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {modules.map((mod) => (
                  <div
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer select-none text-xs ${
                      mod.selected
                        ? "bg-[#EAF7DB] border-[#C5E59F] text-slate-900 font-semibold shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          mod.selected
                            ? "bg-[#15803D] text-white"
                            : "border border-slate-300 bg-white"
                        }`}
                      >
                        {mod.selected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{mod.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">
                          [{mod.key}]
                        </span>
                      </div>
                    </div>

                    {mod.isFuture && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        FUTURE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Bottom Navigation */}
      <div className="pt-2">
        <Link
          to="/commercials/plans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Plans</span>
        </Link>
      </div>

      {/* 7. Preview Publish Impact Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Publish Impact Preview</h3>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                <span className="font-bold">Review Plan Configuration:</span> Active tenant
                subscriptions assigned to this tier will immediately reflect these limits upon
                publishing.
              </div>

              <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50">
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan Name:</span>
                  <span className="font-bold text-slate-800">{planName || "Untitled Plan"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan Code:</span>
                  <span className="font-mono font-bold text-slate-800">{planCode || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Price:</span>
                  <span className="font-bold text-slate-800">
                    {currency} {price || "0"} / {billingCadence}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Active Modules:</span>
                  <span className="font-bold text-emerald-700">{selectedCount} Included</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Locations:</span>
                  <span className="font-bold text-slate-800">{locationsAllowed} Allowed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin Seats:</span>
                  <span className="font-bold text-slate-800">{coreAdminUsers} Users</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                disabled={isSaving || modules.length === 0}
                onClick={() => {
                  setShowPreviewModal(false);
                  handlePublish();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 cursor-pointer"
              >
                Confirm & Request Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanEditorPage;
