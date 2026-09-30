import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Loader2,
  Filter,
  Package,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { packApi, CommercialPackItem } from "../api/pack.api";
import { planApi, CommercialPlanItem } from "../api/plan.api";
import { usePermissions } from "../hooks/use-permissions";

export const CommercialPacksPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canCreate = can("feat_commercial_packs", "create_pack");
  const canEdit = can("feat_commercial_packs", "edit_pack");
  const canPublish = can("feat_commercial_packs", "publish_pack");
  const canRetire = can("feat_commercial_packs", "retire_pack");

  const [packs, setPacks] = useState<CommercialPackItem[]>([]);
  const [plans, setPlans] = useState<CommercialPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCompatibility, setSelectedCompatibility] = useState<string>("All");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [packToRetire, setPackToRetire] = useState<CommercialPackItem | null>(null);
  const [isRetiring, setIsRetiring] = useState(false);

  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter plans to ONLY published plans and deduplicate by name
  const publishedPlans = useMemo(() => {
    const map = new Map<string, CommercialPlanItem>();
    plans
      .filter((p) => p.status === "Published")
      .forEach((p) => {
        if (!map.has(p.name)) {
          map.set(p.name, p);
        }
      });
    return Array.from(map.values());
  }, [plans]);

  const fetchPacksAndPlans = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [packsRes, plansRes] = await Promise.all([
        packApi.getAll({
          compatibility: selectedCompatibility !== "All" ? selectedCompatibility : undefined,
        }),
        planApi.getAll().catch(() => ({ message: "OK", plans: [], total: 0 })),
      ]);
      setPacks(packsRes.packs || []);
      setPlans(plansRes.plans || []);
    } catch (err: any) {
      setPacks([]);
      setErrorMessage(err?.message || "Failed to load commercial feature packs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPacksAndPlans();
  }, [selectedCompatibility]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePublish = async (id: string, name: string) => {
    try {
      await packApi.publish(id);
      showToast(`Feature pack '${name}' published successfully.`);
      fetchPacksAndPlans();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to publish feature pack");
    }
  };

  const handleOpenRetireModal = (pack: CommercialPackItem) => {
    setPackToRetire(pack);
  };

  const handleConfirmRetire = async () => {
    if (!packToRetire) return;
    setIsRetiring(true);
    try {
      await packApi.retire(packToRetire.id);
      showToast(`Feature pack '${packToRetire.name}' retired.`);
      setPackToRetire(null);
      fetchPacksAndPlans();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to retire feature pack");
    } finally {
      setIsRetiring(false);
    }
  };

  // Render status badge
  const renderStatusBadge = (status: CommercialPackItem["status"]) => {
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
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  // Format compatible plans display
  const formatCompatiblePlans = (compatiblePlans: string[]) => {
    if (!compatiblePlans || compatiblePlans.length === 0) {
      return "All Commercial Plans";
    }
    return compatiblePlans.join(", ");
  };

  // Format price
  const formatPrice = (price: number, currency: string, cadence: string) => {
    const symbol = currency === "INR" ? "₹" : currency + " ";
    const formattedNum = Number(price).toLocaleString("en-IN");
    return `${symbol}${formattedNum} / ${cadence.toLowerCase()}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-800 text-white px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Master</span>
            <span>/</span>
            <span>Commercials</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Packs</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Commercial Feature Packs
          </h1>
        </div>

        {canCreate && (
          <button
            type="button"
            onClick={() => navigate("/commercials/packs/new")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Feature Pack</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar matching screenshot */}
      <div className="flex items-center gap-3">
        <div ref={filterDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-2 text-xs">
              <div className="font-semibold text-slate-700 px-2 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                <span>Filter by Plan Compatibility</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCompatibility("All");
                  setIsFilterDropdownOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                  selectedCompatibility === "All"
                    ? "bg-[#DEF5CE] text-[#337400] font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Compatible Plans
              </button>
              {publishedPlans.length === 0 ? (
                <div className="px-2 py-2 text-[11px] text-slate-400">
                  No published plans available
                </div>
              ) : (
                publishedPlans.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => {
                      setSelectedCompatibility(pl.name);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors ${
                      selectedCompatibility === pl.name
                        ? "bg-[#DEF5CE] text-[#337400] font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pl.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {selectedCompatibility !== "All" && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs font-medium text-slate-800">
            <span className="text-slate-500">Compatibility:</span>
            <span className="font-semibold">{selectedCompatibility}</span>
            <button
              type="button"
              onClick={() => setSelectedCompatibility("All")}
              className="ml-1 text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
              title="Clear filter"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-[#15803D] animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading commercial feature packs...</p>
        </div>
      ) : packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-xl border border-dashed border-slate-300 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            No Commercial Feature Packs Found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-5">
            Zero static data is loaded. Feature packs allow you to bundle advanced platform
            capabilities (such as Custom SQL reporting or Multi-location sync) as monetizable
            add-ons.
          </p>
          {canCreate && (
            <button
              type="button"
              onClick={() => navigate("/commercials/packs/new")}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Feature Pack</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Pack Name</th>
                  <th className="py-3 px-4">Compatible Plans</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Included Features</th>
                  <th className="py-3 px-4">Price (INR)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Assigned Orgs</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packs.map((pack) => (
                  <tr key={pack.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* PACK NAME & ID */}
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm">{pack.name}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Pack ID: {pack.pack_code}
                      </div>
                    </td>

                    {/* COMPATIBLE PLANS */}
                    <td className="py-4 px-4">
                      <div className="text-slate-800 font-medium max-w-xs">
                        {formatCompatiblePlans(pack.compatible_plans)}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {renderStatusBadge(pack.status)}
                    </td>

                    {/* INCLUDED FEATURES */}
                    <td className="py-4 px-4">
                      <div className="text-slate-900 font-semibold">
                        {pack.included_feature_title || "Standard Capability"}
                      </div>
                      {pack.included_feature_subtitle && (
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {pack.included_feature_subtitle}
                        </div>
                      )}
                    </td>

                    {/* PRICE */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {formatPrice(pack.price, pack.currency, pack.cadence)}
                      </div>
                    </td>

                    {/* ASSIGNED ORGS */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div
                        className={`font-semibold ${
                          pack.assigned_count > 0 ? "text-[#15803D] font-bold" : "text-slate-600"
                        }`}
                      >
                        {pack.assigned_count} Orgs
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 px-5 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-3">
                        {pack.status === "Published" ? (
                          <>
                            {canEdit && (
                              <Link
                                to={`/commercials/packs/${pack.id}/edit`}
                                className="font-medium text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
                              >
                                Edit Pack
                              </Link>
                            )}
                            {canRetire && (
                              <button
                                type="button"
                                onClick={() => handleOpenRetireModal(pack)}
                                className="text-slate-500 hover:text-rose-600 font-medium hover:underline cursor-pointer"
                              >
                                Retire
                              </button>
                            )}
                          </>
                        ) : pack.status === "Draft" ? (
                          <>
                            {canEdit && (
                              <Link
                                to={`/commercials/packs/${pack.id}/edit`}
                                className="font-bold text-[#15803D] hover:underline cursor-pointer"
                              >
                                Edit Draft
                              </Link>
                            )}
                            {canPublish && (
                              <button
                                type="button"
                                onClick={() => handlePublish(pack.id, pack.name)}
                                className="text-slate-700 hover:text-slate-900 font-medium hover:underline cursor-pointer"
                              >
                                Publish
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {canEdit && (
                              <Link
                                to={`/commercials/packs/${pack.id}/edit`}
                                className="font-medium text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                              >
                                Edit
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Retire Feature Pack Confirmation Modal */}
      {packToRetire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Retire Feature Pack</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update lifecycle status to archive pack from new adoptions.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Pack Name:</span>
                <span className="font-bold text-slate-900">{packToRetire.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Pack Code:</span>
                <span className="font-mono text-slate-800">{packToRetire.pack_code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Current Price:</span>
                <span className="font-semibold text-slate-800">
                  {formatPrice(packToRetire.price, packToRetire.currency, packToRetire.cadence)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Assigned Organizations:</span>
                <span className="font-semibold text-slate-800">
                  {packToRetire.assigned_count} Orgs
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to retire{" "}
              <strong className="text-slate-900 font-semibold">
                &quot;{packToRetire.name}&quot;
              </strong>
              ? Existing organizations will retain their pack access, but new subscriptions will be
              restricted from adopting it.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPackToRetire(null)}
                disabled={isRetiring}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRetiring}
                onClick={handleConfirmRetire}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isRetiring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isRetiring ? "Retiring Pack..." : "Confirm & Retire Pack"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
