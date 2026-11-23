import type { Appointment } from "@/types";

export function normalizeAppointment(raw: any): Appointment {
  if (!raw) return raw;

  // Extract child information
  const childRaw = raw.child;
  let childFullName = "";
  if (childRaw) {
    if (childRaw.fullName) {
      childFullName = childRaw.fullName;
    } else if (childRaw.firstName) {
      childFullName = `${childRaw.firstName} ${childRaw.lastName || ""}`.trim();
    }
  }
  if (!childFullName && raw.childName) {
    childFullName = raw.childName;
  }

  // Extract specialist information
  const specRaw = raw.specialist;
  let specFullName = "";
  if (specRaw) {
    if (specRaw.user?.fullName) {
      specFullName = specRaw.user.fullName;
    } else if (specRaw.fullName) {
      specFullName = specRaw.fullName;
    } else if (specRaw.user?.firstName) {
      specFullName =
        `${specRaw.user.firstName} ${specRaw.user.lastName || ""}`.trim();
    }
  }
  if (!specFullName && raw.specialistName) {
    specFullName = raw.specialistName;
  }

  // Extract service information
  const serviceRaw = raw.service;
  const serviceName = serviceRaw?.name || raw.serviceName || "";

  // Extract date formatted as YYYY-MM-DD
  const rawDate = raw.date || raw.scheduledAt || raw.startTime;
  const dateFormatted = rawDate
    ? typeof rawDate === "string"
      ? rawDate.includes("T")
        ? rawDate.split("T")[0]
        : rawDate.slice(0, 10)
      : new Date(rawDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const formatTimeStr = (val: any, fallback: string) => {
    if (!val) return fallback;
    if (typeof val === "string") {
      if (val.length === 5 && val.includes(":")) return val;
      if (val.includes("T")) {
        const timePart = val.split("T")[1];
        return timePart ? timePart.slice(0, 5) : fallback;
      }
      if (val.length >= 5) return val.slice(0, 5);
    }
    return fallback;
  };

  const startTime = formatTimeStr(raw.startTime, "");
  const endTime = formatTimeStr(raw.endTime, "");

  return {
    id: String(raw.id),
    childId: String(raw.childId || childRaw?.id || ""),
    parentId: String(raw.parentId || childRaw?.parentId || ""),
    specialistId: String(raw.specialistId || specRaw?.id || ""),
    serviceId: String(raw.serviceId || serviceRaw?.id || ""),
    date: dateFormatted,
    startTime,
    endTime,
    status: raw.status || "SCHEDULED",
    notes: raw.notes || raw.comment || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt,
    assignmentId: raw.assignmentId || undefined,
    price: raw.price == null ? undefined : Number(raw.price),
    durationMinutes:
      raw.durationMinutes == null ? undefined : Number(raw.durationMinutes),
    actualArrivalTime: raw.actualArrivalTime || null,
    attendanceStatus: raw.attendanceStatus,
    version: Number.isInteger(raw.version) ? raw.version : undefined,
    // Store relations and resolved names directly on the appointment entity
    child: childRaw
      ? {
          id: String(childRaw.id),
          fullName: childFullName || "Bola",
          firstName: childRaw.firstName,
          lastName: childRaw.lastName,
          dateOfBirth: childRaw.dateOfBirth,
          gender: childRaw.gender,
          parentId: childRaw.parentId,
        }
      : undefined,
    childName: childFullName || undefined,
    specialist: specRaw
      ? {
          id: String(specRaw.id),
          fullName: specFullName || "Mutaxassis",
          specialization: specRaw.specialization,
          phone: specRaw.phone || specRaw.user?.phone,
          user: specRaw.user,
        }
      : undefined,
    specialistName: specFullName || undefined,
    service: serviceRaw
      ? {
          id: String(serviceRaw.id),
          name: serviceName || "Xizmat",
          durationMinutes: Number(serviceRaw.durationMinutes || 45),
          price: Number(serviceRaw.price || 0),
        }
      : undefined,
    serviceName: serviceName || undefined,
  };
}
