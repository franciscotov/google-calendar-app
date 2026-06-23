import type { Booking, TakenSlot } from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3001";

type ApiErrorBody = {
  message?: string | string[];
};

async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = (await response.json()) as ApiErrorBody;
      if (Array.isArray(errorBody.message)) {
        message = errorBody.message.join(". ");
      } else if (typeof errorBody.message === "string") {
        message = errorBody.message;
      }
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export async function registerUser(email: string, name?: string) {
  return apiRequest<{ accessToken: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
}

export async function loginUser(email: string) {
  return apiRequest<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getBookings(accessToken: string) {
  return apiRequest<Booking[]>("/bookings", { method: "GET" }, accessToken);
}

export async function getTakenSlots(accessToken: string) {
  return apiRequest<TakenSlot[]>("/bookings/taken", { method: "GET" }, accessToken);
}

export async function getConnectedCalendar(accessToken: string) {
  return apiRequest<{ user: { googleCalendarId: string | null } }>(
    "/bookings/calendar",
    { method: "GET" },
    accessToken,
  );
}

export async function createBooking(
  accessToken: string,
  payload: { title: string; startsAt: string; endsAt: string },
  googleAccessToken?: string,
) {
  return apiRequest<Booking>(
    "/bookings",
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: googleAccessToken
        ? {
            "x-google-access-token": googleAccessToken,
          }
        : undefined,
    },
    accessToken,
  );
}

export async function cancelBooking(accessToken: string, bookingId: string) {
  return apiRequest<{ ok: boolean }>(
    `/bookings/${bookingId}`,
    {
      method: "DELETE",
    },
    accessToken,
  );
}

export async function connectCalendar(accessToken: string, calendarId: string) {
  return apiRequest<{ ok: boolean; user: { googleCalendarId: string } }>(
    "/bookings/calendar/connect",
    {
      method: "PATCH",
      body: JSON.stringify({ calendarId }),
    },
    accessToken,
  );
}
