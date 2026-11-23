import { ApiError, type ApiClient } from "./client";
import type {
  Appointment,
  AttendanceRecord,
  ServiceAssignment,
  CreateServiceAssignmentInput,
  ParentAccount,
} from "@/types";
import { normalizeAppointment } from "./appointments";
import { normalizeAttendance } from "./clinical";
import { getAllPages } from "./pagination";
import { normalizeTransaction } from "./finance";

/** Only enable after the backend explicitly supplies this versioned contract.
 * No guessed URLs and no client-side financial fallback are used. */
export interface ClinicWorkflowContract {
  version: 1;
  atomicAttendanceBilling: true;
  familyWallet: true;
  currencyUnit: "UZS";
  assignments: string;
  createAssignment: string;
  extendAssignment: string;
  appointments: string;
  createAppointment: string;
  commitAttendance: string;
  topUp?: string;
  myTransactions?: string;
}

export const WORKFLOW_UNAVAILABLE =
  "Qabul va xizmat biriktirish serverga hali ulanmagan. Ma’lumotlar saqlangani yoki pul yechilgani tasdiqlanmadi.";
const paths = [
  "assignments",
  "createAssignment",
  "extendAssignment",
  "appointments",
  "createAppointment",
  "commitAttendance",
] as const;

export function parseWorkflowContract(
  value: unknown,
): ClinicWorkflowContract | null {
  try {
    const config = typeof value === "string" ? JSON.parse(value) : value;
    if (!config || typeof config !== "object") return null;
    const c = config as Record<string, unknown>;
    if (
      c.version !== 1 ||
      c.atomicAttendanceBilling !== true ||
      c.familyWallet !== true ||
      c.currencyUnit !== "UZS"
    )
      return null;
    for (const key of [
      ...paths,
      ...(c.topUp ? ["topUp"] : []),
      ...(c.myTransactions ? ["myTransactions"] : []),
    ]) {
      if (
        typeof c[key] !== "string" ||
        !/^\/(?!\/)[^\s#]*$/.test(c[key] as string)
      )
        return null;
    }
    if (
      !(c.assignments as string).includes("{childId}") ||
      !(c.extendAssignment as string).includes("{assignmentId}") ||
      !(c.commitAttendance as string).includes("{appointmentId}")
    )
      return null;
    return c as unknown as ClinicWorkflowContract;
  } catch {
    return null;
  }
}

function assignment(raw: any): ServiceAssignment {
  if (
    !raw?.id ||
    !raw.childId ||
    !raw.parentId ||
    !raw.serviceId ||
    !Number.isInteger(raw.totalSessions) ||
    raw.totalSessions < 1 ||
    !Number.isInteger(raw.completedSessions) ||
    raw.completedSessions < 0 ||
    raw.completedSessions > raw.totalSessions ||
    !Number.isFinite(raw.price) ||
    raw.price < 0 ||
    !Number.isFinite(raw.durationMinutes) ||
    raw.durationMinutes <= 0 ||
    !Array.isArray(raw.workingDays) ||
    !raw.workingDays.length ||
    raw.workingDays.some(
      (d: unknown) => !Number.isInteger(d) || Number(d) < 0 || Number(d) > 6,
    ) ||
    !raw.startDate ||
    !["ACTIVE", "COMPLETED", "ARCHIVED"].includes(raw.status)
  ) {
    throw new ApiError(
      "Server xizmat biriktirish uchun to‘liq ma’lumot qaytarmadi. Qayta yuklab tekshiring.",
      502,
    );
  }
  return { ...raw, startTime: raw.startTime || null };
}

function appointment(raw: any): Appointment {
  if (
    !raw?.id ||
    !raw.childId ||
    !raw.parentId ||
    !raw.serviceId ||
    !raw.assignmentId ||
    !Number.isInteger(raw.version) ||
    raw.version < 0 ||
    !Number.isSafeInteger(raw.price) ||
    raw.price < 0 ||
    !Number.isFinite(raw.durationMinutes) ||
    raw.durationMinutes <= 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)
  )
    throw new ApiError(
      "Qabul ma’lumotlari serverdan to‘liq tasdiqlanmadi.",
      502,
    );
  return normalizeAppointment(raw);
}

export interface AttendanceCommit {
  appointment: Appointment;
  attendance: AttendanceRecord;
  assignment: ServiceAssignment;
  parentAccount: ParentAccount;
}

