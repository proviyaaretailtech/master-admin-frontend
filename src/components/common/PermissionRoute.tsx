import React from "react";
import { Outlet } from "react-router-dom";
import { usePermissions } from "../../hooks/use-permissions";
import { AccessDenied } from "./AccessDenied";

export interface PermissionRequirement {
  featureId: string;
  actionKey?: string;
}

interface PermissionRouteProps {
  featureId?: string;
  actionKey?: string;
  anyOf?: PermissionRequirement[];
  featureName?: string;
  children?: React.ReactNode;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  featureId,
  actionKey,
  anyOf,
  featureName,
  children,
}) => {
  const { can } = usePermissions();

  const isAllowed =
    anyOf && anyOf.length > 0
      ? anyOf.some((req) => can(req.featureId, req.actionKey))
      : featureId
      ? can(featureId, actionKey)
      : false;

  if (!isAllowed) {
    return <AccessDenied featureName={featureName} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
