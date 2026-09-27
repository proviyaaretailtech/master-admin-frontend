import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/use-auth";
import { usePermissions } from "../hooks/use-permissions";
import { userApi } from "../api";
import { roleApi, SecurityRole } from "../api/role.api";
import { User, Pagination } from "../@types";
import {
  Search,
  ChevronDown,
  X,
  Trash2,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
} from "lucide-react";

export const UsersManagementPage: React.FC = () => {
  const { user: currentAuthUser } = useAuth();
  const { can } = usePermissions();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<SecurityRole[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("All Security Roles");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All Statuses");
  const [currentPage, setCurrentPage] = useState(1);

  // Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalForm, setModalForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    role_id: "" as string,
    status: "Active" as "Active" | "Inactive",
  });
  const [saving, setSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load available security roles for dropdown
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await roleApi.getAll();
        if (res && Array.isArray(res.roles)) {
          setAvailableRoles(res.roles);
        }
      } catch (err) {
        console.warn("Could not fetch security roles:", err);
      }
    };
    fetchRoles();
  }, []);

  // Fetch paginated users from Backend
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userApi.getAll({
        page: currentPage,
        limit: 9,
        search: searchTerm,
        role_id: selectedRoleFilter !== "All Security Roles" ? selectedRoleFilter : undefined,
        status: selectedStatusFilter,
      });

      setUsers(response.users || []);
      setPagination(
        response.pagination || {
          total: response.users?.length || 0,
          page: currentPage,
          limit: 9,
          totalPages: Math.max(1, Math.ceil((response.users?.length || 0) / 9)),
        }
      );
    } catch (err) {
      console.error("Failed to load users from database:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedRoleFilter, selectedStatusFilter]);

  // Debounced load when search or filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  // Open Edit Modal
  const handleOpenEditModal = (targetUser: User) => {
    setEditingUser(targetUser);
    setModalForm({
      first_name: targetUser.first_name || "",
      last_name: targetUser.last_name || "",
      email: targetUser.email || "",
      phone_number: targetUser.phone_number === "-" ? "" : targetUser.phone_number || "",
      role_id: targetUser.role_id || "",
      status: (targetUser.status as "Active" | "Inactive") || "Active",
    });
    setModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  // Save changes from modal directly to Backend DB
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    setFeedbackMessage(null);

    try {
      await userApi.update(editingUser.id, {
        first_name: modalForm.first_name.trim(),
        last_name: modalForm.last_name.trim(),
        email: modalForm.email.trim(),
        phone_number: modalForm.phone_number.trim() || "-",
        role_id: modalForm.role_id ? modalForm.role_id : null,
        status: modalForm.status,
      });

      setFeedbackMessage("Account details and security role updated!");
      setTimeout(() => {
        setFeedbackMessage(null);
        handleCloseModal();
        loadUsers();
      }, 700);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!editingUser) return;
    if (editingUser.id === currentAuthUser?.id) {
      alert("You cannot delete your own active session account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${editingUser.email}?`)) {
      return;
    }

    try {
      await userApi.delete(editingUser.id);
      handleCloseModal();
      loadUsers();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const startIndex = (pagination.page - 1) * pagination.limit + 1;
  const endIndex = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* ============================================================== */}
      {/* 1. TOP FILTER CONTROLS BAR                                     */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input with magnifying glass */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search name, email, mobile, role..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#65D000] focus:ring-1 focus:ring-[#65D000]/20 transition-all outline-none placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        {/* Dropdown: Security Roles Filter */}
        <div className="relative">
          <select
            value={selectedRoleFilter}
            onChange={(e) => {
              setSelectedRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs text-slate-700 font-medium focus:border-[#65D000] outline-none shadow-2xs cursor-pointer"
          >
            <option value="All Security Roles">All Security Roles</option>
            {availableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Dropdown: All Statuses */}
        <div className="relative">
          <select
            value={selectedStatusFilter}
            onChange={(e) => {
              setSelectedStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-9 text-xs text-slate-700 font-medium focus:border-[#65D000] outline-none shadow-2xs cursor-pointer"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Refresh button */}
        <button
          onClick={loadUsers}
          disabled={loading}
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          title="Refresh database"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN DATA TABLE CARD                                        */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Card Header: Title & Subtitle */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-snug">System Accounts</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              System accounts authenticated via security policies and granular permissions.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFB] text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100 font-bold">
              <tr>
                <th className="px-6 py-3.5">EMAIL</th>
                <th className="px-6 py-3.5">SECURITY ROLE</th>
                <th className="px-6 py-3.5">MOBILE</th>
                <th className="px-6 py-3.5">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#65D000] border-t-transparent" />
                      <span>Loading database users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    No matching accounts found in database.
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const canEdit = can("feat_users_mgmt", "edit_user");
                  const roleDisplayName =
                    item.role_details?.name ||
                    item.role_name ||
                    (item.role_id ? "Assigned Role" : "No Role Assigned");
                  const roleScope =
                    item.role_details?.scope ||
                    item.role_scope ||
                    (item.role_id ? "Active Policy" : "Unassigned");

                  return (
                    <tr
                      key={item.id}
                      onClick={canEdit ? () => handleOpenEditModal(item) : undefined}
                      className={`hover:bg-slate-50/70 transition-colors ${canEdit ? "cursor-pointer" : ""}`}
                      title={canEdit ? "Click row to edit account details" : undefined}
                    >
                      {/* EMAIL Column */}
                      <td className="px-6 py-4 font-bold text-slate-900 text-xs sm:text-sm">
                        {item.email}
                      </td>

                      {/* SECURITY ROLE Column */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{roleDisplayName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 ml-5">{roleScope}</div>
                      </td>

                      {/* MOBILE Column */}
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {item.phone_number || "-"}
                      </td>

                      {/* STATUS Column */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            (item.status || "Active") === "Active"
                              ? "bg-[#EAF8E6] text-[#2E7D32]"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.status || "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Card Footer: Results Count + Pagination */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing {pagination.total === 0 ? 0 : startIndex}-{endIndex} of {pagination.total}{" "}
            results
          </div>

          {/* Pagination Box */}
          <div className="flex items-center border border-slate-200 rounded-xl px-3 py-1.5 bg-white shadow-2xs gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="text-slate-400 hover:text-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                disabled={loading}
                className={`font-semibold cursor-pointer ${
                  currentPage === pageNum
                    ? "text-slate-900 font-bold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages || loading}
              className="text-slate-400 hover:text-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. EDIT ACCOUNT MODAL                                          */}
      {/* ============================================================== */}
      {modalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-base font-bold text-slate-900">Edit System Account</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update administrator details, security role assignment, and access status.
                </p>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Feedback Toast */}
            {feedbackMessage && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">{feedbackMessage}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={modalForm.first_name}
                    onChange={(e) =>
                      setModalForm((prev) => ({ ...prev, first_name: e.target.value }))
                    }
                    placeholder="First Name"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#65D000] focus:ring-1 focus:ring-[#65D000]/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={modalForm.last_name}
                    onChange={(e) =>
                      setModalForm((prev) => ({ ...prev, last_name: e.target.value }))
                    }
                    placeholder="Last Name"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#65D000] focus:ring-1 focus:ring-[#65D000]/20 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={modalForm.email}
                  onChange={(e) => setModalForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#65D000] focus:ring-1 focus:ring-[#65D000]/20 transition-all outline-none font-medium"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={modalForm.phone_number}
                  onChange={(e) =>
                    setModalForm((prev) => ({ ...prev, phone_number: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#65D000] focus:ring-1 focus:ring-[#65D000]/20 transition-all outline-none"
                />
              </div>

              {/* Security Role & Status Row (Zero panel/role dropdowns) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Security Role
                  </label>
                  <select
                    value={modalForm.role_id}
                    onChange={(e) => setModalForm((prev) => ({ ...prev, role_id: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#65D000] outline-none cursor-pointer"
                  >
                    <option value="">No Role Assigned (Restricted)</option>
                    {availableRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.scope})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={modalForm.status}
                    onChange={(e) =>
                      setModalForm((prev) => ({
                        ...prev,
                        status: e.target.value as "Active" | "Inactive",
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#65D000] outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {can("feat_users_mgmt", "delete_user") && (
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete User</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  {can("feat_users_mgmt", "edit_user") && (
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#65D000] hover:bg-[#58b800] text-white font-semibold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? "Saving..." : "Save Changes"}</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
