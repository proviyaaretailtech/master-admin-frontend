import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  KeyRound,
  Trash2,
  X,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Building2,
  Check,
  Plus,
  Search,
} from "lucide-react";

interface LocationItem {
  id: string;
  name: string;
  area: string;
  code: string;
  type: string;
  status: "Active" | "Pending" | "Inactive" | "Draft";
  timeZone: string;
  currency: string;
  lastSync: string;
}

const INITIAL_LOCATIONS: LocationItem[] = [
  {
    id: "loc-1",
    name: "Main Restaurant",
    area: "Indiranagar, Bengaluru",
    code: "ANN-MAIN",
    type: "Restaurant",
    status: "Active",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
    lastSync: "2 min ago",
  },
  {
    id: "loc-2",
    name: "Cloud Kitchen North",
    area: "Hebbal, Bengaluru",
    code: "ANN-NORTH",
    type: "Cloud Kitchen",
    status: "Active",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
    lastSync: "18 min ago",
  },
  {
    id: "loc-3",
    name: "Delivery Hub East",
    area: "Whitefield, Bengaluru",
    code: "ANN-EAST",
    type: "Delivery Hub",
    status: "Pending",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
    lastSync: "1 hr ago",
  },
  {
    id: "loc-4",
    name: "Central Warehouse",
    area: "Hosur Road, Bengaluru",
    code: "ANN-WHSE",
    type: "Warehouse",
    status: "Inactive",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
    lastSync: "3 hr ago",
  },
  {
    id: "loc-5",
    name: "New Outlet South",
    area: "JP Nagar, Bengaluru",
    code: "ANN-SOUTH",
    type: "Restaurant",
    status: "Draft",
    timeZone: "Asia/Kolkata",
    currency: "INR (₹)",
    lastSync: "1 day ago",
  },
];

