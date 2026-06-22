import type { GoogleUser, TakenSlot, TimeSlot } from "./types";

const STORAGE_TOKEN_KEY = "booking-app-token";
const STORAGE_USER_KEY = "booking-app-user";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
export const DEFAULT_CALENDAR_PLACEHOLDER = "your-email@group.calendar.google.com";

export const slotFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function decodeJwtPayload<T>(token: string): T | null {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as T;
  } catch {
    return null;
  }
}

export function formatDateTimeLocalValue(date: Date) {
  const offsetInMs = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - offsetInMs);
  return localDate.toISOString().slice(0, 16);
}

export function parseDateInput(value: string) {
  return new Date(value);
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

export function getStoredSession(): { token: string; user: GoogleUser | null } {
  if (typeof window === "undefined") {
    return { token: "", user: null };
  }

  const token = localStorage.getItem(STORAGE_TOKEN_KEY) || "";
  const userRaw = localStorage.getItem(STORAGE_USER_KEY);

  if (!token || !userRaw) {
    return { token: "", user: null };
  }

  try {
    const user = JSON.parse(userRaw) as GoogleUser;
    if (!user.email) {
      return { token: "", user: null };
    }

    return { token, user };
  } catch {
    return { token: "", user: null };
  }
}

export function persistSession(token: string, user: GoogleUser) {
  localStorage.setItem(STORAGE_TOKEN_KEY, token);
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}

export function getInitialBookingRange() {
  const now = new Date();
  return {
    startsAt: formatDateTimeLocalValue(now),
    endsAt: formatDateTimeLocalValue(new Date(now.getTime() + 60 * 60 * 1000)),
  };
}

export function computeAvailableSlots(takenSlots: TakenSlot[]): TimeSlot[] {
  const now = new Date();
  const slots: TimeSlot[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    for (let hour = 9; hour <= 17; hour += 1) {
      const slotStart = new Date(now);
      slotStart.setHours(hour, 0, 0, 0);
      slotStart.setDate(now.getDate() + dayOffset);

      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

      if (slotStart <= now) {
        continue;
      }

      const isTaken = takenSlots.some((takenSlot) => {
        const takenStart = new Date(takenSlot.startsAt);
        const takenEnd = new Date(takenSlot.endsAt);
        return overlaps(slotStart, slotEnd, takenStart, takenEnd);
      });

      if (!isTaken) {
        slots.push({
          startsAt: slotStart,
          endsAt: slotEnd,
        });
      }
    }
  }

  return slots;
}
