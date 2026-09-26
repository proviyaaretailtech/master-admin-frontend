import React from "react";
import { Outlet, Link } from "react-router-dom";

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-6 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-primary"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            ⚡
          </span>
          <span>SupabaseStack</span>
        </Link>
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};
