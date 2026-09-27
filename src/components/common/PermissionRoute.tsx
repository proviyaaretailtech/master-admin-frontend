import React from "react";
import { Outlet } from "react-router-dom";
import { usePermissions } from "../../hooks/use-permissions";
import { AccessDenied } from "./AccessDenied";

interface PermissionRouteProps {
  featureId: string;
  actionKey?: string;
  featureName?: string;
  children?: React.ReactNode;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  featureId,
  actionKey,
  featureName,
  children,
}) => {
  const { can } = usePermissions();

  const isAllowed = can(featureId, actionKey);

  if (!isAllowed) {
    return <AccessDenied featureName={featureName} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
