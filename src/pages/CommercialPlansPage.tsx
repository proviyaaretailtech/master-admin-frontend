import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Filter, ChevronDown, CheckCircle2 } from "lucide-react";

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
  locationsLimit: string;
  usersLimit: string;
  assignmentsCount: number;
  assignmentsLabel: string;
  lastUpdatedTime: string;
  lastUpdatedBy: string;
}

const INITIAL_PLANS: PlanItem[] = [
  {
    id: "starter-plan-v1",
    name: "Starter Plan",
    version: "Version 1.0 (Draft)",
    versionType: "Draft",
    price: "₹1,999",
    cadence: "/ mo",
    taxNote: "+18% GST Applicable",
    status: "Draft",
    includedModules: "Organization, Access,",
    includedModulesNote: "+3 Core Modules",
    locationsLimit: "1 Location Allowed",
    usersLimit: "3 Core Admin Users",
    assignmentsCount: 0,
    assignmentsLabel: "0 Orgs",
    lastUpdatedTime: "10 mins ago",
    lastUpdatedBy: "by admin@proviyaa",
  },
  {
    id: "growth-plan-v2.1",
    name: "Growth Plan",
    version: "Version 2.1 (Active)",
    versionType: "Active",
    price: "₹4,999",
    cadence: "/ mo",
    taxNote: "+18% GST Applicable",
    status: "Published",
    includedModules: "Inventory, Commerce,",
    includedModulesNote: "+6 Core Modules",
    locationsLimit: "3 Locations Allowed",
    usersLimit: "10 Core Admin Users",
    assignmentsCount: 142,
    assignmentsLabel: "142 Active Orgs",
    lastUpdatedTime: "Jan 12, 2026",
    lastUpdatedBy: "by product_ops",
  },
  {
    id: "enterprise-suite-v1.4",
    name: "Enterprise Suite",
    version: "Version 1.4 (Custom)",
    versionType: "Custom",
    price: "Custom Pricing",
    cadence: "",
    taxNote: "Contract Bilateral",
    status: "Published",
    includedModules: "All Platform Modules",
    includedModulesNote: "Architectural Ready",
    locationsLimit: "Unlimited Locations",
    usersLimit: "Unlimited Admins",
    assignmentsCount: 48,
    assignmentsLabel: "48 Enterprise Orgs",
    lastUpdatedTime: "Dec 20, 2025",
    lastUpdatedBy: "by master_billing",
  },
  {
    id: "legacy-basic-v1.0",
    name: "Legacy Basic",
    version: "Version 1.0 (Legacy)",
    versionType: "Legacy",
    price: "₹999",
    cadence: "/ mo",
    taxNote: "Grandfathered",
    status: "Retired",
    includedModules: "Organization, Access",
    includedModulesNote: "Minimal Core",
    locationsLimit: "1 Location Max",
    usersLimit: "1 Admin User",
    assignmentsCount: 12,
    assignmentsLabel: "12 Active Orgs",
    lastUpdatedTime: "Oct 05, 2024",
    lastUpdatedBy: "by migration_agent",
  },
];

export const CommercialPlansPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanItem[]>(INITIAL_PLANS);
  const [statusFilter, setStatusFilter] = useState<
    "All Active" | "All" | "Draft" | "Published" | "Retired"
  >("All Active");
  const [currencyFilter, setCurrencyFilter] = useState<"INR (₹)" | "USD ($)">("INR (₹)");
  const [showRetiredView, setShowRetiredView] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const handleDuplicate = (plan: PlanItem) => {
    const duplicated: PlanItem = {
      ...plan,
      id: `${plan.id}-copy-${Date.now()}`,
      name: `${plan.name} (Copy)`,
      version: "Version 1.0 (Draft)",
      status: "Draft",
      assignmentsCount: 0,
      assignmentsLabel: "0 Orgs",
      lastUpdatedTime: "Just now",
      lastUpdatedBy: "by you",
    };
    setPlans([duplicated, ...plans]);
    setToastMessage(`Duplicated "${plan.name}" into new draft.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRetire = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, status: "Retired", lastUpdatedTime: "Just now", lastUpdatedBy: "by you" }
          : p
      )
    );
    setToastMessage("Plan status updated to Retired.");
    setTimeout(() => setToastMessage(null), 3000);
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

      {/* 1. Header Area with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            SaaS Platform Plans
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setShowRetiredView(!showRetiredView)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors shadow-2xs ${
              showRetiredView
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {showRetiredView ? "View Active Plans" : "View Retired Plans"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/commercials/plans/growth-plan-v2.1/edit")}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Compare Plans
          </button>

          <button
            type="button"
            onClick={() => navigate("/commercials/plans/new")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] transition-colors shadow-sm"
          >
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* 2. Filters Row */}
      <div className="flex items-center gap-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold px-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>

        {/* Status Filter Pill */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
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
            onChange={(e) => setCurrencyFilter(e.target.value as any)}
            className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="INR (₹)">Currency: INR (₹)</option>
            <option value="USD ($)">Currency: USD ($)</option>
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 3. Plans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
                <th className="py-3.5 px-5 text-right">ACTIONS</th>
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
                  <td className="py-4 px-4 whitespace-nowrap">{renderStatusBadge(plan.status)}</td>

                  {/* Included Modules */}
                  <td className="py-4 px-4">
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
                  <td className="py-4 px-5 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-3">
                      {plan.status === "Draft" ? (
                        <>
                          <Link
                            to={`/commercials/plans/${plan.id}/edit`}
                            className="font-bold text-[#15803D] hover:underline"
                          >
                            Edit Draft
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(plan)}
                            className="text-slate-600 hover:text-slate-900 font-medium hover:underline"
                          >
                            Duplicate
                          </button>
                        </>
                      ) : plan.status === "Published" ? (
                        <>
                          {plan.id === "growth-plan-v2.1" ? (
                            <>
                              <Link
                                to={`/commercials/plans/${plan.id}/edit`}
                                className="font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                              >
                                Compare
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleRetire(plan.id)}
                                className="text-slate-600 hover:text-rose-600 font-medium hover:underline"
                              >
                                Retire
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDuplicate(plan)}
                                className="font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                              >
                                Duplicate
                              </button>
                              <Link
                                to="/dashboard"
                                className="text-slate-600 hover:text-slate-900 font-medium hover:underline"
                              >
                                Assignments
                              </Link>
                            </>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setToastMessage(`Displaying audit history for ${plan.name}`)
                          }
                          className="font-medium text-slate-600 hover:text-slate-900 hover:underline"
                        >
                          View History
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. State Galleries & Platform Status Callouts Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          STATE GALLERIES & PLATFORM STATUS CALLOUTS
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: API status / Validation Pending */}
          <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] rounded-xl p-3 text-xs leading-relaxed flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-[#B45309] tracking-wider mb-1">
              API status / Validation Pending
            </div>
            <div>Pending server confirmation for plan retirement on "Legacy Basic"...</div>
          </div>

          {/* Card 2: Validation Error State */}
          <div className="bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] rounded-xl p-3 text-xs leading-relaxed flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-[#E11D48] tracking-wider mb-1">
              Validation Error State
            </div>
            <div>Error: Custom plan "Enterprise v1.4" lacks mandatory Commercials module.</div>
          </div>

          {/* Card 3: Publish Queue Confirmation */}
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-xl p-3 text-xs leading-relaxed flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-[#15803D] tracking-wider mb-1">
              Publish Queue Confirmation
            </div>
            <div>Success: Growth Plan v2.1 publish preview generated successfully.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CommercialPlansPage;
