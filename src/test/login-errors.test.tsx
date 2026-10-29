import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, AuthContextType } from "../context/auth-context";
import { LoginPage } from "../pages/LoginPage";
import { ApiError } from "../lib/api-error";

// "Incorrect password" must only appear when the server rejected the credentials, never for a
// server or network failure (the deployed API once crashed and every visitor was told their
// password was wrong, with a made-up attempt counter).
const renderWith = (error: Error) => {
  const value: AuthContextType = {
    user: null,
    token: null,
    loading: false,
    notice: null,
    login: vi.fn(async () => ({ error })),
    logout: vi.fn(async () => {}),
    logoutEverywhere: vi.fn(async () => {}),
  };
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "a@x.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-pass" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
};

describe("Login page errors", () => {
  it("a 401 from the server says the email or password is wrong", async () => {
    renderWith(new ApiError("Invalid email or password", { status: 401 }));
    expect(await screen.findByText("Incorrect email or password.")).toBeInTheDocument();
    expect(screen.queryByText(/attempts? remaining/)).not.toBeInTheDocument();
  });
  it("a server failure does not blame the password", async () => {
    renderWith(new ApiError("Request failed with status code 500", { status: 500 }));
    expect(
      await screen.findByText(/unexpected error|server ran into a problem/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Incorrect email or password.")).not.toBeInTheDocument();
    expect(screen.queryByText(/attempts? remaining/)).not.toBeInTheDocument();
  });
});
