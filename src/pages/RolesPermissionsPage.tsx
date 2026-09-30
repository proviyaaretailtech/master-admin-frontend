import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Shield,
  Search,
  Plus,
  User,
  Eye,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { roleApi } from "../api/role.api";
import { usePermissions } from "../hooks/use-permissions";

export type FeatureCategory =
  "all" | "commercials" | "partner_detail" | "organization" | "access_control" | "system";

export type AccessLevel = "none" | "read_only" | "full";

export interface GranularAction {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface FeaturePermission {
  id: string;
  name: string;
  category: "commercials" | "partner_detail" | "organization" | "access_control" | "system";
  pagePath: string;
  description: string;
  accessLevel: AccessLevel;
  actions: GranularAction[];
}

export interface SecurityRole {
  id: string;
  name: string;
  key: string;
  status: "Active" | "Inactive";
  scope: string;
  description: string;
  assignedText: string;
  assignedCount: number;
  isSystem?: boolean;
  features: FeaturePermission[];
}

// iOS-style Toggle Switch
interface ToggleSwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  ariaLabel?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = "sm",
  ariaLabel,
}) => {
  const isSm = size === "sm";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      className={`relative inline-flex shrink-0 items-center cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#65D000]/40 ${
        isSm ? "h-5 w-9" : "h-6 w-11"
      } ${checked ? "bg-[#65D000]" : "bg-slate-200"} ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          isSm
            ? `h-3.5 w-3.5 transform ${checked ? "translate-x-4" : "translate-x-1"}`
            : `h-4.5 w-4.5 transform ${checked ? "translate-x-5" : "translate-x-1"}`
        }`}
      />
    </button>
  );
};

