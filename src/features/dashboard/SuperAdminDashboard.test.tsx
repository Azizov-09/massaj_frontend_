import { render, screen } from "@testing-library/react";
import { beforeEach, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useStore } from "@/store";
import { owner, parent, child } from "@/test/clinicFixtures";
import { SuperAdminDashboard } from "./SuperAdminDashboard";
beforeEach(() =>
  useStore.setState({
    currentUser: owner,
    parents: [parent],
    children: [child],
    appointments: [],
    payments: [],
    parentAccounts: {},
    accountsError: null,
  }),
);
it("shows the owner workspace and direct reception and cash links", () => {
  render(
    <MemoryRouter>
      <SuperAdminDashboard />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Dashboard" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Qabul va davomat" }),
  ).toHaveAttribute("href", "/dashboard/super-admin/attendance");
  expect(
    screen.getByRole("link", { name: "Balans to‘ldirish" }),
  ).toHaveAttribute("href", "/dashboard/super-admin/cash");
  expect(screen.queryByText(/mutaxassis faol/)).not.toBeInTheDocument();
});
it("does not fabricate a debt total when family accounts are unavailable", () => {
  render(
    <MemoryRouter>
      <SuperAdminDashboard />
    </MemoryRouter>,
  );
  expect(screen.getByText("Tasdiqlanmagan")).toBeInTheDocument();
});
