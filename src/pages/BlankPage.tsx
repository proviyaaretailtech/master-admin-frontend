import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/use-auth";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Phone,
  Mail,
  RefreshCw,
  Trash2,
  Edit2,
  Check,
  X,
  Database,
  Users,
} from "lucide-react";
import { userApi } from "../api";
import { User } from "../@types";

export const BlankPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    first_name: string;
    last_name: string;
    phone_number: string;
  }>({ first_name: "", last_name: "", phone_number: "" });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setApiMessage(null);
    try {
      console.log("[BlankPage] Calling GET /api/users via userApi.getAll()...");
      const data = await userApi.getAll();
      setUsersList(data.users || []);
      setApiMessage(`Successfully loaded ${data.users?.length || 0} user(s) via CRUD API.`);
    } catch (err: any) {
      console.error("[BlankPage] Failed to fetch users:", err);
      setApiMessage(`Error fetching users: ${err.message}`);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStartEdit = (targetUser: User) => {
    setEditingUserId(targetUser.id);
    setEditFormData({
      first_name: targetUser.first_name,
      last_name: targetUser.last_name,
      phone_number: targetUser.phone_number,
    });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      console.log(`[BlankPage] Calling PUT /api/users/${userId}...`, editFormData);
      await userApi.update(userId, editFormData);
      setEditingUserId(null);
      setApiMessage("User updated successfully in Supabase database.");
      fetchUsers();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === user?.id) {
      alert("You cannot delete your own active session account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      return;
    }

    try {
      console.log(`[BlankPage] Calling DELETE /api/users/${userId}...`);
      await userApi.delete(userId);
      setApiMessage(`User ${userName} deleted successfully.`);
      fetchUsers();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {/* Top POS Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#65D000] flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-sm tracking-tight">OL</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm tracking-tight sm:text-base">
                  Super Admin POS
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-[#65D000] border border-green-200">
                  <ShieldCheck className="w-3 h-3" /> Authenticated
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">OneLatur Retail System</p>
            </div>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800">
                  {user.first_name} {user.last_name}
                </span>
                <span className="text-[11px] text-slate-400">{user.email}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Current User Overview Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#65D000]/10 flex items-center justify-center text-[#65D000]">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Welcome, {user?.first_name} {user?.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user?.email}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {user?.phone_number || "Not provided"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                    ID: {user?.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Database className="w-3.5 h-3.5" /> Supabase PostgreSQL
              </span>
            </div>
          </div>
        </div>

        {/* Live Users Table / CRUD API Operations */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-800">
                Registered Users &amp; CRUD API Management
              </h2>
              <span className="text-xs bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                {usersList.length}
              </span>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
              <span>Refresh Users</span>
            </button>
          </div>

          {/* Feedback message banner */}
          {apiMessage && (
            <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex items-center justify-between">
              <span>{apiMessage}</span>
              <button
                onClick={() => setApiMessage(null)}
                className="text-blue-500 hover:text-blue-800 text-xs cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">UUID</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      {loadingUsers
                        ? "Loading users from database..."
                        : "No users found in database."}
                    </td>
                  </tr>
                ) : (
                  usersList.map((item) => {
                    const isEditing = editingUserId === item.id;
                    const isCurrentUser = item.id === user?.id;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Name Column */}
                        <td className="px-5 py-3.5 font-medium">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editFormData.first_name}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    first_name: e.target.value,
                                  }))
                                }
                                placeholder="First Name"
                                className="px-2 py-1 text-xs border border-slate-300 rounded-md w-24 outline-none focus:border-[#65D000]"
                              />
                              <input
                                type="text"
                                value={editFormData.last_name}
                                onChange={(e) =>
                                  setEditFormData((prev) => ({
                                    ...prev,
                                    last_name: e.target.value,
                                  }))
                                }
                                placeholder="Last Name"
                                className="px-2 py-1 text-xs border border-slate-300 rounded-md w-24 outline-none focus:border-[#65D000]"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>
                                {item.first_name} {item.last_name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] bg-[#65D000]/15 text-[#52a800] px-1.5 py-0.5 rounded-sm font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Email Column */}
                        <td className="px-5 py-3.5 text-slate-600">{item.email}</td>

                        {/* Phone Column */}
                        <td className="px-5 py-3.5">
                          {isEditing ? (
                            <input
                              type="tel"
                              value={editFormData.phone_number}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  phone_number: e.target.value,
                                }))
                              }
                              placeholder="Phone"
                              className="px-2 py-1 text-xs border border-slate-300 rounded-md w-36 outline-none focus:border-[#65D000]"
                            />
                          ) : (
                            <span className="text-slate-600">{item.phone_number || "—"}</span>
                          )}
                        </td>

                        {/* UUID Column */}
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                          {item.id.slice(0, 8)}...{item.id.slice(-4)}
                        </td>

                        {/* Actions Column */}
                        <td className="px-5 py-3.5 text-right">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                title="Edit user"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {!isCurrentUser && (
                                <button
                                  onClick={() =>
                                    handleDeleteUser(
                                      item.id,
                                      `${item.first_name} ${item.last_name}`
                                    )
                                  }
                                  className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Blank Workspace Canvas Placeholder */}
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center bg-white/50 backdrop-blur-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2.5">
            <UserIcon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">Blank Workspace Ready</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You can now build your store POS billing, product catalog, inventory tracking, and
            reports here.
          </p>
        </div>
      </main>
    </div>
  );
};