// Base definitions of the actual application pages & features
export const DEFAULT_FEATURES: FeaturePermission[] = [
  {
    id: "feat_partner_review",
    name: "Partner Detail: Review Lifecycle Actions",
    category: "partner_detail",
    pagePath: "/organizations/:org_id",
    description:
      "Control whether this user can approve, reject, flag under review, or permanently delete partner organizations.",
    accessLevel: "full",
    actions: [
      {
        key: "approve_partner",
        label: "Approve Partner",
        description: "Authorize and approve onboarding application",
        enabled: true,
      },
      {
        key: "reject_partner",
        label: "Reject Partner",
        description: "Decline and reject onboarding application",
        enabled: true,
      },
      {
        key: "mark_under_review",
        label: "Mark Under Review",
        description: "Change status to Pending review",
        enabled: true,
      },
      {
        key: "delete_partner",
        label: "Delete Partner",
        description: "Permanently delete partner and all records",
        enabled: true,
      },
    ],
  },
  {
    id: "feat_partner_locations",
    name: "Partner Detail: Locations Management Table",
    category: "partner_detail",
    pagePath: "/organizations/:org_id",
    description:
      "Control access to the locations table in partner detail. Choose if it is read-only or if user can create/delete branches.",
    accessLevel: "full",
    actions: [
      {
        key: "view_locations",
        label: "View Locations Table",
        description: "Read-only access to outlets list and last sync status",
        enabled: true,
      },
      {
        key: "create_location",
        label: "Add New Location",
        description: "Create outlet records with auto-generated location codes",
        enabled: true,
      },
      {
        key: "edit_location",
        label: "Edit Location Details",
        description: "Update location area, type, timezone, and currency",
        enabled: true,
      },
      {
        key: "delete_location",
        label: "Delete Location",
        description: "Permanently remove a branch or operational outlet",
        enabled: true,
      },
    ],
  },
  {
    id: "feat_partner_docs",
    name: "Partner Detail: Documents & Verification",
    category: "partner_detail",
    pagePath: "/organizations/:org_id",
    description:
      "Manage access to PAN, Aadhaar, GST certificate, and license verification documents.",
    accessLevel: "full",
    actions: [
      {
        key: "view_docs",
        label: "View Uploaded Documents",
        description: "Inspect uploaded verification files and certificates",
        enabled: true,
      },
      {
        key: "verify_docs",
        label: "Verify & Approve Documents",
        description: "Mark KYC documents as approved or rejected",
        enabled: true,
      },
      {
        key: "edit_contact_info",
        label: "Edit Contact Information",
        description: "Modify partner email, phone number, and city details",
        enabled: true,
      },
    ],
  },
  {
    id: "feat_org_360",
    name: "Organization 360: Directory & Search",
    category: "organization",
    pagePath: "/organizations/360",
    description:
      "Access the global directory of partners, search by domain/status, and register new organizations.",
    accessLevel: "full",
    actions: [
      {
        key: "view_directory",
        label: "View Organizations Directory",
        description: "Browse partner directory with search and status filters",
        enabled: true,
      },
      {
        key: "create_org",
        label: "Register Organization",
        description: "Create new partner records via onboarding modal",
        enabled: true,
      },
      {
        key: "export_org_csv",
        label: "Export Organization Records",
        description: "Download filtered partner listings as CSV/Excel",
        enabled: true,
      },
    ],
  },
  {
    id: "feat_commercial_plans",
    name: "Commercials: Platform Plans & Modules",
    category: "commercials",
    pagePath: "/commercials/plans",
    description:
      "Control access to SaaS tier pricing, provisioning quotas (locations & user limits), platform module bundle selections, draft revisions, and live plan publishing.",
    accessLevel: "full",
    actions: [
      {
        key: "view_plans",
        label: "View Platform Plans",
        description:
          "Browse the SaaS plans table, inspect pricing, filter by currency/status, and view assigned tenant counts",
        enabled: true,
      },
      {
        key: "create_plan",
        label: "Create New Plan",
        description:
          "Access the plan creation wizard, configure initial tier name, billing cadence, and trial periods",
        enabled: true,
      },
      {
        key: "edit_plan",
        label: "Edit Plan & Limits",
        description:
          "Modify plan pricing, update hard provision limits (max locations, admin seats), and change effective dates",
        enabled: true,
      },
      {
        key: "manage_modules",
        label: "Configure Included Modules",
        description: "Select or deselect platform modules bundled into a plan",
        enabled: true,
      },
      {
        key: "publish_plan",
        label: "Publish Plan Impact",
        description:
          "Preview live tenant impact modal and request/publish plan drafts into active production tiers",
        enabled: true,
      },
      {
        key: "duplicate_plan",
        label: "Duplicate Plan",
        description: "Clone an existing published or retired plan into a new working draft version",
        enabled: true,
      },
      {
        key: "retire_plan",
        label: "Retire / Archive Plan",
        description:
          "Mark plans as Retired to grandfather existing tenants while restricting new organization assignments",
        enabled: true,
      },
    ],
  },
  {
    id: "feat_commercial_packs",
    name: "Commercials: Feature Packs",
    category: "commercials",
    pagePath: "/commercials/packs",
    description:
      "Control access to commercial feature add-on packs, pricing configuration, tier plan compatibility, and live pack publishing.",
    accessLevel: "full",
    actions: [
      {
        key: "view_packs",
        label: "View Feature Packs",
        description:
          "Browse the commercial feature packs table, inspect pricing and assigned tenant counts",
        enabled: true,
      },
      {
        key: "create_pack",
        label: "Create Feature Pack",
        description:
          "Configure new add-on feature packs with pricing and compatible tier plans",
        enabled: true,
      },
      {
        key: "edit_pack",
        label: "Edit Feature Pack",
        description:
          "Modify pack pricing, extended limits, effective dates, and plan compatibility",
        enabled: true,
      },
      {
        key: "publish_pack",
        label: "Publish Feature Pack",
        description: "Publish draft feature packs into active production availability",
        enabled: true,
      },
      {
        key: "retire_pack",
        label: "Retire Feature Pack",
        description: "Archive or retire feature packs to restrict new tenant adoption",
        enabled: true,
      },
      {
        key: "delete_pack",
        label: "Delete Draft Pack",
        description: "Permanently delete draft feature packs not assigned to any organizations",
        enabled: true,
      },
    ],
  },
  {
    id: "feat_commercial_addons",
    name: "Commercials: Optional Add-ons",
    category: "commercials",
    pagePath: "/commercials/add-ons",
    description:
      "Control access to SaaS optional commercial add-ons, pricing configuration, tier plan compatibility, and add-on publishing/retiring.",
    accessLevel: "full",
    actions: [
      {
        key: "view_addons",
        label: "View Optional Add-ons",
        description:
          "Browse commercial add-ons catalog, inspect pricing, category, compatibility and active allocations",
        enabled: true,
      },
      {
        key: "create_addon",
        label: "Create Add-on",
        description:
          "Access add-on creation editor, configure metadata, pricing, cadence and purchase limits",
        enabled: true,
      },
      {
        key: "edit_addon",
        label: "Edit Add-on",
        description:
          "Modify add-on metadata, description, pricing, purchase quantity limits and plan compatibility",
        enabled: true,
      },
      {
        key: "publish_addon",
        label: "Publish Add-on",
        description: "Publish draft add-on options into active catalog for tenant provisioning",
        enabled: true,
      },
      {
        key: "retire_addon",
        label: "Retire Add-on",
        description: "Retire active add-ons to restrict new purchases while preserving existing client subscriptions",
        enabled: true,
      },
      {
        key: "delete_addon",
        label: "Delete Draft Add-on",
        description: "Permanently remove unpublished draft add-ons not assigned to any organizations",
        enabled: true,
      },
    ],
  },
  {
    id: "feat_users_mgmt",
    name: "Access Control: Users Management",
    category: "access_control",
    pagePath: "/users",
    description:
      "Administer system accounts, invite staff members, and modify panel assignments and statuses.",
    accessLevel: "full",
    actions: [
      {
        key: "view_users",
        label: "View Staff Accounts",
        description: "Browse user accounts, panels, and activity states",
        enabled: true,
      },
      {
        key: "invite_user",
        label: "Invite / Add Staff",
        description: "Issue onboarding invitations for new staff users",
        enabled: true,
      },
      {
        key: "edit_user",
        label: "Edit Roles & Panels",
        description: "Change user access panel, role tier, and active status",
        enabled: true,
      },
      {
        key: "delete_user",
        label: "Delete Staff Account",
        description: "Revoke credentials and delete system accounts",
        enabled: true,
      },
    ],
  },
  {
    id: "feat_roles_templates",
    name: "Access Control: Roles & Permissions (Security Policies)",
    category: "access_control",
    pagePath: "/access-control/roles",
    description:
      "Configure role definitions, customize security policies, and manage feature-by-feature permission matrices.",
    accessLevel: "full",
    actions: [
      {
        key: "view_roles",
        label: "View Roles & Permissions",
        description: "Inspect role profiles, permissions matrix, and security policies",
        enabled: true,
      },
      {
        key: "create_roles",
        label: "Create Roles & Permissions",
        description: "Configure new role templates with customized permission matrix",
        enabled: true,
      },
      {
        key: "edit_roles",
        label: "Edit Roles & Permissions",
        description:
          "Modify authorization parameters, permissions matrix, and actions on existing roles",
        enabled: true,
      },
      {
        key: "delete_roles",
        label: "Delete Roles & Permissions",
        description: "Permanently delete custom role definitions",
        enabled: true,
      },
    ],
  },

  {
    id: "feat_audit_compliance",
    name: "Audit Trails & Security Logs",
    category: "system",
    pagePath: "/access-control/audit-logs",
    description:
      "Review platform audit logs, security authentication events, and data modification timestamps.",
    accessLevel: "full",
    actions: [
      {
        key: "view_audit_logs",
        label: "View Audit Trail",
        description: "Inspect immutable audit logs of platform operations",
        enabled: true,
      },
      {
        key: "export_audit_logs",
        label: "Export Audit Reports",
        description: "Export compliance logs for compliance verification",
        enabled: true,
      },
    ],
  },
];

