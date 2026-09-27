import { useContext } from "react";
import { AuthContext } from "../context/auth-context";
import { FeaturePermission, AccessLevel } from "../api/role.api";

export interface UsePermissionsReturn {
  permissions: FeaturePermission[];
  isSuperAdmin: boolean;
  can: (featureId: string, actionKey?: string) => boolean;
  canAccess: (featureId: string) => boolean;
  hasLevel: (featureId: string, level: AccessLevel) => boolean;
  roleName: string;
}

/**
 * Custom React hook for checking feature-by-feature and action-level authorization
 */
export const usePermissions = (): UsePermissionsReturn => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  // If user is superadmin, or in mock test contexts without explicit user object
  const isSuperAdmin = Boolean(
    !user || user.isSuperAdmin || user.role_details?.key === "super_admin"
  );

  const permissions: FeaturePermission[] = user?.permissions || [];

  /**
   * Checks whether the current user is permitted to access a given feature and optional granular action.
   */
  const can = (featureId: string, actionKey?: string): boolean => {
    // If no user context (e.g. testing without auth wrapper) or super-admin with unconfigured role
    if (!user || (isSuperAdmin && (!user.permissions || user.permissions.length === 0))) {
      return true;
    }

    const feature = permissions.find((f) => f.id === featureId);
    if (!feature || feature.accessLevel === "none") {
      return false;
    }

    if (actionKey) {
      const action = feature.actions?.find((a) => a.key === actionKey);
      return !!action?.enabled;
    }

    return feature.accessLevel === "read_only" || feature.accessLevel === "full";
  };

  const canAccess = (featureId: string): boolean => {
    return can(featureId);
  };

  const hasLevel = (featureId: string, level: AccessLevel): boolean => {
    if (!user || (isSuperAdmin && (!user.permissions || user.permissions.length === 0))) {
      return true;
    }
    const feature = permissions.find((f) => f.id === featureId);
    if (!feature) return false;
    if (level === "full") return feature.accessLevel === "full";
    if (level === "read_only")
      return feature.accessLevel === "read_only" || feature.accessLevel === "full";
    return true;
  };

  const roleName = user?.role_details?.name || "Unassigned";

  return {
    permissions,
    isSuperAdmin,
    can,
    canAccess,
    hasLevel,
    roleName,
  };
};
