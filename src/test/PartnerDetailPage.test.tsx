import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PartnerDetailPage } from "../pages/PartnerDetailPage";

describe("PartnerDetailPage Component", () => {
  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <PartnerDetailPage />
      </MemoryRouter>
    );
  };

  it("renders page header and partner summary correctly", () => {
    renderComponent();

    // Check main title
    expect(screen.getByRole("heading", { name: /Partner Detail/i })).toBeInTheDocument();

    // Check partner summary details
    expect(screen.getByText("Proviyaa Global")).toBeInTheDocument();
    expect(screen.getByText("PRT-2048")).toBeInTheDocument();
    expect(screen.getAllByText("Main Restaurant").length).toBeGreaterThanOrEqual(1);
  });

  it("renders onboarding progress and required steps", () => {
    renderComponent();

    expect(screen.getByText("Onboarding Progress")).toBeInTheDocument();
    expect(screen.getByText("Become Partner")).toBeInTheDocument();
    expect(screen.getByText("Review & Submit")).toBeInTheDocument();
  });

  it("renders review lifecycle action buttons", () => {
    renderComponent();

    expect(screen.getByRole("button", { name: /^Approve$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Reject$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Mark under review$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Show\/Create password$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Delete Partner$/i })).toBeInTheDocument();
  });

  it("renders location management table with search and Add New Location button", () => {
    renderComponent();

    expect(screen.getByRole("heading", { name: /Location Management/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add New Location/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search locations or codes.../i)).toBeInTheDocument();

    // Check preloaded locations
    expect(screen.getByText("ANN-MAIN")).toBeInTheDocument();
    expect(screen.getByText("Cloud Kitchen North")).toBeInTheDocument();
  });

  it("filters locations dynamically when typing in search input", () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Search locations or codes.../i);

    // Search for North
    fireEvent.change(searchInput, { target: { value: "North" } });
    expect(screen.getByText("Cloud Kitchen North")).toBeInTheDocument();
    expect(screen.queryByText("ANN-MAIN")).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("ANN-MAIN")).toBeInTheDocument();
  });

  it("opens Add New Location modal when clicking Add New Location", () => {
    renderComponent();

    const addButton = screen.getByRole("button", { name: /Add New Location/i });
    fireEvent.click(addButton);

    expect(screen.getByText("Create Location")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Indiranagar Flagship Outlet/i)).toBeInTheDocument();
  });
});
