import type { MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  API_BASE_URL,
  cancelBooking,
  connectCalendar,
  createBooking,
  getBookings,
  getConnectedCalendar,
  getTakenSlots,
  loginUser,
  registerUser,
} from "../_lib/api";
import type { Booking, GoogleCredentialResponse, GoogleUser, TakenSlot, TimeSlot } from "../_lib/types";
import {
  clearSession,
  computeAvailableSlots,
  decodeJwtPayload,
  formatDateTimeLocalValue,
  getInitialBookingRange,
  getStoredSession,
  GOOGLE_CLIENT_ID,
  parseDateInput,
  persistSession,
} from "../_lib/utils";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number>,
          ) => void;
        };
      };
    };
  }
}

export type BookingAppModel = {
  apiBaseUrl: string;
  googleClientId: string;
  googleButtonRef: MutableRefObject<HTMLDivElement | null>;
  user: GoogleUser | null;
  title: string;
  startsAt: string;
  endsAt: string;
  calendarIdInput: string;
  connectedCalendarId: string;
  bookings: Booking[];
  availableSlots: TimeSlot[];
  isBusy: boolean;
  infoMessage: string;
  errorMessage: string;
  setTitle: (value: string) => void;
  setStartsAt: (value: string) => void;
  setEndsAt: (value: string) => void;
  setCalendarIdInput: (value: string) => void;
  applySlotToForm: (slotStart: Date, slotEnd: Date) => void;
  createBooking: () => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  connectCalendar: () => Promise<void>;
  signOut: () => void;
};

