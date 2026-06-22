import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  cancelBooking,
  connectCalendar,
  createBooking,
  getBookings,
  getConnectedCalendar,
  getTakenSlots,
  loginUser,
  registerUser,
} from "../_lib/api";
import type { Booking, GoogleUser, TakenSlot } from "../_lib/types";
import { clearSession, getStoredSession, parseDateInput, persistSession } from "../_lib/utils";
import type { RootState } from "./store";

type DashboardData = {
  bookings: Booking[];
  takenSlots: TakenSlot[];
  connectedCalendarId: string;
  calendarIdInput: string;
};

type SessionPayload = {
  token: string;
  user: GoogleUser;
  dashboard: DashboardData;
};

type ThunkConfig = {
  state: RootState;
  rejectValue: string;
};

async function loadDashboardData(token: string, fallbackEmail?: string): Promise<DashboardData> {
  const [bookings, takenSlots, calendarData] = await Promise.all([
    getBookings(token),
    getTakenSlots(token),
    getConnectedCalendar(token),
  ]);

  const connectedCalendarId = calendarData.user.googleCalendarId || "";

  return {
    bookings,
    takenSlots,
    connectedCalendarId,
    calendarIdInput: connectedCalendarId || fallbackEmail || "",
  };
}

function getRequiredAuth(state: RootState) {
  const { accessToken, user } = state.auth;

  if (!accessToken || !user) {
    throw new Error("Please sign in first.");
  }

  return { accessToken, user };
}

export const restoreSession = createAsyncThunk<SessionPayload | null, void, ThunkConfig>(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    const session = getStoredSession();

    if (!session.token || !session.user) {
      return null;
    }

    try {
      const dashboard = await loadDashboardData(session.token, session.user.email);
      return {
        token: session.token,
        user: session.user,
        dashboard,
      };
    } catch (error) {
      clearSession();
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to restore your session.",
      );
    }
  },
);

export const authenticateWithGoogle = createAsyncThunk<SessionPayload, GoogleUser, ThunkConfig>(
  "auth/authenticateWithGoogle",
  async (googleUser, { rejectWithValue }) => {
    try {
      let token: string;

      try {
        const registerResponse = await registerUser(googleUser.email, googleUser.name);
        token = registerResponse.accessToken;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to register";
        const alreadyExists = message.toLowerCase().includes("already registered");

        if (!alreadyExists) {
          throw error;
        }

        const loginResponse = await loginUser(googleUser.email);
        token = loginResponse.accessToken;
      }

      persistSession(token, googleUser);
      const dashboard = await loadDashboardData(token, googleUser.email);

      return {
        token,
        user: googleUser,
        dashboard,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to authenticate with server",
      );
    }
  },
);

export const createBookingEntry = createAsyncThunk<DashboardData, void, ThunkConfig>(
  "booking/createBookingEntry",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken, user } = getRequiredAuth(state);
      const { title, startsAt, endsAt } = state.booking;

      if (!title.trim()) {
        return rejectWithValue("Booking title is required.");
      }

      const parsedStartsAt = parseDateInput(startsAt);
      const parsedEndsAt = parseDateInput(endsAt);

      if (Number.isNaN(parsedStartsAt.getTime())) {
        return rejectWithValue("Invalid start date.");
      }

      if (Number.isNaN(parsedEndsAt.getTime())) {
        return rejectWithValue("Invalid end date.");
      }

      if (parsedStartsAt >= parsedEndsAt) {
        return rejectWithValue("Start time must be earlier than end time.");
      }

      await createBooking(accessToken, {
        title: title.trim(),
        startsAt: parsedStartsAt.toISOString(),
        endsAt: parsedEndsAt.toISOString(),
      });

      return loadDashboardData(accessToken, user.email);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to create booking");
    }
  },
);

export const cancelBookingEntry = createAsyncThunk<DashboardData, string, ThunkConfig>(
  "booking/cancelBookingEntry",
  async (bookingId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken, user } = getRequiredAuth(state);

      await cancelBooking(accessToken, bookingId);
      return loadDashboardData(accessToken, user.email);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to cancel booking");
    }
  },
);

export const connectUserCalendar = createAsyncThunk<DashboardData, void, ThunkConfig>(
  "booking/connectUserCalendar",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { accessToken, user } = getRequiredAuth(state);
      const calendarId = state.booking.calendarIdInput.trim();

      if (!calendarId) {
        return rejectWithValue("Calendar ID is required.");
      }

      await connectCalendar(accessToken, calendarId);
      return loadDashboardData(accessToken, user.email);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to connect calendar",
      );
    }
  },
);