export class ClinicWorkflowApi {
  private contract = parseWorkflowContract(
    (import.meta as any).env?.VITE_CLINIC_WORKFLOW_CONTRACT,
  );
  constructor(private client: ApiClient) {}
  configure(value: unknown) {
    this.contract = parseWorkflowContract(value);
  }
  get enabled() {
    return Boolean(this.contract);
  }
  get familyTopUpEnabled() {
    return Boolean(this.contract?.topUp);
  }
  get parentLedgerEnabled() {
    return Boolean(this.contract?.myTransactions);
  }
  private route(key: keyof ClinicWorkflowContract, id?: string): string {
    const path = this.contract?.[key];
    if (typeof path !== "string") throw new ApiError(WORKFLOW_UNAVAILABLE, 501);
    return path.replace(
      /\{(?:childId|assignmentId|appointmentId)\}/g,
      encodeURIComponent(id || ""),
    );
  }
  async getAssignments(childId: string): Promise<ServiceAssignment[]> {
    const result: any = await this.client.get(
      this.route("assignments", childId),
    );
    const list = Array.isArray(result) ? result : result?.data;
    if (!Array.isArray(list))
      throw new ApiError("Xizmatlar ro‘yxati serverdan to‘liq kelmadi.", 502);
    const items = list.map(assignment);
    if (items.some((item) => item.childId !== childId))
      throw new ApiError("Boshqa bolaning xizmati qaytarildi.", 502);
    return items;
  }
  async createAssignment(
    data: CreateServiceAssignmentInput,
    idempotencyKey: string,
  ) {
    if (
      !data.childId ||
      !data.serviceId ||
      !Number.isInteger(data.totalSessions) ||
      data.totalSessions < 1 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.startDate) ||
      !data.workingDays.length ||
      data.workingDays.some((d) => !Number.isInteger(d) || d < 0 || d > 6) ||
      (data.startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.startTime))
    )
      throw new ApiError("Biriktirish ma’lumotlarini tekshiring.", 422);
    const result: any = await this.client.post(this.route("createAssignment"), {
      ...data,
      startTime: data.startTime || null,
      idempotencyKey,
    });
    return assignment(result?.data || result);
  }
  async extendAssignment(
    id: string,
    additionalSessions: number,
    idempotencyKey: string,
  ) {
    if (!Number.isInteger(additionalSessions) || additionalSessions < 1)
      throw new ApiError("Seanslar soni musbat butun son bo‘lishi kerak.", 422);
    const result: any = await this.client.post(
      this.route("extendAssignment", id),
      { additionalSessions, idempotencyKey },
    );
    return assignment(result?.data || result);
  }
  async getAppointments(
    params?: Record<string, unknown>,
  ): Promise<Appointment[]> {
    return getAllPages(
      this.client,
      this.route("appointments"),
      params,
      appointment,
    );
  }
  async createAppointment(
    data: Record<string, unknown>,
    idempotencyKey: string,
  ): Promise<Appointment> {
    const result: any = await this.client.post(
      this.route("createAppointment"),
      { ...data, idempotencyKey },
    );
    const item = result?.data || result;
    if (!item?.id || !item?.assignmentId)
      throw new ApiError("Qabul serverda to‘liq tasdiqlanmadi.", 502);
    if (
      item.childId !== data.childId ||
      item.assignmentId !== data.assignmentId
    )
      throw new ApiError("Server boshqa qabulni qaytardi.", 502);
    return appointment(item);
  }
  async commitAttendance(
    appointmentId: string,
    data: {
      status: "PRESENT" | "ABSENT";
      note?: string;
      expectedVersion: number;
      idempotencyKey: string;
    },
  ): Promise<AttendanceCommit> {
    const result: any = await this.client.post(
      this.route("commitAttendance", appointmentId),
      data,
    );
    const body = result?.data || result;
    const account = body?.parentAccount;
    if (
      body?.appointment?.id !== appointmentId ||
      !Number.isInteger(body.appointment.version) ||
      body.appointment.version <= data.expectedVersion ||
      body.appointment.attendanceStatus !== data.status ||
      !body?.attendance?.id ||
      body?.attendance?.appointmentId !== appointmentId ||
      body?.attendance?.status !== data.status ||
      (data.status === "PRESENT" &&
        !Number.isFinite(Date.parse(body.appointment.actualArrivalTime))) ||
      !account?.parentId ||
      !Number.isFinite(account.balance) ||
      !Number.isFinite(account.debt) ||
      account.balance < 0 ||
      account.debt < 0 ||
      (account.balance > 0 && account.debt > 0)
    ) {
      throw new ApiError(
        "Davomat va hisoblash javobi to‘liq emas. Qayta yuklab tekshiring; qayta bosishda bir xil amal kaliti ishlatiladi.",
        502,
      );
    }
    const linked = assignment(body.assignment);
    if (
      linked.parentId !== account.parentId ||
      linked.parentId !== body.appointment.parentId ||
      linked.id !== body.appointment.assignmentId ||
      linked.childId !== body.appointment.childId ||
      linked.serviceId !== body.appointment.serviceId ||
      body.attendance.childId !== linked.childId
    )
      throw new ApiError("Davomatning hisob bilan bog‘lanishi noto‘g‘ri.", 502);
    return {
      appointment: appointment(body.appointment),
      attendance: normalizeAttendance(body.attendance),
      assignment: linked,
      parentAccount: account,
    };
  }
  topUp(data: Record<string, unknown>) {
    return this.client.post(this.route("topUp"), data);
  }
  async getMyTransactions(parentId: string) {
    const rows = await getAllPages(
      this.client,
      this.route("myTransactions"),
      undefined,
      normalizeTransaction,
    );
    if (rows.some((row) => row.parentId !== parentId))
      throw new ApiError("Hisob egasi tasdiqlanmadi.", 502);
    return rows;
  }
}
