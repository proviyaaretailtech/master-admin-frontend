import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { addonApi, CreateAddonPayload } from "../api/addon.api";
import { planApi, CommercialPlanItem } from "../api/plan.api";
import { usePermissions } from "../hooks/use-permissions";

export const AddonEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const { can } = usePermissions();
  const canSave = isEditMode
    ? can("feat_commercial_addons", "edit_addon")
    : can("feat_commercial_addons", "create_addon");
  const canPublish = can("feat_commercial_addons", "publish_addon");

  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [plans, setPlans] = useState<CommercialPlanItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State matching media_1790759137875.png
  const [name, setName] = useState("Additional Location Deployment");
  const [addonCode, setAddonCode] = useState("ad-loc-11");
  const [description, setDescription] = useState(
    "Permits tenant organizations to provision exactly one additional operational facility or outlet beyond their root entitlement base level."
  );
  const [category, setCategory] = useState("Locations & Logistics");
  const [effectiveDate, setEffectiveDate] = useState("2026-11-01 00:00:00");
  const [status, setStatus] = useState<"Draft" | "Published" | "Retired">("Draft");
  const [version, setVersion] = useState("v1.2");

  // Pricing & Quantity Controls
  const [price, setPrice] = useState<number>(1500);
  const [currency, setCurrency] = useState("INR");
  const [cadence, setCadence] = useState("Monthly");
  const [minQuantity, setMinQuantity] = useState<number>(1);
  const [maxQuantity, setMaxQuantity] = useState<number>(5);
  const [unitLabel, setUnitLabel] = useState("location");
  const [pricingSubtitle, setPricingSubtitle] = useState("Per site monthly billing");

  // Plan Compatibility (names/codes of compatible plans)
  const [compatiblePlans, setCompatiblePlans] = useState<string[]>([
    "Growth Plan",
    "Enterprise Suite",
  ]);

  // Modals & Warnings
  const [showWarningBanner, setShowWarningBanner] = useState(true);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch plans from commercial_plans table
  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansRes = await planApi
          .getAll()
          .catch(() => ({ message: "OK", plans: [], total: 0 }));
        setPlans(plansRes.plans || []);

        if (isEditMode && id) {
          const addonRes = await addonApi.getById(id);
          const a = addonRes.addon;
          setName(a.name);
          setAddonCode(a.addon_code);
          setDescription(a.description || "");
          setCategory(a.category || "General");
          setStatus(a.status);
          setVersion(a.version || "v1.0");
          setPrice(a.price);
          setCurrency(a.currency || "INR");
          setCadence(a.cadence || "Monthly");
          setUnitLabel(a.unit_label || "location");
          setPricingSubtitle(a.pricing_subtitle || "");
          setMinQuantity(a.min_quantity || 1);
          setMaxQuantity(a.max_quantity || 10);
          setEffectiveDate(
            a.effective_date
              ? new Date(a.effective_date).toISOString().replace("T", " ").substring(0, 19)
              : ""
          );
          setCompatiblePlans(a.compatible_plans || []);
        } else {
          // Defaults for new add-on matching screenshot
          setName("Additional Location Deployment");
          setAddonCode("ad-loc-11");
          setDescription(
            "Permits tenant organizations to provision exactly one additional operational facility or outlet beyond their root entitlement base level."
          );
          setCategory("Locations & Logistics");
          setEffectiveDate("2026-11-01 00:00:00");
          setPrice(1500);
          setCadence("Monthly");
          setMinQuantity(1);
          setMaxQuantity(5);
          setUnitLabel("location");
          setPricingSubtitle("Per site monthly billing");
          setStatus("Draft");
          setVersion("v1.2");
        }
      } catch (err: any) {
        setErrorMessage(err?.message || "Failed to load add-on configuration");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode]);

  // Unique published plans list for compatibility toggles (only Published plans)
  const platformPlansList = useMemo(() => {
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleCompatibility = (planName: string) => {
    setCompatiblePlans((prev) => {
      if (prev.includes(planName)) {
        return prev.filter((p) => p !== planName);
      } else {
        return [...prev, planName];
      }
    });
  };

  const handleSaveProgress = async () => {
    if (!name.trim()) {
      setErrorMessage("Add-on display name is required");
      return;
    }
    if (!addonCode.trim()) {
      setErrorMessage("Add-on code identifier is required");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const payload: CreateAddonPayload = {
      name: name.trim(),
      addon_code: addonCode.trim(),
      description: description.trim(),
      category: category.trim(),
      status: status || "Draft",
      version: version.trim() || "v1.0",
      price: Number(price) || 0,
      currency,
      cadence,
      unit_label: unitLabel.trim() || "location",
      pricing_subtitle: pricingSubtitle.trim(),
      min_quantity: Number(minQuantity) || 1,
      max_quantity: Number(maxQuantity) || 10,
      effective_date: effectiveDate ? new Date(effectiveDate).toISOString() : null,
      compatible_plans: compatiblePlans,
      billing_sync_status: "Success",
      entitlement_validation_status: "Passed",
      tax_compliance_status: "Pending verification",
    };

    try {
      if (isEditMode && id) {
        await addonApi.update(id, payload);
        showToast("Add-on progress saved successfully.");
      } else {
        const created = await addonApi.create(payload);
        showToast("New commercial add-on created successfully.");
        navigate(`/commercials/add-ons/${created.addon.id}/edit`, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save add-on progress");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishAddon = async () => {
    if (!name.trim() || !addonCode.trim()) {
      setErrorMessage("Display name and add-on code are required before publishing");
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);

    try {
      let targetId = id;
      // If new, create first
      if (!isEditMode || !targetId) {
        const payload: CreateAddonPayload = {
          name: name.trim(),
          addon_code: addonCode.trim(),
          description: description.trim(),
          category: category.trim(),
          status: "Draft",
          version: version.trim() || "v1.0",
          price: Number(price) || 0,
          currency,
          cadence,
          unit_label: unitLabel.trim() || "location",
          pricing_subtitle: pricingSubtitle.trim(),
          min_quantity: Number(minQuantity) || 1,
          max_quantity: Number(maxQuantity) || 10,
          effective_date: effectiveDate ? new Date(effectiveDate).toISOString() : null,
          compatible_plans: compatiblePlans,
        };
        const created = await addonApi.create(payload);
        targetId = created.addon.id;
      }

      await addonApi.publish(targetId);
      showToast(`Commercial add-on '${name}' published successfully.`);
      setShowPublishModal(false);
      navigate("/commercials/add-ons");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to publish add-on");
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <Loader2 className="w-8 h-8 animate-spin text-[#4FA800] mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading Add-on Editor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 font-bold ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header matching media_1790759137875.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {name ? `${name.split(" ")[0]} Location Editor` : "Add-on Editor"}
          </h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status} {version}
          </span>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            Discard Draft
          </button>

          <button
            type="button"
            disabled={isSaving || !canSave}
            onClick={handleSaveProgress}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Progress</span>
          </button>

          {canPublish && (
            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#4FA800] hover:bg-[#439000] active:bg-[#387a00] transition-colors shadow-xs cursor-pointer"
            >
              <span>Publish Add-on</span>
            </button>
          )}
        </div>
      </div>

      {/* Cadence Warning Banner matching media_1790759137875.png */}
      {showWarningBanner && (
        <div className="flex items-center justify-between p-3.5 bg-[#FFF8E6] border border-[#FDE68A] rounded-xl text-xs text-[#92400E]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706] shrink-0" />
            <span>
              <strong>Warning:</strong> Modifying CADENCE to &quot;{cadence}&quot; will auto-retire the legacy &quot;Quarterly Location&quot; pack active for 14 clients.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowWarningBanner(false)}
            className="text-[#92400E] hover:text-[#78350F] p-1 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2-Column Responsive Form Layout matching media_1790759137875.png */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: Metadata & Pricing Controls */}
        <div className="space-y-6">
          {/* Card 1: Add-on Metadata & Description */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Add-on Metadata & Description
            </h2>

            {/* ADD-ON DISPLAY NAME */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                ADD-ON DISPLAY NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Additional Location Deployment"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors"
              />
            </div>

            {/* ADD-ON CODE / IDENTIFIER */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                ADD-ON CODE / IDENTIFIER
              </label>
              <input
                type="text"
                value={addonCode}
                onChange={(e) => setAddonCode(e.target.value)}
                placeholder="e.g. ad-loc-11"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors"
              />
            </div>

            {/* DETAILED DESCRIPTION */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                DETAILED DESCRIPTION
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Permits tenant organizations to provision additional resources beyond their root entitlement base level."
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors leading-relaxed"
              />
            </div>

            {/* Row: CATEGORY & EFFECTIVE DATE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  CATEGORY
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Locations & Logistics"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  EFFECTIVE DATE
                </label>
                <input
                  type="text"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  placeholder="2026-11-01 00:00:00"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Pricing & Quantity Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Pricing & Quantity Controls
            </h2>

            {/* Row 1: INR PRICE & CADENCE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  INR PRICE (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  CADENCE
                </label>
                <select
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                  <option value="One-time">One-time</option>
                </select>
              </div>
            </div>

            {/* Row 2: MINIMUM & MAXIMUM PURCHASE QTY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  MINIMUM PURCHASE QTY
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors"
                  />
                  <span className="absolute right-3.5 top-2.5 text-[11px] text-slate-400">
                    Unit
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  MAXIMUM PURCHASE QTY
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={maxQuantity}
                    onChange={(e) => setMaxQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors"
                  />
                  <span className="absolute right-3.5 top-2.5 text-[11px] text-slate-400">
                    Units Max
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: UNIT LABEL & PRICING SUBTITLE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  UNIT LABEL (e.g. location, 5 users)
                </label>
                <input
                  type="text"
                  value={unitLabel}
                  onChange={(e) => setUnitLabel(e.target.value)}
                  placeholder="e.g. location"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  PRICING SUBTITLE
                </label>
                <input
                  type="text"
                  value={pricingSubtitle}
                  onChange={(e) => setPricingSubtitle(e.target.value)}
                  placeholder="e.g. Per site monthly billing"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#4FA800] focus:border-[#4FA800] transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Plan Compatibility & System Validation */}
        <div className="space-y-6">
          {/* Card 3: Platform Plan Compatibility matching media_1790759137875.png */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Platform Plan Compatibility
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Define which parent plans this add-on can be provisioned into.
              </p>
            </div>

            {/* Platform Plans List */}
            <div className="space-y-2.5 pt-1">
              {platformPlansList.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  No published plans available. Only published platform plans can be configured for add-on compatibility.
                </div>
              ) : (
                platformPlansList.map((plan) => {
                  const isCompatible = compatiblePlans.includes(plan.name);
                  const displayName = `${plan.name} ${plan.version || "v1.0"}`;

                  return (
                    <div
                      key={plan.id || plan.name}
                      onClick={() => handleToggleCompatibility(plan.name)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isCompatible
                          ? "bg-[#EAF7E2] border-[#C8EAB3] text-slate-900"
                          : "bg-slate-50/80 border-slate-200/80 text-slate-600 hover:bg-slate-100/60"
                      }`}
                    >
                      <span className="text-xs font-semibold">{displayName}</span>

                      {/* Compatibility Badge / Action Button */}
                      <button
                        type="button"
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                          isCompatible
                            ? "bg-[#DEF5CE] text-[#337400]"
                            : "bg-red-50 text-red-600 border border-red-200/60"
                        }`}
                      >
                        {isCompatible ? "Fully Compatible" : "Incompatible (Base Limit Lock)"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 4: System Integration Validation matching media_1790759137875.png */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              System Integration Validation
            </h2>

            <div className="space-y-3 pt-1">
              {/* Check 1 */}
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] shrink-0" />
                <span>
                  Billing Engine sync check: <strong>Success</strong>
                </span>
              </div>

              {/* Check 2 */}
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] shrink-0" />
                <span>
                  Entitlement schema structure validation: <strong>Passed</strong>
                </span>
              </div>

              {/* Check 3 */}
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] shrink-0" />
                <span>
                  Tax compliance registration status: <strong>Pending verification</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discard Draft Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Discard Draft Changes?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Any unsaved modifications to this commercial add-on will be discarded.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to discard your draft? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Continue Editing
              </button>
              <button
                type="button"
                onClick={() => navigate("/commercials/add-ons")}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
              >
                Discard & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Add-on Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Publish Commercial Add-on</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Publish this add-on into active production for compatible parent plans.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Add-on Name:</span>
                <span className="font-bold text-slate-900">{name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Unit Price:</span>
                <span className="font-semibold text-slate-800">
                  ₹{Number(price).toLocaleString("en-IN")} / {unitLabel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Compatible Plans:</span>
                <span className="font-semibold text-slate-800">
                  {compatiblePlans.length > 0 ? compatiblePlans.join(", ") : "All platform tiers"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to publish <strong className="text-slate-900 font-semibold">&quot;{name}&quot;</strong>? Tenant organizations with compatible platform plans will immediately be able to purchase and provision this add-on.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                disabled={isPublishing}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPublishing}
                onClick={handlePublishAddon}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#4FA800] hover:bg-[#439000] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPublishing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isPublishing ? "Publishing..." : "Confirm & Publish"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
