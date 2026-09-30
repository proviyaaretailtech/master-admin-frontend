import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CommercialAddonsPage } from "../pages/CommercialAddonsPage";
import { addonApi, CommercialAddonItem } from "../api/addon.api";
import { AuthContext } from "../context/auth-context";

vi.mock("../api/addon.api", () => ({
  addonApi: {
    getAll: vi.fn(),
    getCategories: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    publish: vi.fn(),
    retire: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockSuperAdminUser = {
  id: "u-superadmin",
  first_name: "Super",
  last_name: "Admin",
  email: "superadmin@proviyaa.com",
  isSuperAdmin: true,
  role_details: {
    id: "r-superadmin",
    name: "Super Administrator",
    key: "super_admin",
  },
  permissions: [],
};

const mockReadOnlyUser = {
  id: "u-readonly",
  first_name: "Auditor",
  last_name: "Viewer",
  email: "auditor@proviyaa.com",
  isSuperAdmin: false,
  role_details: {
    id: "r-auditor",
    name: "Auditor",
    key: "auditor",
  },
  permissions: [
    {
      id: "feat_commercial_addons",
      name: "Commercial Optional Add-ons",
      category: "commercial",
      accessLevel: "read_only" as const,
      actions: [
        {
          key: "view_addons",
          name: "View Optional Add-ons",
          description: "View add-ons list and details",
          enabled: true,
        },
        {
          key: "create_addon",
          name: "Create Add-on",
          description: "Create new commercial add-ons",
          enabled: false,
        },
        {
          key: "edit_addon",
          name: "Edit Add-on",
          description: "Edit existing add-on attributes",
          enabled: false,
        },
        {
          key: "publish_addon",
          name: "Publish Add-on",
          description: "Publish draft add-ons to active catalog",
          enabled: false,
        },
        {
          key: "retire_addon",
          name: "Retire Add-on",
          description: "Retire active add-ons from future assignments",
          enabled: false,
        },
        {
          key: "delete_addon",
          name: "Delete Draft Add-on",
          description: "Delete draft add-ons",
          enabled: false,
        },
      ],
    },
  ],
};

const mockCreateOnlyUser = {
  id: "u-creator",
  first_name: "Creator",
  last_name: "Staff",
  email: "creator@proviyaa.com",
  isSuperAdmin: false,
  role_details: {
    id: "r-creator",
    name: "Creator",
    key: "creator",
  },
  permissions: [
    {
      id: "feat_commercial_addons",
      name: "Commercial Optional Add-ons",
      category: "commercial",
      accessLevel: "full" as const,
      actions: [
        {
          key: "view_addons",
          name: "View Optional Add-ons",
          description: "View add-ons list and details",
          enabled: true,
        },
        {
          key: "create_addon",
          name: "Create Add-on",
          description: "Create new commercial add-ons",
          enabled: true,
        },
        {
          key: "edit_addon",
          name: "Edit Add-on",
          description: "Edit existing add-on attributes",
          enabled: false,
        },
        {
          key: "publish_addon",
          name: "Publish Add-on",
          description: "Publish draft add-ons to active catalog",
          enabled: false,
        },
        {
          key: "retire_addon",
          name: "Retire Add-on",
          description: "Retire active add-ons",
          enabled: false,
        },
        {
          key: "delete_addon",
          name: "Delete Draft Add-on",
          description: "Delete draft add-ons",
          enabled: false,
        },
      ],
    },
  ],
};

const mockAddons: CommercialAddonItem[] = [
  {
    id: "ad-1",
    name: "Additional Location",
    addon_code: "ad-loc-11",
    description: "Permits tenant organizations to provision additional location",
    category: "Infrastructure",
    status: "Published",
    version: "v1.2",
    price: 999,
    currency: "INR",
    cadence: "Monthly",
    unit_label: "location",
    pricing_subtitle: "Per site monthly billing",
    effective_date: "2026-11-01T00:00:00Z",
    min_quantity: 1,
    max_quantity: 5,
    compatible_plans: ["Starter Plan", "Growth Plan"],
    billing_sync_status: "Success",
    entitlement_validation_status: "Passed",
    tax_compliance_status: "Pending verification",
    active_units_count: 312,
    assigned_count: 140,
    created_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-09-30T10:00:00Z",
  },
  {
    id: "ad-2",
    name: "Extra Admins Bundle",
    addon_code: "ad-usr-bundle",
    description: "Allocates blocks of 5 administrator seats",
    category: "Seats quota",
    status: "Published",
    version: "v1.0",
    price: 499,
    currency: "INR",
    cadence: "Monthly",
    unit_label: "5 users",
    pricing_subtitle: "Seat block allocation",
    effective_date: "2026-11-01T00:00:00Z",
    min_quantity: 1,
    max_quantity: 10,
    compatible_plans: ["ALL"],
    billing_sync_status: "Success",
    entitlement_validation_status: "Passed",
    tax_compliance_status: "Passed",
    active_units_count: 48,
    assigned_count: 24,
    created_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-09-30T10:00:00Z",
  },
  {
    id: "ad-3",
    name: "API Access Plus",
    addon_code: "ad-api-advanced",
    description: "Enables developer API endpoints",
    category: "Developer toolkit",
    status: "Draft",
    version: "v1.0",
    price: 1999,
    currency: "INR",
    cadence: "Monthly",
    unit_label: "month",
    pricing_subtitle: "Flat tenant rate",
    effective_date: null,
    min_quantity: 1,
    max_quantity: 1,
    compatible_plans: ["Growth", "Enterprise Suite"],
    billing_sync_status: "Success",
    entitlement_validation_status: "Passed",
    tax_compliance_status: "Pending verification",
    active_units_count: 0,
    assigned_count: 0,
    created_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-09-30T10:00:00Z",
  },
];

const renderComponent = (user: any) => {
  const authValue: any = {
    user,
    token: "mock-token",
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: Boolean(user),
    isLoading: false,
    refreshUser: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter>
        <CommercialAddonsPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe("CommercialAddonsPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (addonApi.getAll as any).mockResolvedValue({
      message: "OK",
      addons: mockAddons,
      total: mockAddons.length,
    });
    (addonApi.getCategories as any).mockResolvedValue({
      message: "OK",
      categories: ["Infrastructure", "Seats quota", "Developer toolkit"],
    });
  });

  describe("Super Admin Access", () => {
    it("renders page header and Create Add-on Option button for superadmin", async () => {
      renderComponent(mockSuperAdminUser);

      await waitFor(() => {
        expect(screen.getByText("SaaS Optional Add-ons")).toBeInTheDocument();
      });

      expect(screen.getByText("Create Add-on Option")).toBeInTheDocument();
      expect(screen.getByText("Additional Location")).toBeInTheDocument();
      expect(screen.getByText("ID: ad-loc-11")).toBeInTheDocument();
      expect(screen.getByText("312 locations active")).toBeInTheDocument();
      expect(screen.getByText("48 5 users active")).toBeInTheDocument();
      expect(screen.getByText("0 active accounts")).toBeInTheDocument();
    });

    it("displays full action buttons: Edit, Retire, Edit Draft, Publish", async () => {
      renderComponent(mockSuperAdminUser);

      await waitFor(() => {
        expect(screen.getByText("Additional Location")).toBeInTheDocument();
      });

      // Published addon actions
      expect(screen.getAllByText("Edit").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Retire").length).toBeGreaterThan(0);

      // Draft addon actions
      expect(screen.getByText("Edit Draft")).toBeInTheDocument();
      expect(screen.getByText("Publish")).toBeInTheDocument();
    });

    it("opens in-app Retire Modal and handles confirmation without native dialogs", async () => {
      (addonApi.retire as any).mockResolvedValue({
        message: "Retired",
        addon: { ...mockAddons[0], status: "Retired" },
      });

      renderComponent(mockSuperAdminUser);

      await waitFor(() => {
        expect(screen.getByText("Additional Location")).toBeInTheDocument();
      });

      // Click Retire on first published addon
      fireEvent.click(screen.getAllByText("Retire")[0]);

      // In-app modal appears
      expect(screen.getByText("Retire Commercial Add-on")).toBeInTheDocument();
      expect(screen.getByText("Confirm & Retire")).toBeInTheDocument();

      // Click Confirm & Retire
      fireEvent.click(screen.getByText("Confirm & Retire"));

      await waitFor(() => {
        expect(addonApi.retire).toHaveBeenCalledWith("ad-1");
      });
    });

    it("opens in-app Publish Modal and handles confirmation", async () => {
      (addonApi.publish as any).mockResolvedValue({
        message: "Published",
        addon: { ...mockAddons[2], status: "Published" },
      });

      renderComponent(mockSuperAdminUser);

      await waitFor(() => {
        expect(screen.getByText("API Access Plus")).toBeInTheDocument();
      });

      // Click Publish on Draft addon
      fireEvent.click(screen.getByText("Publish"));

      // In-app modal appears
      expect(screen.getByText("Publish Commercial Add-on")).toBeInTheDocument();
      expect(screen.getByText("Confirm & Publish")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Confirm & Publish"));

      await waitFor(() => {
        expect(addonApi.publish).toHaveBeenCalledWith("ad-3");
      });
    });
  });

  describe("Non-Superadmin Access Control", () => {
    it("read-only user can view catalog but CANNOT see Create, Edit, Publish, or Retire buttons", async () => {
      renderComponent(mockReadOnlyUser);

      await waitFor(() => {
        expect(screen.getByText("SaaS Optional Add-ons")).toBeInTheDocument();
      });

      expect(screen.getByText("Additional Location")).toBeInTheDocument();
      expect(screen.queryByText("Create Add-on Option")).not.toBeInTheDocument();
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
      expect(screen.queryByText("Edit Draft")).not.toBeInTheDocument();
      expect(screen.queryByText("Publish")).not.toBeInTheDocument();
      expect(screen.queryByText("Retire")).not.toBeInTheDocument();
    });

    it("user with only create_addon permission can see Create button but not Edit, Publish, or Retire", async () => {
      renderComponent(mockCreateOnlyUser);

      await waitFor(() => {
        expect(screen.getByText("SaaS Optional Add-ons")).toBeInTheDocument();
      });

      expect(screen.getByText("Create Add-on Option")).toBeInTheDocument();
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
      expect(screen.queryByText("Edit Draft")).not.toBeInTheDocument();
      expect(screen.queryByText("Publish")).not.toBeInTheDocument();
      expect(screen.queryByText("Retire")).not.toBeInTheDocument();
    });
  });

  describe("Category Filter and Empty State", () => {
    it("displays category filter dropdown and triggers filter change", async () => {
      renderComponent(mockSuperAdminUser);

      await waitFor(() => {
        expect(screen.getByText(/Category:/)).toBeInTheDocument();
      });

      const categoryBtn = screen.getByRole("button", { name: /Category:/i });
      fireEvent.click(categoryBtn);

      const infraOption = await screen.findByRole("button", { name: "Infrastructure" });
      fireEvent.click(infraOption);

      await waitFor(() => {
        expect(addonApi.getAll).toHaveBeenCalledWith({
          category: "Infrastructure",
        });
      });
    });

    it("displays empty state when no add-ons exist in database", async () => {
      (addonApi.getAll as any).mockResolvedValue({
        message: "OK",
        addons: [],
        total: 0,
      });

      renderComponent(mockSuperAdminUser);

      await waitFor(() => {
        expect(screen.getByText("No commercial add-ons found")).toBeInTheDocument();
      });
    });
  });
});
