import { render, screen } from "@testing-library/react";
import { beforeEach, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useStore } from "@/store";
import { owner, parent, child, sibling } from "@/test/clinicFixtures";
import { DebtorsPage } from "./DebtorsPage";
beforeEach(() =>
  useStore.setState({
    currentUser: owner,
    parents: [parent],
    children: [child, sibling],
    parentAccounts: { parent: { parentId: "parent", balance: 0, debt: 75000 } },
    accountsError: null,
  }),
);
it("shows one debtor per family and links to the parent wallet", () => {
  render(
    <MemoryRouter>
      <DebtorsPage />
    </MemoryRouter>,
  );
  expect(
    screen.getAllByRole("heading", { name: parent.fullName }),
  ).toHaveLength(1);
  expect(screen.getByText(/Birinchi bola, Ikkinchi bola/)).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Balans to‘ldirish/ }),
  ).toHaveAttribute(
    "href",
    "/dashboard/super-admin/cash?tab=payments&parentId=parent",
  );
});
it("does not claim zero debt when the account failed to load", () => {
  useStore.setState({ parentAccounts: {}, accountsError: "Hisob yuklanmadi" });
  render(
    <MemoryRouter>
      <DebtorsPage />
    </MemoryRouter>,
  );
  expect(screen.getByRole("alert")).toHaveTextContent("Hisob yuklanmadi");
  expect(screen.queryByText("Qarzdorlik yo‘q.")).not.toBeInTheDocument();
});
it("parent cannot see another family debt or enter a payment", () => {
  useStore.setState({
    currentUser: parent,
    parents: [parent, { ...parent, id: "foreign", fullName: "Boshqa oila" }],
    parentAccounts: {
      foreign: { parentId: "foreign", balance: 0, debt: 100000 },
      parent: { parentId: "parent", balance: 0, debt: 0 },
    },
  });
  render(
    <MemoryRouter>
      <DebtorsPage />
    </MemoryRouter>,
  );
  expect(screen.queryByText("Boshqa oila")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /Balans to‘ldirish/ }),
  ).not.toBeInTheDocument();
});