export function useBookingApp(googleLoaded: boolean): BookingAppModel {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [initialSession] = useState(getStoredSession);
  const [initialBookingRange] = useState(getInitialBookingRange);

  const [accessToken, setAccessToken] = useState<string>(initialSession.token);
  const [user, setUser] = useState<GoogleUser | null>(initialSession.user);
  const [calendarIdInput, setCalendarIdInput] = useState<string>("");
  const [connectedCalendarId, setConnectedCalendarId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(initialBookingRange.startsAt);
  const [endsAt, setEndsAt] = useState(initialBookingRange.endsAt);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [takenSlots, setTakenSlots] = useState<TakenSlot[]>([]);
  const [isBusy, setIsBusy] = useState(Boolean(initialSession.token));
  const [infoMessage, setInfoMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const userEmail = user?.email;

  const signOut = useCallback(() => {
    clearSession();
    setAccessToken("");
    setUser(null);
    setConnectedCalendarId("");
    setCalendarIdInput("");
    setBookings([]);
    setTakenSlots([]);
    setIsBusy(false);
    setInfoMessage("You are signed out.");
    setErrorMessage("");
  }, []);

  const loadData = useCallback(async (token: string, fallbackEmail?: string) => {
    const [bookingsData, takenData, calendarData] = await Promise.all([
      getBookings(token),
      getTakenSlots(token),
      getConnectedCalendar(token),
    ]);

    setBookings(bookingsData);
    setTakenSlots(takenData);

    const calendarId = calendarData.user.googleCalendarId || "";
    setConnectedCalendarId(calendarId);
    setCalendarIdInput(calendarId || fallbackEmail || "");
  }, []);

  const authenticateWithBackend = useCallback(async (googleUser: GoogleUser) => {
    try {
      const registerResponse = await registerUser(googleUser.email, googleUser.name);
      return registerResponse.accessToken;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to register";
      const alreadyExists = message.toLowerCase().includes("already registered");

      if (!alreadyExists) {
        throw error;
      }

      const loginResponse = await loginUser(googleUser.email);
      return loginResponse.accessToken;
    }
  }, []);

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setErrorMessage("Google sign-in failed. Please try again.");
        return;
      }

      const payload = decodeJwtPayload<{ email?: string; name?: string }>(response.credential);
      if (!payload?.email) {
        setErrorMessage("Google payload did not include an email.");
        return;
      }

      const nextUser: GoogleUser = {
        email: payload.email,
        name: payload.name,
      };

      setIsBusy(true);
      setErrorMessage("");

      try {
        const token = await authenticateWithBackend(nextUser);
        setUser(nextUser);
        setAccessToken(token);
        persistSession(token, nextUser);
        await loadData(token, nextUser.email);
        setInfoMessage("You are signed in. You can now create, view, and cancel bookings.");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to authenticate with server",
        );
      } finally {
        setIsBusy(false);
      }
    },
    [authenticateWithBackend, loadData],
  );

  useEffect(() => {
    if (!accessToken || !user) {
      return;
    }

    let isCancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(accessToken, user.email)
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : "Session expired";
        setErrorMessage(message);
        signOut();
      })
      .finally(() => {
        if (!isCancelled) {
          setIsBusy(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken, loadData, signOut, user]);

  useEffect(() => {
    if (!googleLoaded || !googleButtonRef.current || !GOOGLE_CLIENT_ID || user) {
      return;
    }

    if (!window.google) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "signin_with",
      width: 260,
    });
  }, [googleLoaded, handleGoogleCredential, user]);

  const availableSlots = useMemo(() => computeAvailableSlots(takenSlots), [takenSlots]);

  const applySlotToForm = useCallback((slotStart: Date, slotEnd: Date) => {
    setStartsAt(formatDateTimeLocalValue(slotStart));
    setEndsAt(formatDateTimeLocalValue(slotEnd));
  }, []);

  const createBookingAction = useCallback(async () => {
    if (!accessToken) {
      setErrorMessage("Please sign in first.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Booking title is required.");
      return;
    }

    const starts = parseDateInput(startsAt);
    const ends = parseDateInput(endsAt);

    if (Number.isNaN(starts.getTime())) {
      setErrorMessage("Invalid start date.");
      return;
    }

    if (Number.isNaN(ends.getTime())) {
      setErrorMessage("Invalid end date.");
      return;
    }

    if (starts >= ends) {
      setErrorMessage("Start time must be earlier than end time.");
      return;
    }

    setErrorMessage("");
    setInfoMessage("");
    setIsBusy(true);

    try {
      await createBooking(accessToken, {
        title: title.trim(),
        startsAt: starts.toISOString(),
        endsAt: ends.toISOString(),
      });

      await loadData(accessToken, userEmail);
      setTitle("");
      setInfoMessage("Booking created successfully.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create booking");
    } finally {
      setIsBusy(false);
    }
  }, [accessToken, endsAt, loadData, startsAt, title, userEmail]);

  const cancelBookingAction = useCallback(
    async (bookingId: string) => {
      if (!accessToken) {
        return;
      }

      setIsBusy(true);
      setErrorMessage("");
      setInfoMessage("");

      try {
        await cancelBooking(accessToken, bookingId);
        await loadData(accessToken, userEmail);
        setInfoMessage("Booking canceled.");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to cancel booking");
      } finally {
        setIsBusy(false);
      }
    },
    [accessToken, loadData, userEmail],
  );

  const connectCalendarAction = useCallback(async () => {
    if (!accessToken) {
      setErrorMessage("Please sign in first.");
      return;
    }

    const nextCalendarId = calendarIdInput.trim();
    if (!nextCalendarId) {
      setErrorMessage("Calendar ID is required.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      await connectCalendar(accessToken, nextCalendarId);
      setConnectedCalendarId(nextCalendarId);
      setInfoMessage("Google Calendar connected. New bookings will be checked for conflicts.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to connect calendar");
    } finally {
      setIsBusy(false);
    }
  }, [accessToken, calendarIdInput]);

  return {
    apiBaseUrl: API_BASE_URL,
    googleClientId: GOOGLE_CLIENT_ID,
    googleButtonRef,
    user,
    title,
    startsAt,
    endsAt,
    calendarIdInput,
    connectedCalendarId,
    bookings,
    availableSlots,
    isBusy,
    infoMessage,
    errorMessage,
    setTitle,
    setStartsAt,
    setEndsAt,
    setCalendarIdInput,
    applySlotToForm,
    createBooking: createBookingAction,
    cancelBooking: cancelBookingAction,
    connectCalendar: connectCalendarAction,
    signOut,
  };
}
