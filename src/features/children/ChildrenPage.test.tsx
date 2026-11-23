import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ChildrenPage } from "./ChildrenPage";
import { useStore } from "@/store";
import { owner, parent, child, sibling, service } from "@/test/clinicFixtures";
beforeEach(() =>
  useStore.setState({
    currentUser: owner,
    children: [child, sibling],
    parents: [parent],
    services: [service],
    serviceAssignments: [],
    parentAccounts: {},
    attendance: [],
    appointments: [],
  }),
);
it("opens services directly in the child card", () => {
  render(
    <MemoryRouter initialEntries={["/children?childId=child"]}>
      <ChildrenPage />
    </MemoryRouter>,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Xizmat biriktirish" }),
  ).toBeInTheDocument();
});
it("filters children by their names", () => {
  render(
    <MemoryRouter>
      <ChildrenPage />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Bola ismi bo‘yicha qidirish"), {
    target: { value: "Ikkinchi" },
  });
  expect(
    screen.queryByRole("heading", { name: child.fullName }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: sibling.fullName }),
  ).toBeInTheDocument();
});
it("keeps parent access read-only and hides other families even with a child ID in the URL", () => {
  useStore.setState({
    currentUser: parent,
    children: [child, { ...sibling, parentId: "foreign" }],
  });
  render(
    <MemoryRouter initialEntries={["/children?childId=sibling"]}>
      <ChildrenPage />
    </MemoryRouter>,
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: sibling.fullName }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Bola qo‘shish" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Tahrirlash" }),
  ).not.toBeInTheDocument();
});