export const PartnerDetailPage: React.FC = () => {
  const navigate = useNavigate();

  // Partner status states
  const [partnerStatus, setPartnerStatus] = useState<string>("Draft");
  const [partnerType] = useState<string>("Store");

  // Locations state
  const [locations, setLocations] = useState<LocationItem[]>(INITIAL_LOCATIONS);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  const filteredLocations = locations.filter((loc) => {
    const q = locationSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.area.toLowerCase().includes(q) ||
      loc.code.toLowerCase().includes(q) ||
      loc.type.toLowerCase().includes(q) ||
      loc.status.toLowerCase().includes(q)
    );
  });

  // Location delete modal state
  const [locationToDelete, setLocationToDelete] = useState<LocationItem | null>(null);

  const confirmDeleteLocation = () => {
    if (locationToDelete) {
      setLocations((prev) => prev.filter((loc) => loc.id !== locationToDelete.id));
      showNotification(`Location "${locationToDelete.name}" deleted successfully`, "success");
      setLocationToDelete(null);
    }
  };

  // Modals state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
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

  // Password Modal state
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [partnerPassword, setPartnerPassword] = useState("Proviyaa@2026!Secured");

  // Open Location Modal for Add
  const handleOpenAddLocation = () => {
    setEditingLocation(null);
    setLocationForm({
      name: "",
      area: "",
      code: `ANN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      type: "Restaurant",
      status: "Active",
      timeZone: "Asia/Kolkata",
      currency: "INR (₹)",
    });
    setIsLocationModalOpen(true);
  };

  // Open Location Modal for Edit
  const handleOpenEditLocation = (loc: LocationItem) => {
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
  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name.trim()) {
      showNotification("Location name is required", "error");
      return;
    }

    if (editingLocation) {
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
      showNotification("Location updated successfully", "success");
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
      setLocations((prev) => [...prev, newLoc]);
      showNotification("New location added successfully", "success");
    }

    setIsLocationModalOpen(false);
  };

  // Handle Lifecycle Actions
  const handleApprove = () => {
    setPartnerStatus("Approved");
    showNotification("Partner Proviyaa Global approved successfully!", "success");
  };

  const handleReject = () => {
    setPartnerStatus("Rejected");
    showNotification("Partner Proviyaa Global marked as Rejected.", "error");
  };

  const handleMarkUnderReview = () => {
    setPartnerStatus("Under Review");
    showNotification("Partner Proviyaa Global marked Under Review.", "info");
  };

  const handleDeletePartner = () => {
    setIsDeleteModalOpen(false);
    showNotification("Partner Proviyaa Global deleted.", "error");
    setTimeout(() => {
      navigate("/organizations/360");
    }, 1500);
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(partnerPassword);
    setPasswordCopied(true);
    showNotification("Password copied to clipboard", "success");
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const generateNewPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let newPass = "";
    for (let i = 0; i < 14; i++) {
      newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPartnerPassword(newPass);
    showNotification("New secure password generated", "info");
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
      </div>

      {/* ============================================================== */}
      {/* 1. PAGE HEADER                                                 */}
      {/* ============================================================== */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Partner Detail
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Full-page review for Proviyaa Global, including onboarding progress, contact information,
          document uploads, and lifecycle actions.
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
                <h2 className="text-base font-bold text-slate-900">Partner Summary</h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Proviyaa Global</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {partnerType}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                    partnerStatus
                  )}`}
                >
                  {partnerStatus}
                </span>
              </div>
            </div>

            {/* 3 Metric Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
              {/* Partner ID */}
              <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 font-medium">Partner ID</div>
                <div className="text-sm font-bold text-slate-900 mt-1.5 tracking-tight">
                  PRT-2048
                </div>
              </div>

              {/* Primary Store */}
              <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-xl p-3.5">
                <div className="text-xs text-slate-400 font-medium">Primary Store</div>
                <div className="text-sm font-bold text-slate-900 mt-1.5 tracking-tight truncate">
                  Main Restaurant
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                shreyjagga.pg@gmail.com
              </span>
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-normal">Phone</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">8668320699</span>
            </div>

            {/* City */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-normal">City</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">Latur</span>
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
      </div>

      {/* ============================================================== */}
      {/* 4. REVIEW ACTIONS CARD                                         */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Review Actions</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Lifecycle actions for the partner application.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          {/* Approve */}
          <button
            type="button"
            onClick={handleApprove}
            className="bg-[#00875A] hover:bg-[#00744D] text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
          >
            Approve
          </button>

          {/* Reject */}
          <button
            type="button"
            onClick={handleReject}
            className="border border-[#F59E0B] text-[#D97706] hover:bg-[#FFFBEB] font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Reject
          </button>

          {/* Mark under review */}
          <button
            type="button"
            onClick={handleMarkUnderReview}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Mark under review
          </button>

          {/* Show/Create password */}
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Show/Create password
          </button>

          {/* Delete Partner */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="border border-[#F43F5E] text-[#E11D48] hover:bg-[#FFF1F2] font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Delete Partner
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. LOCATION MANAGEMENT SECTION                                 */}
      {/* ============================================================== */}
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
            <button
              type="button"
              onClick={handleOpenAddLocation}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add New Location
            </button>
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
                  <th className="px-5 py-3.5 text-xs font-semibold text-slate-600 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-xs text-slate-400">
                      No locations found matching &quot;{locationSearchQuery}&quot;.
                      <button
                        type="button"
                        onClick={() => setLocationSearchQuery("")}
                        className="ml-2 text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Clear search
                      </button>
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
                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {loc.lastSync}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditLocation(loc)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setLocationToDelete(loc)}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Location Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ANN-MAIN"
                    value={locationForm.code}
                    onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 font-medium uppercase"
                  />
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
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  {editingLocation ? "Save Changes" : "Create Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODAL: SHOW / CREATE PASSWORD                               */}
      {/* ============================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Partner Credentials</h3>
                  <p className="text-xs text-slate-500">Login credentials for Proviyaa Global</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Login Account / Email
                </label>
                <div className="text-xs font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  shreyjagga.pg@gmail.com
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Access Password
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-xs font-mono font-bold text-slate-900 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 tracking-wider">
                    {showPassword ? partnerPassword : "••••••••••••••••"}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={copyPasswordToClipboard}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    title="Copy password"
                  >
                    {passwordCopied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={generateNewPassword}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Generate New Random Password
                </button>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. MODAL: DELETE PARTNER CONFIRMATION                          */}
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
              <span className="font-bold">Proviyaa Global</span> (PRT-2048) and all of its
              associated records, branches, and documents?
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
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete Partner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. MODAL: DELETE LOCATION CONFIRMATION                         */}
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
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDetailPage;
