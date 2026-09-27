import React from "react";
import { RolesPermissionsPage } from "./RolesPermissionsPage";

/**
 * SecurityPoliciesPage
 * Feature-by-feature and page-by-page access control and security policies matrix.
 * Alias component pointing to RolesPermissionsPage with Security Policies semantics.
 */
export const SecurityPoliciesPage: React.FC = () => {
  return <RolesPermissionsPage />;
};

export default SecurityPoliciesPage;
