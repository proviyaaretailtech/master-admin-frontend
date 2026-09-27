import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trash2,
  X,
  Building2,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import { organizationApi } from "../api/organization.api";
import { locationApi } from "../api/location.api";
import {
  LocationItem as ApiLocationItem,
  CreateLocationPayload,
  UpdateLocationPayload,
} from "../@types";
import { formatLastSync } from "../lib/date-utils";
import { generateLocationCode } from "../lib/location-utils";
import { usePermissions } from "../hooks/use-permissions";

export interface PartnerDetails {

  id: string;
  business_name: string;
  domain: string;
  status: string;
  email: string;
  phone_number: string;
  created_at?: string;
}

export const DEFAULT_PARTNER: PartnerDetails = {
  id: "PRT-2048",
  business_name: "Proviyaa Global",
  domain: "Store",
  status: "Draft",
  email: "shreyjagga.pg@gmail.com",
  phone_number: "8668320699",
};

interface LocationItem {
  id: string;
  org_id?: string;
  name: string;
  area: string;
  code: string;
  type: string;
  status: "Active" | "Pending" | "Inactive" | "Draft";
  timeZone: string;
  currency: string;
  lastSync: string;
  last_sync?: string;
}

const nowMs = Date.now();
const INITIAL_LOCATIONS: LocationItem[] = [
  {
    id: "loc-1",
    name: "Main Restaurant",
    area: "Indiranagar, Bengaluru",
    code: "LOC - PG 001",
    type: "Restaurant",
    status: "Active",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
    lastSync: new Date(nowMs - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "loc-2",
    name: "Cloud Kitchen North",
    area: "Hebbal, Bengaluru",
    code: "LOC - PG 002",
    type: "Cloud Kitchen",
    status: "Active",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
    lastSync: new Date(nowMs - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "loc-3",
    name: "Delivery Hub East",
    area: "Whitefield, Bengaluru",
    code: "LOC - PG 003",
    type: "Delivery Hub",
    status: "Pending",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
    lastSync: new Date(nowMs - 26 * 3600 * 1000).toISOString(),
  },
  {
    id: "loc-4",
    name: "Central Warehouse",
    area: "Hosur Road, Bengaluru",
    code: "LOC - PG 004",
    type: "Warehouse",
    status: "Inactive",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
    lastSync: new Date(nowMs - 4 * 86400 * 1000).toISOString(),
  },
  {
    id: "loc-5",
    name: "New Outlet South",
    area: "JP Nagar, Bengaluru",
    code: "LOC - PG 005",
    type: "Restaurant",
    status: "Draft",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
    lastSync: new Date(nowMs - 11 * 86400 * 1000).toISOString(),
  },
];

export const PartnerDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { can, canAccess } = usePermissions();
  const { org_id, id } = useParams<{ org_id?: string; id?: string }>();
  const activeOrgId = org_id || id || "";

  // Granular Permission Checks
  const canApprovePartner = can("feat_partner_review", "approve_partner");
  const canRejectPartner = can("feat_partner_review", "reject_partner");
  const canMarkUnderReview = can("feat_partner_review", "mark_under_review");
  const canDeletePartner = can("feat_partner_review", "delete_partner");
  const hasAnyReviewAction =
    canAccess("feat_partner_review") &&
    (canApprovePartner || canRejectPartner || canMarkUnderReview || canDeletePartner);

  const canViewLocations =
    canAccess("feat_partner_locations") && can("feat_partner_locations", "view_locations");
  const canCreateLocation = can("feat_partner_locations", "create_location");
  const canEditLocation = can("feat_partner_locations", "edit_location");
  const canDeleteLocation = can("feat_partner_locations", "delete_location");
  const canManageLocation = canEditLocation || canDeleteLocation;

  const canViewDocs =
    canAccess("feat_partner_docs") && can("feat_partner_docs", "view_docs");

  // Partner state
  const [partner, setPartner] = useState<PartnerDetails>(DEFAULT_PARTNER);
  const [isLoadingPartner, setIsLoadingPartner] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);
  const [isDeletingPartner, setIsDeletingPartner] = useState(false);

  // Locations state
  const [locations, setLocations] = useState<LocationItem[]>(INITIAL_LOCATIONS);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  const filteredLocations = locations.filter((loc) => {
    const q = locationSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const sync = formatLastSync(loc.last_sync || loc.lastSync);
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.area.toLowerCase().includes(q) ||
      loc.code.toLowerCase().includes(q) ||
      loc.type.toLowerCase().includes(q) ||
      loc.status.toLowerCase().includes(q) ||
      sync.main.toLowerCase().includes(q) ||
      sync.combined.toLowerCase().includes(q)
    );
  });

  // Fetch live partner data and locations from backend API
  const fetchPartnerData = useCallback(async () => {
    if (!activeOrgId) return;

    // 1. Fetch organization details if valid DB identifier
    if (!activeOrgId.startsWith("PRT-") && !activeOrgId.startsWith("loc-")) {
      try {
        setIsLoadingPartner(true);
        const orgRes = await organizationApi.getById(activeOrgId);
        if (orgRes && orgRes.organization) {
          setPartner({
            id: orgRes.organization.id,
            business_name: orgRes.organization.business_name,
            domain: orgRes.organization.domain || "Store",
            status: orgRes.organization.status || "Draft",
            email: orgRes.organization.email,
            phone_number: orgRes.organization.phone_number,
            created_at: orgRes.organization.created_at,
          });
        }
      } catch (err: unknown) {
        console.warn("Could not fetch organization by ID, keeping fallback:", err);
      } finally {
        setIsLoadingPartner(false);
      }
    }

    // 2. Fetch locations under this organization
    try {
      setIsLoadingLocations(true);
      const locRes = await locationApi.getByOrganization(activeOrgId);
      if (locRes && Array.isArray(locRes.locations)) {
        if (locRes.locations.length > 0) {
          const mappedLocations: LocationItem[] = locRes.locations.map(
            (loc: ApiLocationItem, idx: number) => ({
              id: loc.id,
              org_id: loc.org_id,
              name: loc.name,
              area: loc.area || "Bengaluru",
              code: loc.code || generateLocationCode(partner.business_name || "Location", idx + 1),
              type: loc.type,
              status: (loc.status as "Active" | "Pending" | "Inactive" | "Draft") || "Active",
              timeZone: loc.time_zone || loc.timeZone || "Asia/Kolkata",
              currency: loc.currency || "INR (₹)",
              lastSync: loc.last_sync || loc.lastSync || "Just now",
            })
          );
          setLocations(mappedLocations);
        } else {
          setLocations([]);
        }
      }
    } catch (err: unknown) {
      console.warn("Could not fetch locations from API, keeping fallback:", err);
    } finally {
      setIsLoadingLocations(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    if (activeOrgId) {
      fetchPartnerData();
    }
  }, [activeOrgId, fetchPartnerData]);

  // Location delete modal state
  const [locationToDelete, setLocationToDelete] = useState<LocationItem | null>(null);

  const confirmDeleteLocation = async () => {
    if (!locationToDelete) return;
    if (!canDeleteLocation) {
      showNotification("You do not have permission to delete locations", "error");
      return;
    }
    setIsDeletingLocation(true);
    try {
      if (activeOrgId && !activeOrgId.startsWith("PRT-")) {
        await locationApi.delete(activeOrgId, locationToDelete.id);
      }
      setLocations((prev) => prev.filter((loc) => loc.id !== locationToDelete.id));
      showNotification(`Location "${locationToDelete.name}" deleted successfully`, "success");
      setLocationToDelete(null);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to delete location");
      showNotification(errorMsg, "error");
    } finally {
      setIsDeletingLocation(false);
    }
  };

  // Modals state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Notification Toast state
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    show: false,
    message: "",
    type: "info",
  });

  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  // Location Form state
  const [locationForm, setLocationForm] = useState({
    name: "",
    area: "",
    code: "",
    type: "Restaurant",
    status: "Active" as "Active" | "Pending" | "Inactive" | "Draft",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
  });

  // Open Location Modal for Add
  const handleOpenAddLocation = () => {
    if (!canCreateLocation) {
      showNotification("You do not have permission to add locations", "error");
      return;
    }
    setEditingLocation(null);
    const nextCode = generateLocationCode(partner.business_name, locations.length + 1);
    setLocationForm({
      name: "",
      area: "",
      code: nextCode,
      type: "Restaurant",
      status: "Active",
      timeZone: "Asia/Kolkata",
      currency: "INR (₹)",
    });
    setIsLocationModalOpen(true);
  };

  // Open Location Modal for Edit
  const handleOpenEditLocation = (loc: LocationItem) => {
    if (!canEditLocation) {
      showNotification("You do not have permission to edit locations", "error");
      return;
    }
    setEditingLocation(loc);
    setLocationForm({
      name: loc.name,
      area: loc.area,
      code: loc.code,
      type: loc.type,
      status: loc.status,
      timeZone: loc.timeZone,
      currency: loc.currency,
    });
    setIsLocationModalOpen(true);
  };

  // Save Location (Add or Update)
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation && !canEditLocation) {
      showNotification("You do not have permission to edit locations", "error");
      return;
    }
    if (!editingLocation && !canCreateLocation) {
      showNotification("You do not have permission to add locations", "error");
      return;
    }
    if (!locationForm.name.trim()) {
      showNotification("Location name is required", "error");
      return;
    }

    setIsSavingLocation(true);
    try {
      if (editingLocation) {
        if (activeOrgId && !activeOrgId.startsWith("PRT-")) {
          const updatePayload: UpdateLocationPayload = {
            name: locationForm.name.trim(),
            area: locationForm.area.trim() || undefined,
            code: locationForm.code.trim().toUpperCase() || undefined,
            type: locationForm.type,
            status: locationForm.status,
            time_zone: locationForm.timeZone,
            currency: locationForm.currency,
          };
          const res = await locationApi.update(activeOrgId, editingLocation.id, updatePayload);
          const updated = res.location;
          setLocations((prev) =>
            prev.map((loc) =>
              loc.id === editingLocation.id
                ? {
                    ...loc,
                    name: updated.name,
                    area: updated.area || locationForm.area.trim() || "Bengaluru",
                    code: updated.code || locationForm.code.trim().toUpperCase(),
                    type: updated.type,
                    status:
                      (updated.status as "Active" | "Pending" | "Inactive" | "Draft") ||
                      locationForm.status,
                    timeZone: updated.time_zone || locationForm.timeZone,
                    currency: updated.currency || locationForm.currency,
                    lastSync: "Just now",
                  }
                : loc
            )
          );
        } else {
          setLocations((prev) =>
            prev.map((loc) =>
              loc.id === editingLocation.id
                ? {
                    ...loc,
                    name: locationForm.name.trim(),
                    area: locationForm.area.trim() || "Bengaluru",
                    code: locationForm.code.trim().toUpperCase(),
                    type: locationForm.type,
                    status: locationForm.status,
                    timeZone: locationForm.timeZone,
                    currency: locationForm.currency,
                    lastSync: "Just now",
                  }
                : loc
            )
          );
        }
        showNotification("Location updated successfully", "success");
      } else {
        if (activeOrgId && !activeOrgId.startsWith("PRT-")) {
          const createPayload: CreateLocationPayload = {
            name: locationForm.name.trim(),
            area: locationForm.area.trim() || "Bengaluru",
            code: locationForm.code.trim().toUpperCase() || undefined,
            type: locationForm.type,
            status: locationForm.status,
            time_zone: locationForm.timeZone,
            currency: locationForm.currency,
          };
          const res = await locationApi.create(activeOrgId, createPayload);
          const created = res.location;
          const newLoc: LocationItem = {
            id: created.id,
            org_id: created.org_id || activeOrgId,
            name: created.name,
            area: created.area || locationForm.area.trim() || "Bengaluru",
            code: created.code || locationForm.code.trim().toUpperCase() || "ANN-NEW",
            type: created.type,
            status:
              (created.status as "Active" | "Pending" | "Inactive" | "Draft") ||
              locationForm.status,
            timeZone: created.time_zone || locationForm.timeZone,
            currency: created.currency || locationForm.currency,
            lastSync: "Just now",
          };
          setLocations((prev) => [newLoc, ...prev]);
        } else {
          const newLoc: LocationItem = {
            id: `loc-${Date.now()}`,
            name: locationForm.name.trim(),
            area: locationForm.area.trim() || "Bengaluru",
            code: locationForm.code.trim().toUpperCase() || "ANN-NEW",
            type: locationForm.type,
            status: locationForm.status,
            timeZone: locationForm.timeZone,
            currency: locationForm.currency,
            lastSync: "Just now",
          };
          setLocations((prev) => [newLoc, ...prev]);
        }
        showNotification("New location added successfully", "success");
      }
      setIsLocationModalOpen(false);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to save location");
      showNotification(errorMsg, "error");
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Handle Lifecycle Actions - Delete Partner
  const handleDeletePartner = async () => {
    if (!canDeletePartner) {
      showNotification("You do not have permission to delete partners", "error");
      return;
    }
    setIsDeletingPartner(true);
    try {
      if (activeOrgId && !activeOrgId.startsWith("PRT-")) {
        await organizationApi.delete(activeOrgId);
      }
      setIsDeleteModalOpen(false);
      showNotification(`Partner ${partner.business_name} deleted.`, "error");
      setTimeout(() => {
        navigate("/organizations/360");
      }, 1500);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to delete partner");
      showNotification(errorMsg, "error");
    } finally {
      setIsDeletingPartner(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
      case "Approved":
        return "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]";
      case "Pending":
      case "Draft":
        return "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]";
      case "Inactive":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "Rejected":
        return "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="w-full space-y-6 pb-14">
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-top-3 duration-200 bg-white">
          {notification.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          )}
          {notification.type === "error" && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
          {notification.type === "info" && (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          )}
          <span className="text-slate-800">{notification.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* TOP BREADCRUMB & BACK ACTION                                    */}
      {/* ============================================================== */}
      <div className="flex items-center justify-between">
        <Link
          to="/organizations/360"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Organization 360
        </Link>
        {activeOrgId && (
          <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            Org ID: {activeOrgId}
          </span>
        )}
      </div>

      {/* ============================================================== */}
      {/* 1. PAGE HEADER                                                 */}
      {/* ============================================================== */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Partner Detail
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Full-page review for {partner.business_name}, including onboarding progress, contact
          information, document uploads, and lifecycle actions.
        </p>
      </div>

      {/* ============================================================== */}
      {/* 2. TOP ROW (Partner Summary & Onboarding Progress)             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Partner Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Partner Summary</h2>
                  {isLoadingPartner && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{partner.business_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {partner.domain || "Store"}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                    partner.status
                  )}`}
                >
                  {partner.status}
                </span>
              </div>
            </div>

            {/* 3 Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
              {/* Partner ID */}
              <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 font-medium">Partner ID</div>
                <div
                  className="text-sm font-bold text-slate-900 mt-1.5 tracking-tight truncate font-mono"
                  title={partner.id}
                >
                  {partner.id}
                </div>
              </div>

              {/* Primary Store */}
              <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 font-medium">Primary Store</div>
                <div className="text-sm font-bold text-slate-900 mt-1.5 tracking-tight truncate">
                  {locations.length > 0 ? locations[0].name : "Main Restaurant"}
                </div>
              </div>

              {/* Onboarding */}
              <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 font-medium">Onboarding</div>
                <div className="text-sm font-bold text-slate-900 mt-1.5 tracking-tight">
                  0% complete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Onboarding Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Onboarding Progress</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              0% complete • 9 required steps
            </p>
          </div>

          <div className="space-y-2 mt-4">
            {[
              "Become Partner",
              "Verify",
              "Business Info",
              "Shop Details",
              "Documents",
              "Bank",
              "Operations",
              "Agreement",
              "Review & Submit",
            ].map((step) => (
              <div key={step} className="flex items-center justify-between text-xs py-0.5">
                <span className="font-semibold text-slate-800">{step}</span>
                <span className="text-xs text-slate-400 font-normal">Pending</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MIDDLE ROW (Contact & Basic + Documents)                    */}
      {/* ============================================================== */}
      <div className={`grid grid-cols-1 ${canViewDocs ? "lg:grid-cols-2" : ""} gap-6`}>
        {/* Card 3: Contact & Basic */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Contact & Basic</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Primary contact details and verification status for the partner.
            </p>
          </div>

          <div className="space-y-3.5 mt-5">
            {/* Email */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-normal">Email</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">{partner.email}</span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-normal">Phone</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                {partner.phone_number}
              </span>
            </div>

            {/* City */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-normal">City</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                {locations[0]?.area
                  ? locations[0].area.includes(",")
                    ? locations[0].area.split(",")[1].trim()
                    : locations[0].area
                  : "Latur"}
              </span>
            </div>

            {/* Mobile verified */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-normal">Mobile verified</span>
              <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Verified
              </span>
            </div>

            {/* Email verified */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-normal">Email verified</span>
              <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Documents */}
        {canViewDocs && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">Documents</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Upload status for the required partner verification documents.
              </p>
            </div>

            <div className="space-y-3 mt-5">
              {[
                "PAN Card",
                "Aadhaar Card",
                "GST Certificate",
                "Shop Establishment License",
                "Cancelled Cheque",
              ].map((doc) => (
                <div key={doc} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 text-xs sm:text-sm">{doc}</span>
                  <span className="bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. REVIEW ACTIONS CARD                                         */}
      {/* ============================================================== */}
      {hasAnyReviewAction && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Review Actions</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Lifecycle actions for the partner application.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            {/* Approve (Design placeholder - functionality to be enabled once finalized) */}
            {canApprovePartner && (
              <button
                type="button"
                onClick={() =>
                  showNotification(
                    "The Approve button is clickable, but it doesn't do anything yet. Its functionality is still in progress.",
                    "info"
                  )
                }
                className="bg-[#00875A] hover:bg-[#00744D] text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                Approve
              </button>
            )}

            {/* Reject (Design placeholder - functionality to be enabled once finalized) */}
            {canRejectPartner && (
              <button
                type="button"
                onClick={() =>
                  showNotification(
                    "The Reject button is clickable, but it doesn't do anything yet. Its functionality is still in progress.",
                    "info"
                  )
                }
                className="border border-[#F59E0B] text-[#D97706] hover:bg-[#FFFBEB] font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Reject
              </button>
            )}

            {/* Mark under review (Design placeholder - functionality to be enabled once finalized) */}
            {canMarkUnderReview && (
              <button
                type="button"
                onClick={() =>
                  showNotification(
                    "The Mark under review button is clickable, but it doesn't do anything yet. Its functionality is still in progress.",
                    "info"
                  )
                }
                className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Mark under review
              </button>
            )}

            {/* Delete Partner */}
            {canDeletePartner && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="border border-[#F43F5E] text-[#E11D48] hover:bg-[#FFF1F2] font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Partner
              </button>
            )}
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* 5. LOCATION MANAGEMENT SECTION                                 */}
      {/* ============================================================== */}
      {canViewLocations && (
        <div className="space-y-4 pt-2">
          {/* Header with Title on Left and "Add New Location" + Search on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Location Management
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  {locations.length} {locations.length === 1 ? "Location" : "Locations"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage location records, review operational details, and configure store branches.
              </p>
            </div>

            {/* Right-aligned Controls: Real-time Search + Prominent Primary "Add New Location" Button */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Quick search input */}
              <div className="relative min-w-[210px] w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  placeholder="Search locations or codes..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium placeholder:text-slate-400 shadow-2xs"
                />
                {locationSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setLocationSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Prominent Add New Location Button above table */}
              {canCreateLocation && (
                <button
                  type="button"
                  onClick={handleOpenAddLocation}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  Add New Location
                </button>
              )}
            </div>
          </div>


          {/* Location Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-white">
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600">Location</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600">
                      Location Code
                    </th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600">Type</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600">Status</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600">Time Zone</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600">Currency</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-slate-600">Last Sync</th>
                    {canManageLocation && (
                      <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 text-right">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingLocations ? (
                    <tr>
                      <td colSpan={canManageLocation ? 8 : 7} className="px-5 py-8 text-center text-xs text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                          <span>Loading locations...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLocations.length === 0 ? (
                    <tr>
                      <td colSpan={canManageLocation ? 8 : 7} className="px-5 py-8 text-center text-xs text-slate-400">
                        No locations found matching &quot;{locationSearchQuery}&quot;.
                        {locationSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setLocationSearchQuery("")}
                            className="ml-2 text-blue-600 hover:underline font-semibold cursor-pointer"
                          >
                            Clear search
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredLocations.map((loc) => (
                      <tr key={loc.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Location Name & Subtitle */}
                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-slate-900">{loc.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{loc.area}</div>
                        </td>

                        {/* Location Code */}
                        <td className="px-5 py-4 text-xs font-medium text-slate-800">{loc.code}</td>

                        {/* Type */}
                        <td className="px-5 py-4 text-xs font-medium text-slate-700">{loc.type}</td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                              loc.status
                            )}`}
                          >
                            {loc.status}
                          </span>
                        </td>

                        {/* Time Zone */}
                        <td className="px-5 py-4 text-xs font-medium text-slate-700">
                          {loc.timeZone}
                        </td>

                        {/* Currency */}
                        <td className="px-5 py-4 text-xs font-medium text-slate-700">
                          {loc.currency}
                        </td>

                        {/* Last Sync */}
                        <td className="px-5 py-4">
                          {(() => {
                            const sync = formatLastSync(loc.last_sync || loc.lastSync);
                            return (
                              <div
                                className="flex flex-col text-left"
                                title={`Last synchronized: ${sync.full}`}
                              >
                                <span className="text-xs font-semibold text-slate-800">
                                  {sync.main} ({sync.sub})
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Action */}
                        {canManageLocation && (
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canEditLocation && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditLocation(loc)}
                                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                                >
                                  Edit
                                </button>
                              )}
                              {canDeleteLocation && (
                                <button
                                  type="button"
                                  onClick={() => setLocationToDelete(loc)}
                                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Summary & Subtext */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
              <span>
                Showing {filteredLocations.length} of {locations.length} operational locations
              </span>
              <span>Use the modal pattern for adding and configuring location records.</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL: ADD / EDIT LOCATION                                  */}
      {/* ============================================================== */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingLocation ? "Edit Location" : "Add New Location"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingLocation
                      ? `Update operational settings for ${editingLocation.name}`
                      : "Enter operational details to add a new outlet or facility"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar Flagship Outlet"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Area / City Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g. Indiranagar, Bengaluru"
                  value={locationForm.area}
                  onChange={(e) => setLocationForm({ ...locationForm, area: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Location Code
                    </label>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Auto-generated (Locked)
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    placeholder="LOC - XX 001"
                    value={locationForm.code}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-mono font-bold uppercase cursor-not-allowed select-none focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Auto-generated from business initials and location count.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Location Type
                  </label>
                  <select
                    value={locationForm.type}
                    onChange={(e) => setLocationForm({ ...locationForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium cursor-pointer"
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Cloud Kitchen">Cloud Kitchen</option>
                    <option value="Delivery Hub">Delivery Hub</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Retail Outlet">Retail Outlet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={locationForm.status}
                    onChange={(e) =>
                      setLocationForm({
                        ...locationForm,
                        status: e.target.value as "Active" | "Pending" | "Inactive" | "Draft",
                      })
                    }
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Time Zone
                  </label>
                  <select
                    value={locationForm.timeZone}
                    onChange={(e) => setLocationForm({ ...locationForm, timeZone: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium cursor-pointer"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={locationForm.currency}
                    onChange={(e) => setLocationForm({ ...locationForm, currency: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium cursor-pointer"
                  >
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="AED (د.إ)">AED (د.إ)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLocation}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isSavingLocation && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingLocation ? "Save Changes" : "Create Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL: DELETE PARTNER CONFIRMATION                          */}
      {/* ============================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Trash icon and Delete Partner title side by side */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Partner</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-800 font-medium">
              Are you sure you want to permanently delete partner{" "}
              <span className="font-bold">{partner.business_name}</span> (ID: {partner.id}) and all
              of its associated records, branches, and documents?
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePartner}
                disabled={isDeletingPartner}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {isDeletingPartner ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isDeletingPartner ? "Deleting..." : "Delete Partner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODAL: DELETE LOCATION CONFIRMATION                         */}
      {/* ============================================================== */}
      {locationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Trash icon and Delete Location title side by side */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Location</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-800 font-medium">
              Are you sure you want to permanently delete location{" "}
              <span className="font-bold">{locationToDelete.name}</span> ({locationToDelete.code})?
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setLocationToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteLocation}
                disabled={isDeletingLocation}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {isDeletingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isDeletingLocation ? "Deleting..." : "Delete Location"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDetailPage;
