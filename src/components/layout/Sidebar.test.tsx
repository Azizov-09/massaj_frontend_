import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useStore } from "@/store";
import { owner } from "@/test/clinicFixtures";
import { Sidebar } from "./Sidebar";
it("gives the owner exactly the agreed nine navigation sections", () => {
  useStore.setState({
    currentUser: owner,
    notifications: [],
    sidebarCollapsed: false,
  });
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
  const links = screen
    .getAllByRole("link")
    .filter((link) =>
      link.getAttribute("href")?.startsWith("/dashboard/super-admin"),
    );
  expect(links.map((link) => link.textContent)).toEqual([
    "Dashboard",
    "Ota-onalar",
    "Bolalar",
    "Qabul va davomat",
    "Xizmatlar",
    "Kassa",
    "Qarzdorlar",
    "Hisobotlar",
    "Sozlamalar",
  ]);
});