// Helper to generate blank default features for new role
export const getBlankFeatures = (): FeaturePermission[] => {
  return DEFAULT_FEATURES.map((feat) => ({
    ...feat,
    accessLevel: "none",
    actions: feat.actions.map((act) => ({ ...act, enabled: false })),
  }));
};

export const RolesPermissionsPage: React.FC = () => {
  const { can } = usePermissions();

  const canCreateRole = can("feat_roles_templates", "create_roles");
  const canEditRole = can("feat_roles_templates", "edit_roles");
  const canDeleteRole = can("feat_roles_templates", "delete_roles");

  // Route-based title detection (Defaults to Security Policies)

  let locationPath = "";
  try {
    const location = useLocation();
    locationPath = location.pathname;
  } catch {
    locationPath = "";
  }
  const isRolesRoute =
    locationPath.endsWith("/roles") || locationPath.endsWith("/roles-permissions");
  const pageTitle = isRolesRoute ? "Security Templates" : "Security Policies";
  const pageSubtitle = isRolesRoute
    ? "Set default permissions templates or customize them to build custom roles"
    : "Configure feature-by-feature access controls, review actions, and security policies";

  // State
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<string>("All Scopes");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Modal State
  const [activeModalType, setActiveModalType] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedRole, setSelectedRole] = useState<SecurityRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<SecurityRole | null>(null);

  const isModalReadOnly =
    activeModalType === "view" ||
    (activeModalType === "edit" && !canEditRole) ||
    (activeModalType === "create" && !canCreateRole);

  // Modal Form State
  const [formName, setFormName] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formKeyManualOverride, setFormKeyManualOverride] = useState(false);
  const [formScope, setFormScope] = useState("One organization");
  const [formTemplate, setFormTemplate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formFeatures, setFormFeatures] = useState<FeaturePermission[]>(getBlankFeatures());
  const [activeCategoryTab, setActiveCategoryTab] = useState<FeatureCategory>("all");

  // Notification Toast state
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showNotification = (message: string, type: "success" | "info" | "error" = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 3500);
  };

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await roleApi.getAll();
      setRoles(res.roles || []);
    } catch (err: any) {
      showNotification(err.message || "Failed to load roles", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Convert role name to snake_case key
  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!formKeyManualOverride) {
      setFormKey(generateKey(val));
    }
  };

  // Copy permissions from template
  const handleCopyFromTemplate = (templateKey: string) => {
    setFormTemplate(templateKey);
    const found = roles.find((r) => r.key === templateKey || r.id === templateKey);
    if (found) {
      setFormFeatures(JSON.parse(JSON.stringify(found.features)));
      setFormScope(found.scope);
      if (!formDescription) {
        setFormDescription(found.description);
      }
      showNotification(`Copied permissions and scope from "${found.name}"`, "info");
    }
  };

  // Change Access Level for a whole Feature
  const handleFeatureAccessLevelChange = (featureId: string, level: AccessLevel) => {
    setFormFeatures((prev) =>
      prev.map((feat) => {
        if (feat.id === featureId) {
          const updatedActions = feat.actions.map((act) => {
            if (level === "none") return { ...act, enabled: false };
            if (level === "read_only") {
              // Enable view-oriented actions, disable mutation actions
              return {
                ...act,
                enabled: act.key.startsWith("view_"),
              };
            }
            // Full access: enable all
            return { ...act, enabled: true };
          });
          return {
            ...feat,
            accessLevel: level,
            actions: updatedActions,
          };
        }
        return feat;
      })
    );
  };

  // Toggle individual action switch
  const handleToggleAction = (featureId: string, actionKey: string) => {
    setFormFeatures((prev) =>
      prev.map((feat) => {
        if (feat.id === featureId) {
          const updatedActions = feat.actions.map((act) => {
            if (act.key === actionKey) {
              return { ...act, enabled: !act.enabled };
            }
            return act;
          });

          // Re-calculate access level
          const anyEnabled = updatedActions.some((a) => a.enabled);
          const allEnabled = updatedActions.every((a) => a.enabled);
          const onlyViewEnabled =
            updatedActions.filter((a) => a.key.startsWith("view_")).every((a) => a.enabled) &&
            !updatedActions.some((a) => !a.key.startsWith("view_") && a.enabled);

          let newLevel: AccessLevel = "none";
          if (allEnabled) newLevel = "full";
          else if (onlyViewEnabled) newLevel = "read_only";
          else if (anyEnabled) newLevel = "full";

          return {
            ...feat,
            accessLevel: newLevel,
            actions: updatedActions,
          };
        }
        return feat;
      })
    );
  };

  // Quick Presets
  const applyPresetAll = (level: AccessLevel) => {
    setFormFeatures((prev) =>
      prev.map((feat) => ({
        ...feat,
        accessLevel: level,
        actions: feat.actions.map((act) => ({
          ...act,
          enabled:
            level === "none" ? false : level === "read_only" ? act.key.startsWith("view_") : true,
        })),
      }))
    );
    showNotification(
      level === "full"
        ? "Applied Full Access across all features"
        : level === "read_only"
          ? "Applied Read-Only access across all features"
          : "Cleared all permissions",
      "info"
    );
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    if (!canCreateRole) {
      showNotification("You do not have permission to create roles", "error");
      return;
    }
    setSelectedRole(null);
    setFormName("");
    setFormKey("");
    setFormKeyManualOverride(false);
    setFormScope("One organization");
    setFormTemplate("");
    setFormDescription("");
    setFormIsActive(true);
    setFormFeatures(getBlankFeatures());
    setActiveCategoryTab("all");
    setActiveModalType("create");
  };

  // Open Edit Modal
  const handleOpenEditModal = (role: SecurityRole) => {
    if (!canEditRole) {
      showNotification("You do not have permission to edit roles", "error");
      return;
    }
    setSelectedRole(role);
    setFormName(role.name);
    setFormKey(role.key);
    setFormKeyManualOverride(true);
    setFormScope(role.scope);
    setFormTemplate("");
    setFormDescription(role.description);
    setFormIsActive(role.status === "Active");
    setFormFeatures(JSON.parse(JSON.stringify(role.features)));
    setActiveCategoryTab("all");
    setActiveModalType("edit");
  };

  // Open View Modal
  const handleOpenViewModal = (role: SecurityRole) => {
    setSelectedRole(role);
    setFormName(role.name);
    setFormKey(role.key);
    setFormScope(role.scope);
    setFormDescription(role.description);
    setFormIsActive(role.status === "Active");
    setFormFeatures(JSON.parse(JSON.stringify(role.features)));
    setActiveCategoryTab("all");
    setActiveModalType("view");
  };

  // Save Role
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModalType === "edit" && !canEditRole) {
      showNotification("You do not have permission to edit roles", "error");
      return;
    }
    if (activeModalType === "create" && !canCreateRole) {
      showNotification("You do not have permission to create roles", "error");
      return;
    }
    if (!formName.trim()) {
      showNotification("Role name is required", "error");
      return;
    }

    // Check duplicate role name (case-insensitive)
    const duplicateRole = roles.find(
      (r) =>
        r.name.trim().toLowerCase() === formName.trim().toLowerCase() &&
        (activeModalType === "create" || r.id !== selectedRole?.id)
    );
    if (duplicateRole) {
      showNotification(`A security role with name "${formName.trim()}" already exists`, "error");
      return;
    }

    const finalKey = formKey.trim() || generateKey(formName);
    setIsSubmitting(true);

    try {
      if (activeModalType === "edit" && selectedRole) {
        const res = await roleApi.update(selectedRole.id, {
          name: formName.trim(),
          scope: formScope,
          description: formDescription.trim(),
          isActive: formIsActive,
          features: formFeatures,
        });

        setRoles((prev) => prev.map((r) => (r.id === selectedRole.id ? res.role : r)));
        showNotification(`Role "${formName}" updated successfully!`, "success");
      } else {
        const res = await roleApi.create({
          name: formName.trim(),
          key: finalKey,
          scope: formScope,
          description: formDescription.trim(),
          isActive: formIsActive,
          features: formFeatures,
        });

        setRoles((prev) => [...prev, res.role]);
        showNotification(`New custom role "${formName}" created!`, "success");
      }

      setActiveModalType(null);
    } catch (err: any) {
      showNotification(err.message || "Failed to save role", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Role
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    if (!canDeleteRole) {
      showNotification("You do not have permission to delete roles", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      await roleApi.delete(roleToDelete.id);
      setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
      showNotification(`Role "${roleToDelete.name}" deleted successfully.`, "info");
      setRoleToDelete(null);
    } catch (err: any) {
      showNotification(err.message || "Failed to delete role", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered features inside modal based on category tab
  const displayedFeatures = useMemo(() => {
    if (activeCategoryTab === "all") return formFeatures;
    return formFeatures.filter((f) => f.category === activeCategoryTab);
  }, [formFeatures, activeCategoryTab]);

  // Compute total active permissions for form
  const totalEnabledPermissions = useMemo(() => {
    return formFeatures.reduce(
      (acc, feat) => acc + feat.actions.filter((a) => a.enabled).length,
      0
    );
  }, [formFeatures]);

  const maxPermissions = useMemo(() => {
    return formFeatures.reduce((acc, feat) => acc + feat.actions.length, 0);
  }, [formFeatures]);

  // Filtered roles in grid
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        role.name.toLowerCase().includes(q) ||
        role.key.toLowerCase().includes(q) ||
        role.scope.toLowerCase().includes(q) ||
        role.description.toLowerCase().includes(q);

      const matchesScope =
        selectedScopeFilter === "All Scopes" ||
        role.scope.toLowerCase() === selectedScopeFilter.toLowerCase();

      return matchesSearch && matchesScope;
    });
  }, [roles, searchQuery, selectedScopeFilter]);

  return (
    <div className="w-full space-y-6 pb-14 font-sans antialiased text-slate-800">
      {/* Toast Notification */}
      {notification.show && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-top-3 duration-200 bg-white border-slate-200">
          {notification.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          )}
          {notification.type === "info" && (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          )}
          {notification.type === "error" && (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span className="text-slate-800 font-medium">{notification.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. TOP HEADER & CONTROLS                                       */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">{pageSubtitle}</p>
        </div>

        {/* Right Search, Filter & + Create Role Button */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative min-w-[200px] w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roles or permissions..."
              className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium placeholder:text-slate-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-2"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>{selectedScopeFilter === "All Scopes" ? "Filter" : selectedScopeFilter}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                {[
                  "All Scopes",
                  "Platform",
                  "Assigned platform scope",
                  "One organization",
                  "Assigned locations",
                  "Specific outlet",
                ].map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => {
                      setSelectedScopeFilter(scope);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors ${
                      selectedScopeFilter === scope
                        ? "font-bold text-[#3E8800] bg-[#EEF9E8]/50"
                        : "text-slate-700"
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* + Create Role Button */}
          {can("feat_roles_templates", "create_roles") && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-[#65D000] hover:bg-[#57B500] text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Role</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SECURITY TEMPLATES GRID                                     */}
      {/* ============================================================== */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#65D000] mb-2" />
          <span className="text-xs font-semibold text-slate-600">Loading security roles...</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="py-16 px-6 bg-white border border-slate-200/80 rounded-2xl text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No security roles found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No roles have been created yet. Define your first custom role template with granular
            page and action permissions.
          </p>
          {canCreateRole && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-[#65D000] hover:bg-[#57B500] rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create First Role</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRoles.map((role) => {
            // Calculate quick stats for this role
            const enabledCount = role.features.reduce(
              (acc, feat) => acc + feat.actions.filter((a) => a.enabled).length,
              0
            );
            const reviewFeature = role.features.find((f) => f.id === "feat_partner_review");
            const locationsFeature = role.features.find((f) => f.id === "feat_partner_locations");

            return (
              <div
                key={role.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header: Title + Active Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-slate-900 shrink-0 stroke-[2.2]" />
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        {role.name}
                      </h2>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        role.status === "Active"
                          ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {role.status}
                    </span>
                  </div>

                  {/* Scope Row */}
                  <div className="mt-2.5 text-xs flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium">Scope</span>
                    <span className="text-slate-700 font-semibold">{role.scope}</span>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs text-slate-500 font-normal leading-relaxed">
                    {role.description}
                  </p>

                  {/* Project-Specific Highlights: Locations & Review Actions */}
                  <div className="mt-4 p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl space-y-2">
                    {/* Locations Table Access */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        Locations Table:
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md ${
                          locationsFeature?.accessLevel === "full"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : locationsFeature?.accessLevel === "read_only"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {locationsFeature?.accessLevel === "full"
                          ? "Full Access (Add/Edit)"
                          : locationsFeature?.accessLevel === "read_only"
                            ? "Read-Only"
                            : "No Access"}
                      </span>
                    </div>

                    {/* Review Actions Permitted */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-slate-400" />
                        Review Actions:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {reviewFeature?.actions.some((a) => a.enabled) ? (
                          reviewFeature.actions
                            .filter((a) => a.enabled)
                            .map((a) => (
                              <span
                                key={a.key}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700"
                              >
                                {a.key === "approve_partner"
                                  ? "Approve"
                                  : a.key === "reject_partner"
                                    ? "Reject"
                                    : a.key === "mark_under_review"
                                      ? "Review"
                                      : "Delete"}
                              </span>
                            ))
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider and Footer */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{role.assignedText}</span>
                    </div>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400">
                      {enabledCount} of 22 privileges
                    </span>
                  </div>

                  {/* Actions: View, Edit, & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenViewModal(role)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="View permissions"
                    >
                      <Eye className="w-4 h-4 stroke-[2]" />
                    </button>
                    {can("feat_roles_templates", "edit_roles") && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(role)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit role"
                      >
                        <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    )}
                    {!role.isSystem && can("feat_roles_templates", "delete_roles") && (
                      <button
                        type="button"
                        onClick={() => setRoleToDelete(role)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete custom role"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 3. Add Custom Role Dashed Tile */}
          {canCreateRole && (
            <div
              onClick={handleOpenCreateModal}
              className="border-2 border-dashed border-slate-200 hover:border-slate-300 bg-white/40 hover:bg-slate-50/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group min-h-[240px]"
            >
              <div className="w-10 h-10 rounded-full border-2 border-slate-300 text-slate-400 group-hover:text-slate-600 group-hover:border-slate-400 flex items-center justify-center transition-colors mb-3">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 group-hover:text-slate-900 transition-colors">
                Add Custom Role
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                Customize page accessibility, review actions, and locations table controls
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODAL: FEATURE-BY-FEATURE ROLE BUILDER (Create, View, Edit) */}
      {/* ============================================================== */}
      {activeModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {activeModalType === "create"
                      ? "New custom role"
                      : activeModalType === "edit"
                        ? "Edit custom role"
                        : `${formName} (Role Permissions)`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeModalType === "view"
                      ? "Inspect page access rights, locations table permissions, and review actions"
                      : "Configure feature accessibility, review lifecycle actions, and operational rights"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalType(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Row 1: Role name, Key, Scope, Template copy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Role name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Role name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isModalReadOnly}
                    placeholder="e.g. Regional Supervisor"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-900 placeholder:text-slate-400 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Key */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Key *</label>
                  <input
                    type="text"
                    required
                    disabled={isModalReadOnly}
                    placeholder="regional_supervisor"
                    value={formKey}
                    onChange={(e) => {
                      setFormKey(e.target.value);
                      setFormKeyManualOverride(true);
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-mono font-medium text-slate-700 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Scope */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Operational Scope
                  </label>
                  <div className="relative">
                    <select
                      disabled={isModalReadOnly}
                      value={formScope}
                      onChange={(e) => setFormScope(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 cursor-pointer appearance-none pr-7 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <option value="Platform">Platform</option>
                      <option value="Assigned platform scope">Assigned platform scope</option>
                      <option value="One organization">One organization</option>
                      <option value="Assigned locations">Assigned locations</option>
                      <option value="Specific outlet">Specific outlet</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Copy from template */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Copy from template
                  </label>
                  <div className="relative">
                    <select
                      disabled={isModalReadOnly}
                      value={formTemplate}
                      onChange={(e) => handleCopyFromTemplate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium text-slate-800 cursor-pointer appearance-none pr-7 disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a default role...</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.key}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 2: Description & Active Status Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Description
                  </label>
                  <input
                    type="text"
                    disabled={isModalReadOnly}
                    placeholder="Specify staff access duties and operational privileges..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="flex items-center gap-2.5 shrink-0 sm:pt-4">
                  <ToggleSwitch
                    size="md"
                    checked={formIsActive}
                    disabled={isModalReadOnly}
                    onChange={(val) => setFormIsActive(val)}
                    ariaLabel="Toggle active role status"
                  />
                  <span className="text-xs font-bold text-slate-800 select-none">
                    Role is active and assignable
                  </span>
                </div>
              </div>

              {/* ========================================================== */}
              {/* FEATURE-BY-FEATURE PERMISSION MATRIX SECTION              */}
              {/* ========================================================== */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        Feature & Page Permissions Matrix
                      </h4>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {totalEnabledPermissions} of {maxPermissions} active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure page access levels (None / Read-Only / Full Control) and granular
                      action rights
                    </p>
                  </div>

                  {/* Preset Shortcuts */}
                  {!isModalReadOnly && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => applyPresetAll("full")}
                        className="text-[11px] font-semibold text-[#3E8800] bg-[#EEF9E8] px-2.5 py-1 rounded-lg hover:bg-[#DEF5CE] transition-colors cursor-pointer"
                      >
                        Full Access All
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetAll("read_only")}
                        className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Read-Only All
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetAll("none")}
                        className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>

                {/* Category Filter Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                  {/* Category Select Filter */}
                  <div className="flex items-center gap-2.5">
                    <label
                      htmlFor="feature-category-filter"
                      className="text-xs font-bold text-slate-700 shrink-0"
                    >
                      Module Category:
                    </label>
                    <div className="relative">
                      <select
                        id="feature-category-filter"
                        value={activeCategoryTab}
                        onChange={(e) => setActiveCategoryTab(e.target.value as FeatureCategory)}
                        aria-label="Filter features by module category"
                        className="appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#65D000]/30 cursor-pointer"
                      >
                        <option value="all">All Pages & Features ({formFeatures.length})</option>
                        <option value="commercials">
                          Commercials & Plans (
                          {formFeatures.filter((f) => f.category === "commercials").length})
                        </option>
                        <option value="partner_detail">
                          Partner Detail & Review (
                          {formFeatures.filter((f) => f.category === "partner_detail").length})
                        </option>
                        <option value="organization">
                          Organization 360 (
                          {formFeatures.filter((f) => f.category === "organization").length})
                        </option>
                        <option value="access_control">
                          Users & Access Control (
                          {formFeatures.filter((f) => f.category === "access_control").length})
                        </option>
                        <option value="system">
                          Audit & System Logs (
                          {formFeatures.filter((f) => f.category === "system").length})
                        </option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Showing count indicator */}
                  <div className="text-[11px] text-slate-500 font-medium">
                    Showing{" "}
                    <span className="font-bold text-slate-800">{displayedFeatures.length}</span>{" "}
                    {displayedFeatures.length === 1 ? "feature module" : "feature modules"}
                  </div>
                </div>

                {/* Feature Cards List */}
                <div className="space-y-3.5">
                  {displayedFeatures.map((feat) => {
                    const isNone = feat.accessLevel === "none";
                    return (
                      <div
                        key={feat.id}
                        className={`rounded-2xl border transition-all ${
                          isNone
                            ? "bg-slate-50/50 border-slate-200/60 opacity-80"
                            : "bg-white border-slate-200/90 shadow-2xs"
                        }`}
                      >
                        {/* Feature Header Row */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                                {feat.name}
                              </h5>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {feat.pagePath}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 font-normal">
                              {feat.description}
                            </p>
                          </div>

                          {/* Segmented Control for Access Level */}
                          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 shrink-0 self-start sm:self-auto">
                            {(["none", "read_only", "full"] as AccessLevel[]).map((lvl) => {
                              const isSelected = feat.accessLevel === lvl;
                              return (
                                <button
                                  key={lvl}
                                  type="button"
                                  disabled={isModalReadOnly}
                                  onClick={() => handleFeatureAccessLevelChange(feat.id, lvl)}
                                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed ${
                                    isSelected
                                      ? lvl === "full"
                                        ? "bg-[#65D000] text-white shadow-2xs"
                                        : lvl === "read_only"
                                          ? "bg-amber-500 text-white shadow-2xs"
                                          : "bg-slate-700 text-white shadow-2xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  {lvl === "none"
                                    ? "No Access"
                                    : lvl === "read_only"
                                      ? "Read-Only"
                                      : "Full Control"}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Granular Action Switches Grid */}
                        <div className="p-4 bg-white/70 rounded-b-2xl">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                            Specific Action Permissions
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {feat.actions.map((act) => (
                              <div
                                key={act.key}
                                className={`flex items-start justify-between gap-2.5 p-2.5 rounded-xl border transition-colors ${
                                  act.enabled
                                    ? "bg-emerald-50/40 border-emerald-200/80"
                                    : "bg-slate-50/60 border-slate-200/60"
                                }`}
                              >
                                <div className="space-y-0.5 pr-2">
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{act.label}</span>
                                    {act.enabled && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#65D000]" />
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-normal leading-tight">
                                    {act.description}
                                  </div>
                                </div>

                                <ToggleSwitch
                                  size="sm"
                                  checked={act.enabled}
                                  disabled={isModalReadOnly}
                                  onChange={() => handleToggleAction(feat.id, act.key)}
                                  ariaLabel={`${feat.name} - ${act.label}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hidden submit trigger */}
              <button type="submit" className="hidden" />
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] sm:text-xs text-slate-500 font-normal">
                Permissions take effect instantly across all designated users assigned to this role.
              </span>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModalType(null)}
                  className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  {isModalReadOnly ? "Close" : "Cancel"}
                </button>

                {!isModalReadOnly ? (
                  <button
                    type="button"
                    onClick={handleSaveRole}
                    disabled={isSubmitting}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#65D000] hover:bg-[#57B500] rounded-xl transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-60 inline-flex items-center gap-1.5"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSubmitting ? "Saving..." : "Save Role"}</span>
                  </button>
                ) : canEditRole && selectedRole ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRole) {
                        handleOpenEditModal(selectedRole);
                      }
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Edit This Role
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL: DELETE CONFIRMATION FOR CUSTOM ROLES                 */}
      {/* ============================================================== */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Custom Role</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs text-rose-800 font-medium">
              Are you sure you want to permanently delete role{" "}
              <span className="font-bold">{roleToDelete.name}</span> (key: {roleToDelete.key})?
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteRole}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Trash2 className="w-4 h-4" />
                <span>{isSubmitting ? "Deleting..." : "Delete Role"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissionsPage;
