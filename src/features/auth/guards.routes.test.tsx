import { act, render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ForbiddenPage, ProtectedRoute, RoleRedirect } from "./guards";
import { LoginPage } from "./LoginPage";
import { useStore } from "@/store";
import { owner, parent } from "@/test/clinicFixtures";
import type { Specialist } from "@/types";
import { api } from "@/services/api";

const specialist: Specialist = {
  ...owner,
  id: "standalone-specialist",
  role: "SPECIALIST",
  specialization: "Massaj",
};
const originalLogin = useStore.getState().login;

function LoginDestination() {
  const location = useLocation();
  return (
    <div>
      Login destination <output>{location.state?.from?.pathname}</output>
    </div>
  );
}

function renderGuard(initialEntry = "/owner") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
              <div>Owner workspace</div>
            </ProtectedRoute>
          }
        />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/login" element={<LoginDestination />} />
        <Route path="/dashboard/parent" element={<div>Parent workspace</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Workspace access and recovery", () => {
  beforeEach(() => {
    vi.spyOn(api.auth, "logout").mockResolvedValue();
    useStore.setState({
      currentUser: null,
      isAuthenticated: false,
      login: originalLogin,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useStore.setState({
      currentUser: null,
      isAuthenticated: false,
      login: originalLogin,
    });
  });

  it.each(["SUPER_ADMIN", "ADMIN"] as const)(
    "allows %s into the owner workspace",
    (role) => {
      useStore.setState({
        currentUser: { ...owner, role },
        isAuthenticated: true,
      });
      renderGuard();
      expect(screen.getByText("Owner workspace")).toBeInTheDocument();
    },
  );

  it("sends an unauthenticated visitor to login with the original destination", () => {
    renderGuard();
    expect(screen.getByText("Login destination")).toBeInTheDocument();
    expect(screen.getByText("/owner")).toBeInTheDocument();
    expect(screen.queryByText("Owner workspace")).not.toBeInTheDocument();
  });

  it("denies parent owner access and returns the parent to their own workspace", () => {
    useStore.setState({ currentUser: parent, isAuthenticated: true });
    renderGuard();
    expect(
      screen.getByRole("heading", { name: "Ruxsat yo'q" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Dashboardga qaytish" }));
    expect(screen.getByText("Parent workspace")).toBeInTheDocument();
    expect(screen.queryByText("Owner workspace")).not.toBeInTheDocument();
  });

  it.each(["/owner", "/"])(
    "denies a standalone specialist at %s and lets them change accounts",
    (path) => {
      useStore.setState({ currentUser: specialist, isAuthenticated: true });
      renderGuard(path);
      expect(
        screen.getByRole("heading", { name: "Ruxsat yo'q" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Dashboardga qaytish" }),
      ).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: "Boshqa hisob bilan kirish" }),
      );

      expect(screen.getByText("Login destination")).toBeInTheDocument();
      expect(useStore.getState().isAuthenticated).toBe(false);
      expect(useStore.getState().currentUser).toBeNull();
    },
  );

  it.each([
    { label: "standalone specialist", user: specialist },
    { label: "missing user", user: null },
  ])("uses a safe destination after login for $label", async ({ user }) => {
    useStore.setState({
      login: vi.fn(async () => {
        useStore.setState({ currentUser: user, isAuthenticated: true });
        return { success: true };
      }),
    });
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403" element={<div>Access denied destination</div>} />
          <Route
            path="*"
            element={<div>Unexpected workspace destination</div>}
          />
        </Routes>
      </MemoryRouter>,
    );
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Telefon raqami/), {
        target: { value: "+998901234567" },
      });
      fireEvent.change(screen.getByLabelText(/^Parol/, { selector: "input" }), {
        target: { value: "valid-password" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Kirish" }));
    });

    expect(
      await screen.findByText("Access denied destination"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Unexpected workspace destination"),
    ).not.toBeInTheDocument();
  });
});
