import React from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, Layers } from "lucide-react";

export const DomainPlaceholderPage: React.FC = () => {
  const location = useLocation();

  // Extract title from path: e.g. /access-control -> Access Control
  const domainName =
    location.pathname
      .replace("/", "")
      .replace("-", " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "System Domain";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#65D000]">
          SYSTEM DOMAIN MODULE
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          {domainName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
          This system module is configured in the Proviyaa Master Admin architecture and will be
          populated with operational widgets.
        </p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center shadow-2xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#65D000]/10 text-[#65D000] flex items-center justify-center mx-auto">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">{domainName} Workspace</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Ready for data models, API integrations, and specialized store controls.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Onboarding Pipeline</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
