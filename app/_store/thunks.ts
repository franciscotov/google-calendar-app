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
import {
  BOOKING_TITLE_MAX_LENGTH,
  BOOKING_TITLE_MIN_LENGTH,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
} from "../_lib/validation";
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
      const normalizedEmail = googleUser.email.trim();
      const normalizedName = googleUser.name?.trim() || undefined;

      if (!normalizedEmail) {
        return rejectWithValue("Email is required.");
      }

      if (normalizedEmail.length > USER_EMAIL_MAX_LENGTH) {
        return rejectWithValue(`Email must be at most ${USER_EMAIL_MAX_LENGTH} characters.`);
      }

      if (normalizedName && normalizedName.length > USER_NAME_MAX_LENGTH) {
        return rejectWithValue(`Name must be at most ${USER_NAME_MAX_LENGTH} characters.`);
      }

      let token: string;

      try {
        const registerResponse = await registerUser(normalizedEmail, normalizedName);
        token = registerResponse.accessToken;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to register";
        const alreadyExists = message.toLowerCase().includes("already registered");

        if (!alreadyExists) {
          throw error;
        }

        const loginResponse = await loginUser(normalizedEmail);
        token = loginResponse.accessToken;
      }

      const normalizedGoogleUser: GoogleUser = {
        email: normalizedEmail,
        name: normalizedName,
      };

      await connectCalendar(token, normalizedEmail);
      persistSession(token, normalizedGoogleUser);
      const dashboard = await loadDashboardData(token);

      return {
        token,
        googleAccessToken: "",
        user: normalizedGoogleUser,
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
      const normalizedTitle = title.trim();

      if (!normalizedTitle) {
        return rejectWithValue("Booking title is required.");
      }

      if (normalizedTitle.length < BOOKING_TITLE_MIN_LENGTH) {
        return rejectWithValue(
          `Booking title must be at least ${BOOKING_TITLE_MIN_LENGTH} characters.`,
        );
      }

      if (normalizedTitle.length > BOOKING_TITLE_MAX_LENGTH) {
        return rejectWithValue(
          `Booking title must be at most ${BOOKING_TITLE_MAX_LENGTH} characters.`,
        );
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
        title: normalizedTitle,
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
