import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  Wrench,
  Truck,
  Download,
  Search,
  ChevronDown,
  X,
  CheckCircle2,
  Trash2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { organizationApi } from "../api";
import { Organization, Pagination } from "../@types";
import { usePermissions } from "../hooks/use-permissions";

export const Organization360Page: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canReviewPartner =
    can("feat_partner_review", "approve_partner") ||
    can("feat_partner_review", "reject_partner") ||
    can("feat_partner_review", "mark_under_review");


  // Organizations from Supabase Backend DB
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [activeStatusTab, setActiveStatusTab] = useState<string>("All");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>("All Types");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // KPI Summary Counts (computed directly from database)
  const [kpiCounts, setKpiCounts] = useState({
    restaurants: 0,
    services: 0,
    logistics: 0,
  });

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);

  // New Organization Form
  const [newOrgForm, setNewOrgForm] = useState({
    business_name: "",
    domain: "Restaurant",
    email: "",
    phone_number: "",
    status: "Active",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Feedback notifications
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // 1. Fetch KPI Counts across entire Database
  const fetchKpiCounts = useCallback(async () => {
    try {
      const [restRes, servRes, logRes] = await Promise.all([
        organizationApi.getAll({ domain: "Restaurant", limit: 1 }),
        organizationApi.getAll({ domain: "Service", limit: 1 }),
        organizationApi.getAll({ domain: "Logistics", limit: 1 }),
      ]);
      setKpiCounts({
        restaurants: restRes.pagination?.total || 0,
        services: servRes.pagination?.total || 0,
        logistics: logRes.pagination?.total || 0,
      });
    } catch (err) {
      console.error("Failed to fetch organization KPI counts:", err);
    }
  }, []);

  // 2. Fetch Paginated Organizations with Filters from Backend API
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await organizationApi.getAll({
        page: currentPage,
        limit: 5,
        search: searchQuery,
        status: activeStatusTab,
        domain: selectedDomainFilter,
      });

      setOrganizations(response.organizations || []);
      setPagination(
        response.pagination || {
          total: response.organizations?.length || 0,
          page: currentPage,
          limit: 5,
          totalPages: Math.max(1, Math.ceil((response.organizations?.length || 0) / 5)),
        }
      );
    } catch (err: any) {
      console.error("Failed to load organizations from database:", err);
      showNotification(err.message || "Failed to load organizations", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, activeStatusTab, selectedDomainFilter]);

  // Debounced load when search or filter controls change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrganizations();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrganizations]);

  // Initial KPI load
  useEffect(() => {
    fetchKpiCounts();
  }, [fetchKpiCounts]);

  // 3. Create A New Organisation Handler
  const handleOpenAddModal = () => {
    setNewOrgForm({
      business_name: "",
      domain: "Restaurant",
      email: "",
      phone_number: "",
      status: "Active",
    });
    setFormError(null);
    setAddModalOpen(true);
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      const response = await organizationApi.create({
        business_name: newOrgForm.business_name.trim(),
        domain: newOrgForm.domain.trim(),
        email: newOrgForm.email.trim().toLowerCase(),
        phone_number: newOrgForm.phone_number.trim(),
        status: newOrgForm.status,
      });

      showNotification(`Created organization: "${response.organization.business_name}"`);
      setAddModalOpen(false);
      fetchOrganizations();
      fetchKpiCounts();
    } catch (err: any) {
      setFormError(err.message || "Failed to create organization");
    } finally {
      setFormSubmitting(false);
    }
  };

  // 4. Delete Organisation Handler
  const handleOpenDeleteModal = (org: Organization) => {
    setOrganizationToDelete(org);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!organizationToDelete) return;

    try {
      await organizationApi.delete(organizationToDelete.id);
      showNotification(`Deleted organization: "${organizationToDelete.business_name}"`, "info");
      setDeleteModalOpen(false);
      setOrganizationToDelete(null);
      fetchOrganizations();
      fetchKpiCounts();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // 5. Export to CSV Handler
  const handleExportCSV = () => {
    if (organizations.length === 0) {
      showNotification("No organization records available to export", "info");
      return;
    }
    const headers = [
      "ID",
      "Business Name",
      "Domain",
      "Status",
      "Email",
      "Phone Number",
      "Created At",
    ];
    const rows = organizations.map((o) => [
      o.id,
      `"${o.business_name.replace(/"/g, '""')}"`,
      o.domain,
      o.status,
      o.email,
      o.phone_number,
      o.created_at,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `organizations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Exported ${organizations.length} organization records to CSV.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            notification.type === "error" ? "bg-rose-900 text-white" : "bg-slate-900 text-white"
          }`}
        >
          {notification.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#65D000]" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. HEADER SECTION (Matches Screenshot: Partner Applications)    */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Partner Applications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage and inspect partner registrations, onboarding progress, and credentials
          </p>
        </div>

        {/* Action Buttons: Export & Add Partner */}
        <div className="flex items-center gap-2.5">
          {can("feat_org_360", "export_org_csv") && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
              title="Export records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          )}

          <button
            onClick={fetchOrganizations}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Add Partner button without plus icon */}
          {can("feat_org_360", "create_org") && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              Add Partner
            </button>
          )}
        </div>
      </div>


      {/* ============================================================== */}
      {/* 2. SUMMARY KPI STAT CARDS (Connected to Supabase DB)           */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Restaurants */}
        <div
          onClick={() => {
            setSelectedDomainFilter(
              selectedDomainFilter === "Restaurant" ? "All Types" : "Restaurant"
            );
            setCurrentPage(1);
          }}
          className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-2xs cursor-pointer transition-all ${
            selectedDomainFilter === "Restaurant"
              ? "border-[#65D000] ring-2 ring-[#65D000]/20"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-[#22C55E] shrink-0">
            <UtensilsCrossed className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {kpiCounts.restaurants}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Restaurants</div>
          </div>
        </div>

        {/* Card 2: Service Providers */}
        <div
          onClick={() => {
            setSelectedDomainFilter(selectedDomainFilter === "Service" ? "All Types" : "Service");
            setCurrentPage(1);
          }}
          className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-2xs cursor-pointer transition-all ${
            selectedDomainFilter === "Service"
              ? "border-[#A855F7] ring-2 ring-[#A855F7]/20"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#FAF5FF] flex items-center justify-center text-[#A855F7] shrink-0">
            <Wrench className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {kpiCounts.services}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Service Providers</div>
          </div>
        </div>

        {/* Card 3: Logistics Fleet */}
        <div
          onClick={() => {
            setSelectedDomainFilter(
              selectedDomainFilter === "Logistics" ? "All Types" : "Logistics"
            );
            setCurrentPage(1);
          }}
          className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-2xs cursor-pointer transition-all ${
            selectedDomainFilter === "Logistics"
              ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/20"
              : "border-slate-200/80 hover:border-slate-300"
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6] shrink-0">
            <Truck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {kpiCounts.logistics}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">Logistics Fleet</div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. FILTER BAR (Status Tabs + Search + Domain Dropdown)         */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Left: Status Filter Segment Tabs (All, Pending, Approved, Rejected) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(["All", "Pending", "Approved", "Rejected"] as const).map((tab) => {
            const isActive = activeStatusTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveStatusTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/90 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Right: Search Input & Domain Type Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200/90 bg-white placeholder:text-slate-400 text-slate-800 outline-none focus:border-[#65D000] focus:ring-1 focus:ring-[#65D000]/20 shadow-2xs transition-all"
            />
          </div>

          {/* Domain Type dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedDomainFilter}
              onChange={(e) => {
                setSelectedDomainFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-slate-200/90 rounded-xl px-3.5 py-1.5 pr-8 text-xs text-slate-700 font-semibold focus:border-[#65D000] outline-none shadow-2xs cursor-pointer"
            >
              <option value="All Types">All Types</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Logistics">Logistics</option>
              <option value="Service">Service</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. ORGANIZATIONS LIST (Matches UI Layout & Design)             */}
      {/* ============================================================== */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
            <div className="flex items-center justify-center gap-2.5 text-slate-600">
              <RefreshCw className="w-5 h-5 animate-spin text-[#65D000]" />
              <span className="text-xs font-semibold">Loading organizations from database...</span>
            </div>
          </div>
        ) : organizations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No organizations found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No organization records match your active status tab, domain filter, or search term.
            </p>
            <button
              onClick={() => {
                setActiveStatusTab("All");
                setSelectedDomainFilter("All Types");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          organizations.map((item) => {
            // Type badge styling
            let badgeStyle = "bg-[#EBF9E5] text-[#3E8800] border-[#DEF5CE]";
            if (item.domain?.toLowerCase().includes("logistic")) {
              badgeStyle = "bg-blue-50 text-blue-600 border-blue-100";
            } else if (item.domain?.toLowerCase().includes("service")) {
              badgeStyle = "bg-purple-50 text-purple-600 border-purple-100";
            }

            // Status badge styling
            let statusBadge = "bg-slate-100 text-slate-600 border-slate-200/50";
            const stLower = (item.status || "").toLowerCase();
            let progressPercentage = 0;
            let stepsCompleted = 0;

            if (stLower === "approved" || stLower === "active") {
              statusBadge = "bg-emerald-50 text-emerald-600 border-emerald-200/60";
              progressPercentage = 100;
              stepsCompleted = 9;
            } else if (stLower === "pending") {
              statusBadge = "bg-amber-50 text-amber-600 border-amber-200/60";
              progressPercentage = 45;
              stepsCompleted = 4;
            } else if (stLower === "rejected" || stLower === "suspended") {
              statusBadge = "bg-rose-50 text-rose-600 border-rose-200/60";
              progressPercentage = 33;
              stepsCompleted = 3;
            } else {
              // Draft / Inactive
              progressPercentage = 0;
              stepsCompleted = 0;
            }

            const isFull = progressPercentage === 100;
            const progressColor = isFull ? "bg-[#10B981]" : "bg-[#3B82F6]";

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 grid grid-cols-1 md:grid-cols-[minmax(200px,1fr)_240px_110px_195px] items-center gap-4 lg:gap-6 shadow-2xs hover:border-slate-300 transition-all"
              >
                {/* 1. Left Column: Business Name, Domain Badge, Contact Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight truncate">
                      {item.business_name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeStyle} shrink-0`}
                    >
                      {item.domain}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap truncate">
                    <span>{item.email}</span>
                    <span className="text-slate-300">•</span>
                    <span>{item.phone_number}</span>
                  </div>
                </div>

                {/* 2. Middle Column: Onboarding Completion Progress Bar (Fixed 240px on desktop) */}
                <div className="w-full md:w-[240px]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Onboarding Completion</span>
                    <span className="font-bold text-slate-900">{progressPercentage}%</span>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1 font-medium">
                    {stepsCompleted}/9 steps completed
                  </div>
                </div>

                {/* 3. Status Column: Fixed 110px width & centered (guarantees Suspended never misaligns adjacent sections) */}
                <div className="w-full md:w-[110px] flex items-center md:justify-center">
                  <span
                    className={`inline-flex items-center justify-center w-24 py-1 rounded-full text-xs font-semibold border text-center ${statusBadge}`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* 4. Action Buttons Column: right-aligned */}
                <div className="w-full md:w-auto flex items-center md:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/organizations/${item.id}`)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    View
                  </button>

                  {canReviewPartner && (
                    <button
                      type="button"
                      onClick={() => navigate(`/organizations/${item.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                    >
                      Review
                    </button>
                  )}

                  {can("feat_partner_review", "delete_partner") && (
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(item)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. FOOTER PAGINATION                                           */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-400 font-medium">
          Showing {organizations.length} of {pagination.total} partner applications
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 shadow-2xs disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage >= pagination.totalPages || loading}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-lg hover:bg-slate-50 shadow-2xs disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ADD NEW ORGANISATION (Connected to POST /api/organizations) */}
      {/* ============================================================== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header: Title and subtitle without plus symbol box */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add New Partner Application</h3>
                <p className="text-[11px] text-slate-400">
                  Register and initiate onboarding for a partner entity
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrganization} className="p-4 space-y-3">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business / Partner Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spice Route Kitchen Corp"
                  value={newOrgForm.business_name}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, business_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#65D000] focus:ring-1 focus:ring-[#65D000]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Domain Type</label>
                  <select
                    value={newOrgForm.domain}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, domain: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#65D000] bg-white cursor-pointer"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Service">Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={newOrgForm.status}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#65D000] bg-white cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Draft">Draft</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. contact@spiceroute.com"
                  value={newOrgForm.email}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#65D000] focus:ring-1 focus:ring-[#65D000]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+1 (555) 082-1920"
                  value={newOrgForm.phone_number}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, phone_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#65D000] focus:ring-1 focus:ring-[#65D000]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? "Creating..." : "Create Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: DELETE CONFIRMATION (Connected to DELETE /api/organizations/:id) */}
      {/* ============================================================== */}
      {deleteModalOpen && organizationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Organization</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-800 font-bold">
                {organizationToDelete.business_name}
              </strong>{" "}
              from the database? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organization360Page;
