import { render, screen } from "@testing-library/react";
import { beforeEach, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useStore } from "@/store";
import { parent, child, sibling } from "@/test/clinicFixtures";
import { ParentDashboard } from "./ParentDashboard";
beforeEach(() =>
  useStore.setState({
    currentUser: parent,
    children: [child, { ...sibling, parentId: "foreign" }],
    appointments: [],
    attendance: [],
    progressNotes: [],
    parentAccounts: {},
  }),
);
it("shows only the parent children and no management or booking controls", () => {
  render(
    <MemoryRouter>
      <ParentDashboard />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { name: child.fullName }),
  ).toBeInTheDocument();
  expect(screen.queryByText(sibling.fullName)).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Keldi|Saqlash|Qabulga/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Xizmatlar va seanslarni/ }),
  ).toHaveAttribute("href", "/dashboard/parent/children?childId=child");
});
it("uses the server wallet and does not derive a fake zero from absent transactions", () => {
  render(
    <MemoryRouter>
      <ParentDashboard />
    </MemoryRouter>,
  );
  expect(screen.getAllByText("Tasdiqlanmagan")).toHaveLength(2);
});
