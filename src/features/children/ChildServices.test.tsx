import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { useStore } from "@/store";
import { api } from "@/services/api";
import {
  child,
  owner,
  service,
  assignment,
  workflowContract,
} from "@/test/clinicFixtures";
import { ChildServices } from "./ChildServices";
beforeEach(() => {
  api.workflow.configure(workflowContract);
  useStore.setState({
    currentUser: owner,
    services: [service],
    serviceAssignments: [],
    assignmentsLoading: false,
    assignmentsError: null,
  });
  vi.spyOn(api.workflow, "getAssignments").mockResolvedValue([]);
});
afterEach(() => {
  vi.restoreAllMocks();
  api.workflow.configure(null);
});
it("sends optional time as null and preserves the form after a rejected assignment", async () => {
  const create = vi
    .spyOn(api.workflow, "createAssignment")
    .mockRejectedValue(new Error("Biriktirish saqlanmadi"));
  render(<ChildServices child={child} canManage />);
  fireEvent.click(screen.getByRole("button", { name: "Xizmat biriktirish" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Xizmat" }), {
    target: { value: service.id },
  });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Seanslar soni" }), {
    target: { value: "7" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Saqlash" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Biriktirish saqlanmadi",
  );
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      childId: child.id,
      serviceId: service.id,
      totalSessions: 7,
      startTime: null,
    }),
    expect.any(String),
  );
  expect(screen.getByRole("spinbutton", { name: "Seanslar soni" })).toHaveValue(
    7,
  );
});
it("shows independent service counts to a parent without assignment controls", async () => {
  vi.mocked(api.workflow.getAssignments).mockResolvedValue([
    assignment,
    {
      ...assignment,
      id: "second",
      serviceName: "Mashqlar",
      totalSessions: 5,
      completedSessions: 2,
    },
  ]);
  render(<ChildServices child={child} canManage={false} />);
  await waitFor(() => expect(screen.getByText("Mashqlar")).toBeInTheDocument());
  expect(screen.getByText("0/10")).toBeInTheDocument();
  expect(screen.getByText("2/5")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Xizmat biriktirish" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Seans qo‘shish" }),
  ).not.toBeInTheDocument();
});
