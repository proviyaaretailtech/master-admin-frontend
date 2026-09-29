import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, X } from "lucide-react";

interface PlatformModule {
  id: string;
  name: string;
  selected: boolean;
  isFuture?: boolean;
}

const INITIAL_MODULES: PlatformModule[] = [
  { id: "mod_org", name: "Organization", selected: true },
  { id: "mod_access", name: "Access Control", selected: true },
  { id: "mod_commercials", name: "Commercials", selected: true },
  { id: "mod_core", name: "Platform Core", selected: true },
  { id: "mod_commerce", name: "Commerce Engine", selected: true },
  { id: "mod_inventory", name: "Inventory Supply", selected: true },
  { id: "mod_fulfilment", name: "Fulfilment", selected: true },
  { id: "mod_intelligence", name: "Intelligence", selected: false },
  { id: "mod_operations", name: "Operations", selected: true },
  { id: "mod_support", name: "Support", selected: true },
  { id: "mod_developer", name: "Developer (Architecture Ready)", selected: false, isFuture: true },
  { id: "mod_audit", name: "Audit (Architecture Ready)", selected: false, isFuture: true },
];

export const PlanEditorPage: React.FC = () => {
  // Plan Basics State
  const [price, setPrice] = useState("4,999");
  const [billingCadence, setBillingCadence] = useState("Monthly");
  const [trialDays, setTrialDays] = useState("14");
  const [effectiveDate, setEffectiveDate] = useState("2026-02-01 00:00:00");

  // Hard Provision Limits State
  const [locationsAllowed, setLocationsAllowed] = useState("3");
  const [coreAdminUsers, setCoreAdminUsers] = useState("10");

  // Modules State
  const [modules, setModules] = useState<PlatformModule[]>(INITIAL_MODULES);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(true);

  // Modals & Feedback
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedCount = modules.filter((m) => m.selected).length;

  const toggleModule = (id: string) => {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m)));
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = () => {
    setHasUnsavedChanges(false);
    setToastMessage("Plan draft saved successfully.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePublish = () => {
    setHasUnsavedChanges(false);
    setToastMessage("Publish request submitted for Growth Plan v2.1.");
    setTimeout(() => setToastMessage(null), 3500);
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

      {/* 1. Context Metadata Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 px-3 bg-white border border-slate-200/80 rounded-xl text-[11px] text-slate-600 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold">
            M3-02
          </span>
          <span className="font-semibold text-slate-800">Region: India (GST Active)</span>
          <span className="text-slate-300">|</span>
          <span>Timezone: Asia/Kolkata</span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-slate-500 font-medium">Role: Master Commercial Admin</span>
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 tracking-wider text-[10px] uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE CONSOLE
          </span>
        </div>
      </div>

      {/* 2. Breadcrumb Navigation */}
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
        <span className="text-slate-900 font-bold">Growth Plan v2.1 (Draft)</span>
      </nav>

      {/* 3. Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Edit Growth Plan — v2.1 Draft
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Preview Publish Impact
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={handlePublish}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] transition-colors shadow-sm"
          >
            <span>Request Publish</span>
          </button>
        </div>
      </div>

      {/* 4. Warning Alert Notice */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                  PRICE (INR)
                </label>
                <input
                  type="text"
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
                <input
                  type="text"
                  value={billingCadence}
                  onChange={(e) => {
                    setBillingCadence(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">
                  TRIAL PERIOD (DAYS)
                </label>
                <input
                  type="text"
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
                  EFFECTIVE DATE (ASIA/KOLKATA)
                </label>
                <input
                  type="text"
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
                  type="text"
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
                  type="text"
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
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Included Platform Modules
              </h2>
              <span className="text-xs font-extrabold text-[#15803D] tracking-wider uppercase">
                {selectedCount} SELECTED
              </span>
            </div>

            {/* Modules Checkable List */}
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
                    <span>{mod.name}</span>
                  </div>

                  {mod.isFuture && (
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      FUTURE
                    </span>
                  )}
                </div>
              ))}
            </div>
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                <span className="font-bold">142 Active Organizations</span> are currently assigned
                to this tier. Changes will take effect on next billing cycle (effective{" "}
                <span className="font-mono font-semibold">{effectiveDate}</span>).
              </div>

              <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tier:</span>
                  <span className="font-bold text-slate-800">Growth Plan v2.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Price:</span>
                  <span className="font-bold text-slate-800">₹{price} / Month</span>
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  handlePublish();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534]"
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
