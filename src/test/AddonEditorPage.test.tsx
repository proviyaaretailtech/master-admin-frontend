import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AddonEditorPage } from "../pages/AddonEditorPage";
import { addonApi, CommercialAddonItem } from "../api/addon.api";
import { planApi } from "../api/plan.api";
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

vi.mock("../api/plan.api", () => ({
  planApi: {
    getAll: vi.fn(),
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

const mockExistingAddon: CommercialAddonItem = {
  id: "ad-loc-11",
  name: "Additional Location Deployment",
  addon_code: "ad-loc-11",
  description:
    "Permits tenant organizations to provision exactly one additional operational facility or outlet beyond their root entitlement base level.",
  category: "Locations & Logistics",
  status: "Draft",
  version: "v1.2",
  price: 1500,
  currency: "INR",
  cadence: "Monthly",
  unit_label: "location",
  pricing_subtitle: "Per site monthly billing",
  effective_date: "2026-11-01T00:00:00Z",
  min_quantity: 1,
  max_quantity: 5,
  compatible_plans: ["Growth Plan", "Enterprise Suite"],
  billing_sync_status: "Success",
  entitlement_validation_status: "Passed",
  tax_compliance_status: "Pending verification",
  active_units_count: 0,
  assigned_count: 0,
  created_at: "2026-09-30T10:00:00Z",
  updated_at: "2026-09-30T10:00:00Z",
};

const mockPlans = [
  { id: "p1", name: "Growth Plan", version: "v2.1", status: "Published" },
  { id: "p2", name: "Enterprise Suite", version: "v1.4", status: "Published" },
  { id: "p3", name: "Starter Plan", version: "v1.0", status: "Published" },
  { id: "p4", name: "Suit (Copy)", version: "v1.0", status: "Draft" },
];

const renderComponent = (user: any, initialRoute: string = "/commercials/add-ons/new") => {
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
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/commercials/add-ons/new" element={<AddonEditorPage />} />
          <Route path="/commercials/add-ons/:id/edit" element={<AddonEditorPage />} />
          <Route path="/commercials/add-ons" element={<div>Add-ons List View</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe("AddonEditorPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (planApi.getAll as any).mockResolvedValue({
      message: "OK",
      plans: mockPlans,
      total: mockPlans.length,
    });
    (addonApi.getById as any).mockResolvedValue({
      message: "OK",
      addon: mockExistingAddon,
    });
  });

  it("renders editor layout matching media_1790759137875.png with cards and warning banner", async () => {
    renderComponent(mockSuperAdminUser);

    await waitFor(() => {
      expect(screen.getByText("Add-on Metadata & Description")).toBeInTheDocument();
    });

    // Header elements
    expect(screen.getByText("Discard Draft")).toBeInTheDocument();
    expect(screen.getByText("Save Progress")).toBeInTheDocument();
    expect(screen.getByText("Publish Add-on")).toBeInTheDocument();

    // Warning banner
    expect(screen.getByText(/Warning:/)).toBeInTheDocument();

    // Form fields
    expect(screen.getByText("ADD-ON DISPLAY NAME")).toBeInTheDocument();
    expect(screen.getByText("ADD-ON CODE / IDENTIFIER")).toBeInTheDocument();
    expect(screen.getByText("DETAILED DESCRIPTION")).toBeInTheDocument();
    expect(screen.getByText("CATEGORY")).toBeInTheDocument();
    expect(screen.getByText("EFFECTIVE DATE")).toBeInTheDocument();

    // Pricing & Quantity Controls
    expect(screen.getByText("Pricing & Quantity Controls")).toBeInTheDocument();
    expect(screen.getByText("INR PRICE (₹)")).toBeInTheDocument();
    expect(screen.getByText("CADENCE")).toBeInTheDocument();
    expect(screen.getByText("MINIMUM PURCHASE QTY")).toBeInTheDocument();
    expect(screen.getByText("MAXIMUM PURCHASE QTY")).toBeInTheDocument();

    // Plan Compatibility & System Validation
    expect(screen.getByText("Platform Plan Compatibility")).toBeInTheDocument();
    expect(screen.getByText("Growth Plan v2.1")).toBeInTheDocument();
    expect(screen.queryByText("Suit (Copy) v1.0")).not.toBeInTheDocument();
    expect(screen.getByText("System Integration Validation")).toBeInTheDocument();
    expect(screen.getByText(/Billing Engine sync check:/)).toBeInTheDocument();
    expect(screen.getByText(/Entitlement schema structure validation:/)).toBeInTheDocument();
  });

  it("toggles plan compatibility between Fully Compatible and Incompatible on click", async () => {
    renderComponent(mockSuperAdminUser);

    await waitFor(() => {
      expect(screen.getByText("Platform Plan Compatibility")).toBeInTheDocument();
    });

    // Initially Starter Plan is incompatible — use flexible matcher for text split across elements
    expect(
      screen.getByText((content, element) => {
        return (
          element?.tagName === "BUTTON" &&
          (element.textContent ?? "").includes("Incompatible") &&
          (element.textContent ?? "").includes("Base Limit Lock")
        );
      })
    ).toBeInTheDocument();

    // Click Starter Plan row to toggle to compatible
    const starterPlanRow = screen.getByText("Starter Plan v1.0");
    fireEvent.click(starterPlanRow);

    // It now becomes Fully Compatible
    await waitFor(() => {
      const compatibleBadges = screen.getAllByText("Fully Compatible");
      expect(compatibleBadges.length).toBe(3);
    });
  });

  it("handles Save Progress successfully", async () => {
    (addonApi.create as any).mockResolvedValue({
      message: "Created",
      addon: { ...mockExistingAddon, id: "ad-new-123" },
    });

    renderComponent(mockSuperAdminUser);

    await waitFor(() => {
      expect(screen.getByText("Save Progress")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Save Progress"));

    await waitFor(() => {
      expect(addonApi.create).toHaveBeenCalled();
    });
  });

  it("opens Publish modal and publishes the add-on", async () => {
    (addonApi.publish as any).mockResolvedValue({
      message: "Published",
      addon: { ...mockExistingAddon, status: "Published" },
    });

    renderComponent(mockSuperAdminUser, "/commercials/add-ons/ad-loc-11/edit");

    await waitFor(() => {
      expect(screen.getByText("Publish Add-on")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Publish Add-on"));

    // Modal appears
    expect(screen.getByText("Confirm & Publish")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Confirm & Publish"));

    await waitFor(() => {
      expect(addonApi.publish).toHaveBeenCalledWith("ad-loc-11");
    });
  });

  it("opens Discard Draft modal and exits to catalog", async () => {
    renderComponent(mockSuperAdminUser);

    await waitFor(() => {
      expect(screen.getByText("Discard Draft")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Discard Draft"));

    expect(screen.getByText("Discard Draft Changes?")).toBeInTheDocument();
    expect(screen.getByText("Discard & Exit")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Discard & Exit"));

    await waitFor(() => {
      expect(screen.getByText("Add-ons List View")).toBeInTheDocument();
    });
  });
});
