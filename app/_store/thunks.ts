import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  cancelBooking,
  connectCalendar,
  createBooking,
  getBookings,
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
};

type SessionPayload = {
  token: string;
  googleAccessToken: string;
  user: GoogleUser;
  dashboard: DashboardData;
};

type ThunkConfig = {
  state: RootState;
  rejectValue: string;
};

async function loadDashboardData(token: string): Promise<DashboardData> {
  const [bookings, takenSlots] = await Promise.all([getBookings(token), getTakenSlots(token)]);

  return {
    bookings,
    takenSlots,
  };
}

function getRequiredAuth(state: RootState) {
  const { accessToken, googleAccessToken, user } = state.auth;

  if (!accessToken || !user) {
    throw new Error("Please sign in first.");
  }

  return { accessToken, googleAccessToken, user };
}

export const restoreSession = createAsyncThunk<SessionPayload | null, void, ThunkConfig>(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    const session = getStoredSession();

    if (!session.token || !session.user) {
      return null;
    }

    try {
      const dashboard = await loadDashboardData(session.token);
      return {
        token: session.token,
        googleAccessToken: session.googleAccessToken,
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

      await connectCalendar(token, googleUser.email);
      persistSession(token, googleUser);
      const dashboard = await loadDashboardData(token);

      return {
        token,
        googleAccessToken: "",
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
      const { accessToken, googleAccessToken } = getRequiredAuth(state);
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

      if (!googleAccessToken) {
        return rejectWithValue(
          "Google Calendar authorization is required before creating bookings.",
        );
      }

      await createBooking(accessToken, {
        title: title.trim(),
        startsAt: parsedStartsAt.toISOString(),
        endsAt: parsedEndsAt.toISOString(),
      }, googleAccessToken);

      return loadDashboardData(accessToken);
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
      const { accessToken } = getRequiredAuth(state);

      await cancelBooking(accessToken, bookingId);
      return loadDashboardData(accessToken);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to cancel booking");
    }
  },
);
