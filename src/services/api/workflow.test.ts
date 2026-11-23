import { afterEach, describe, expect, it, vi } from "vitest";
import { ClinicWorkflowApi, parseWorkflowContract } from "./workflow";
import type { ApiClient } from "./client";
import { getAllPages } from "./pagination";
import { normalizeAccount } from "./account";
import {
  assignment,
  appointment,
  workflowContract,
} from "@/test/clinicFixtures";
import { api } from "./index";
import { useStore } from "@/store";
import { owner, parent } from "@/test/clinicFixtures";

afterEach(() => {
  vi.restoreAllMocks();
  api.workflow.configure(null);
});
describe("Backend workflow boundary", () => {
  it("makes no request when the server contract is unavailable", async () => {
    const post = vi.fn();
    const client = new ClinicWorkflowApi({ post } as unknown as ApiClient);
    await expect(
      client.createAssignment(
        {
          childId: "child",
          serviceId: "service",
          totalSessions: 10,
          startDate: "2026-01-01",
          workingDays: [1],
          startTime: null,
        },
        "request-key",
      ),
    ).rejects.toMatchObject({ status: 501 });
    expect(post).not.toHaveBeenCalled();
  });
  it("rejects unsafe or incomplete contract declarations", () => {
    expect(
      parseWorkflowContract({
        ...workflowContract,
        atomicAttendanceBilling: false,
      }),
    ).toBeNull();
    expect(
      parseWorkflowContract({
        ...workflowContract,
        assignments: "https://elsewhere/children/{childId}",
      }),
    ).toBeNull();
    expect(
      parseWorkflowContract({
        ...workflowContract,
        commitAttendance: "/attendance",
      }),
    ).toBeNull();
  });
  it("sends a blank optional time as null and retains the retry key", async () => {
    const post = vi.fn().mockResolvedValue(assignment);
    const client = new ClinicWorkflowApi({ post } as unknown as ApiClient);
    client.configure(workflowContract);
    const data = {
      childId: "child",
      serviceId: "service",
      totalSessions: 10,
      startDate: "2026-01-01",
      workingDays: [1, 3, 5],
      startTime: "",
    };
    await client.createAssignment(data, "same-request");
    expect(post).toHaveBeenCalledWith("/test/assignments", {
      ...data,
      startTime: null,
      idempotencyKey: "same-request",
    });
  });
  it("rejects partial accounting responses", async () => {
    const client = new ClinicWorkflowApi({
      post: vi
        .fn()
        .mockResolvedValue({
          attendance: { appointmentId: "appointment", status: "PRESENT" },
        }),
    } as unknown as ApiClient);
    client.configure(workflowContract);
    await expect(
      client.commitAttendance("appointment", {
        status: "PRESENT",
        expectedVersion: 0,
        idempotencyKey: "key",
      }),
    ).rejects.toMatchObject({ status: 502 });
  });
  it("does not mutate attendance, counts or wallet after a rejected request", async () => {
    api.workflow.configure(workflowContract);
    vi.spyOn(api.workflow, "commitAttendance").mockRejectedValue(
      new Error("Network failure"),
    );
    const accounts = {
      parent: { parentId: "parent", balance: 200000, debt: 0 },
    };
    useStore.setState({
      currentUser: owner,
      appointments: [appointment],
      attendance: [],
      serviceAssignments: [assignment],
      parentAccounts: accounts,
    });
    await expect(
      useStore
        .getState()
        .commitReception("appointment", "PRESENT", "", "retry-key"),
    ).rejects.toThrow("Network failure");
    expect(useStore.getState().attendance).toEqual([]);
    expect(useStore.getState().serviceAssignments[0].completedSessions).toBe(0);
    expect(useStore.getState().parentAccounts).toEqual(accounts);
  });
  it("updates related state only from the complete server result without adding a local charge", async () => {
    api.workflow.configure(workflowContract);
    const record = {
      id: "attendance",
      childId: "child",
      appointmentId: "appointment",
      specialistId: "specialist",
      status: "PRESENT" as const,
      date: appointment.date,
      createdAt: "2026-01-01",
    };
    vi.spyOn(api.workflow, "commitAttendance").mockResolvedValue({
      appointment: { ...appointment, attendanceStatus: "PRESENT", version: 1 },
      attendance: record,
      assignment: { ...assignment, completedSessions: 1 },
      parentAccount: { parentId: "parent", balance: 100000, debt: 0 },
    });
    vi.spyOn(api.finance, "getTransactions").mockResolvedValue([]);
    useStore.setState({
      currentUser: owner,
      appointments: [appointment],
      attendance: [],
      serviceAssignments: [assignment],
      transactions: [],
    });
    await useStore
      .getState()
      .commitReception("appointment", "PRESENT", "", "key");
    expect(useStore.getState().serviceAssignments[0].completedSessions).toBe(1);
    expect(useStore.getState().parentAccounts.parent.balance).toBe(100000);
    expect(useStore.getState().transactions).toEqual([]);
  });
  it("rejects parent write attempts before sending them to the server", async () => {
    const post = vi.spyOn(api.workflow, "commitAttendance");
    useStore.setState({ currentUser: parent, appointments: [appointment] });
    await expect(
      useStore.getState().commitReception("appointment", "PRESENT", "", "key"),
    ).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
  });
});
describe("Complete ledger and family accounts", () => {
  it("loads every page, including records after the first 100", async () => {
    const get = vi
      .fn()
      .mockImplementation((_path, params) => ({
        data:
          params.page === 1
            ? Array.from({ length: 100 }, (_, i) => ({ id: String(i) }))
            : [{ id: "100" }],
        meta: { total: 101 },
      }));
    const rows = await getAllPages(
      { get } as unknown as ApiClient,
      "/transactions",
      undefined,
      (x) => x,
    );
    expect(rows).toHaveLength(101);
    expect(get.mock.calls[1][1].page).toBe(2);
  });
  it("rejects servers that repeat a full page rather than silently showing a partial balance", async () => {
    const get = vi.fn().mockResolvedValue([{ id: "1" }, { id: "2" }]);
    await expect(
      getAllPages(
        { get } as unknown as ApiClient,
        "/transactions",
        { limit: 2 },
        (x) => x,
      ),
    ).rejects.toMatchObject({ status: 502 });
  });
  it("accepts a real zero and rejects absent or contradictory accounts", () => {
    expect(normalizeAccount({ balance: 0, debt: 0 })).toEqual({
      balance: 0,
      debt: 0,
    });
    expect(() => normalizeAccount(undefined)).toThrow();
    expect(() => normalizeAccount({ balance: 10, debt: 20 })).toThrow();
  });
});
