import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { format } from "date-fns";
import { useStore } from "@/store";
import { api } from "@/services/api";
import {
  owner,
  parent,
  child,
  appointment,
  service,
  workflowContract,
} from "@/test/clinicFixtures";
import { AttendancePage } from "./AttendancePage";
const original = useStore.getState().commitReception;
beforeEach(() => {
  api.workflow.configure(null);
  useStore.setState({
    currentUser: owner,
    children: [child],
    appointments: [{ ...appointment, date: format(new Date(), "yyyy-MM-dd") }],
    services: [service],
    attendance: [],
    serviceAssignments: [],
  });
});
afterEach(() => {
  api.workflow.configure(null);
  useStore.setState({ commitReception: original });
});
it("does not permit a financial attendance action before the atomic backend is connected", () => {
  render(
    <MemoryRouter>
      <AttendancePage />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Qabul va davomat" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Keldi" })).toBeDisabled();
  expect(
    screen.getByText("Vaqt belgilanmagan", { exact: false }),
  ).toBeInTheDocument();
});
it("keeps attendance unchanged on server failure and reuses the request key for retry", async () => {
  api.workflow.configure(workflowContract);
  const commit = vi.fn().mockRejectedValue(new Error("Aloqa uzildi"));
  useStore.setState({ commitReception: commit });
  render(
    <MemoryRouter>
      <AttendancePage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Keldi" }));
  fireEvent.click(screen.getByRole("button", { name: "Tasdiqlash" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Aloqa uzildi");
  fireEvent.click(screen.getByRole("button", { name: "Tasdiqlash" }));
  await waitFor(() => expect(commit).toHaveBeenCalledTimes(2));
  expect(commit.mock.calls[0][3]).toBe(commit.mock.calls[1][3]);
  expect(useStore.getState().attendance).toEqual([]);
});
it("does not expose attendance controls to parents", () => {
  useStore.setState({ currentUser: parent });
  api.workflow.configure(workflowContract);
  render(
    <MemoryRouter>
      <AttendancePage />
    </MemoryRouter>,
  );
  expect(
    screen.queryByRole("button", { name: "Keldi" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Qabul qo‘shish" }),
  ).not.toBeInTheDocument();
});
