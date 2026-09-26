import React, { useState } from "react";
import {
  Utensils,
  User as UserIcon,
  Wrench,
  Truck,
  ArrowRight,
  Search,
  Download,
} from "lucide-react";

interface PartnerType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  badges: Array<{ label: string; count: number; colorClass: string }>;
}

interface PipelinePartner {
  id: string;
  partnerId: string;
  businessName: string;
  businessType: string;
  steps: Array<{ label: string; variant: "verified" | "pending" | "dark" | "contract" }>;
  operationalHours: string;
  status: "Online Ready" | "Draft Mode";
  actionType: "Configure" | "Onboard";
}

export const DashboardPage: React.FC = () => {
  const [selectedPartnerType, setSelectedPartnerType] = useState<string>("restaurant");
  const [pipelineSearch, setPipelineSearch] = useState<string>("");

  // 4 Partner Types matching screenshot
  const partnerTypes: PartnerType[] = [
    {
      id: "platform-admin",
      name: "Platform Admin Partner",
      description: "Sub-franchise, regional managers, admin roles",
      icon: UserIcon,
      iconColor: "text-slate-600",
      badges: [
        { label: "Total", count: 3, colorClass: "bg-slate-100 text-slate-700" },
        {
          label: "Active",
          count: 3,
          colorClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        },
      ],
    },
    {
      id: "restaurant",
      name: "Restaurant Partner",
      description: "Dine-in establishments, cloud kitchens, QSR",
      icon: Utensils,
      iconColor: "text-[#65D000]",
      badges: [
        { label: "Total", count: 24, colorClass: "bg-slate-100 text-slate-700" },
        {
          label: "Draft",
          count: 3,
          colorClass: "bg-amber-50 text-amber-700 border border-amber-200",
        },
        {
          label: "Active",
          count: 21,
          colorClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        },
      ],
    },
    {
      id: "service",
      name: "Service Partner",
      description: "Maintenance providers, waste management, repairs",
      icon: Wrench,
      iconColor: "text-slate-600",
      badges: [
        { label: "Total", count: 1, colorClass: "bg-slate-100 text-slate-700" },
        {
          label: "Draft",
          count: 1,
          colorClass: "bg-amber-50 text-amber-700 border border-amber-200",
        },
      ],
    },
    {
      id: "logistic",
      name: "Logistic Partner",
      description: "Fleet operators, delivery drivers, transit routes",
      icon: Truck,
      iconColor: "text-slate-600",
      badges: [{ label: "Total", count: 0, colorClass: "bg-slate-100 text-slate-600" }],
    },
  ];

  // Pipeline table data matching screenshot
  const pipelineData: PipelinePartner[] = [
    {
      id: "1",
      partnerId: "ON-90822",
      businessName: "The Royal Spice Kitchen",
      businessType: "Rest. Partner",
      steps: [
        { label: "KYC Verified", variant: "verified" },
        { label: "Menu Set • 45 Items", variant: "dark" },
      ],
      operationalHours: "10:00 AM - 11:30 PM",
      status: "Online Ready",
      actionType: "Configure",
    },
    {
      id: "2",
      partnerId: "ON-76221",
      businessName: "Latur Transit Logistics",
      businessType: "Logistics",
      steps: [{ label: "Documents Pending", variant: "pending" }],
      operationalHours: "24 Hours Fleet",
      status: "Draft Mode",
      actionType: "Onboard",
    },
    {
      id: "3",
      partnerId: "ON-11029",
      businessName: "Eco-Clean Latur Services",
      businessType: "Service Partner",
      steps: [{ label: "Contract Signed", variant: "contract" }],
      operationalHours: "08:00 AM - 08:00 PM",
      status: "Online Ready",
      actionType: "Configure",
    },
  ];

  const filteredPipeline = pipelineData.filter(
    (item) =>
      item.businessName.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
      item.partnerId.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
      item.businessType.toLowerCase().includes(pipelineSearch.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = "Partner ID,Business Name,Type,Hours,Status\n";
    const rows = filteredPipeline
      .map(
        (p) =>
          `"${p.partnerId}","${p.businessName}","${p.businessType}","${p.operationalHours}","${p.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "onboarding_pipeline.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ============================================================== */}
      {/* PAGE HEADER: ONBOARDING SYSTEM BANNER                           */}
      {/* ============================================================== */}
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#65D000]">
          ONBOARDING SYSTEM
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Onboard new partner onto OneLatur
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-3xl leading-relaxed">
          Configure and launch &ldquo;Restaurant Partners&rdquo; easily - set store parameters,
          complete KYC validation, handle contract signing, and trigger system activation.
        </p>
      </div>

      {/* ============================================================== */}
      {/* SELECT PARTNER TYPE CARDS                                      */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            SELECT PARTNER TYPE
          </h2>
          <button
            type="button"
            onClick={() => alert("Partner Requirements & Compliance guidelines modal.")}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#65D000] hover:text-[#52a800] hover:underline cursor-pointer"
          >
            <span>Learn about requirements</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {partnerTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedPartnerType === type.id;

            return (
              <div
                key={type.id}
                onClick={() => setSelectedPartnerType(type.id)}
                className={`relative rounded-2xl bg-white p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-2 border-[#65D000] shadow-md ring-2 ring-[#65D000]/10"
                    : "border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs"
                }`}
              >
                {/* Active Selection Badge on Top Right */}
                {isSelected && (
                  <div className="absolute top-3.5 right-3.5 bg-[#EBF9E5] text-[#3E8800] text-[10px] font-extrabold tracking-wide px-2 py-0.5 rounded-md border border-[#BCE8A2]">
                    ACTIVE SELECTION
                  </div>
                )}

                <div>
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                    <Icon className={`w-5 h-5 ${isSelected ? "text-[#65D000]" : type.iconColor}`} />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{type.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed min-h-[34px]">
                    {type.description}
                  </p>
                </div>

                {/* Metrics Badges Footer */}
                <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                  {type.badges.map((b, idx) => (
                    <span
                      key={idx}
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${b.colorClass}`}
                    >
                      {b.label} {b.count}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* ACTIVE ONBOARDING PIPELINE TABLE                               */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Card Header with Title and Search/Export Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Onboarding Pipeline</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review documentation, check status updates, and approve pending partners.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search partners */}
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={pipelineSearch}
                onChange={(e) => setPipelineSearch(e.target.value)}
                placeholder="Search partners..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-[#65D000] focus:ring-1 focus:ring-[#65D000]/20 transition-all outline-none placeholder:text-slate-400"
              />
            </div>

            {/* Export CSV button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFB] text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="px-6 py-3.5">PARTNER BUSINESS</th>
                <th className="px-6 py-3.5">ONBOARDING STEPS &amp; KYC</th>
                <th className="px-6 py-3.5">OPERATIONAL HOURS</th>
                <th className="px-6 py-3.5">ACTIVATION STATUS</th>
                <th className="px-6 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPipeline.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No partners matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredPipeline.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Partner Business Column */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {row.businessName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {row.businessType} • ID: {row.partnerId}
                      </div>
                    </td>

                    {/* Onboarding Steps & KYC Badges */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {row.steps.map((step, idx) => {
                          if (step.variant === "verified") {
                            return (
                              <span
                                key={idx}
                                className="bg-[#EBF9E5] text-[#3E8800] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#BCE8A2]"
                              >
                                {step.label}
                              </span>
                            );
                          }
                          if (step.variant === "dark") {
                            return (
                              <span
                                key={idx}
                                className="bg-slate-800 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                              >
                                {step.label}
                              </span>
                            );
                          }
                          if (step.variant === "pending") {
                            return (
                              <span
                                key={idx}
                                className="bg-[#FFF8E6] text-[#B7791F] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#FEEBC8]"
                              >
                                {step.label}
                              </span>
                            );
                          }
                          return (
                            <span
                              key={idx}
                              className="bg-[#EBF9E5] text-[#3E8800] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#BCE8A2]"
                            >
                              {step.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Operational Hours */}
                    <td className="px-6 py-4 text-slate-600 font-medium">{row.operationalHours}</td>

                    {/* Activation Status */}
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 font-bold text-xs">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            row.status === "Online Ready" ? "bg-[#4FA800]" : "bg-slate-400"
                          }`}
                        />
                        <span
                          className={
                            row.status === "Online Ready" ? "text-slate-800" : "text-slate-500"
                          }
                        >
                          {row.status}
                        </span>
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="px-6 py-4 text-right">
                      {row.actionType === "Configure" ? (
                        <button
                          type="button"
                          onClick={() => alert(`Configuring ${row.businessName}...`)}
                          className="px-3.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          Configure
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alert(`Launching onboarding for ${row.businessName}...`)}
                          className="px-3.5 py-1 text-xs font-bold text-[#3E8800] bg-[#EBF9E5] hover:bg-[#DEF5CE] border border-[#BCE8A2] rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          Onboard
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
