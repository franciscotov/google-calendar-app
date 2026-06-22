import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { computeAvailableSlots, formatDateTimeLocalValue, getInitialBookingRange } from "../_lib/utils";
import type { Booking, TakenSlot } from "../_lib/types";
import { authenticateWithGoogle, cancelBookingEntry, connectUserCalendar, createBookingEntry, restoreSession } from "./thunks";
import type { RootState } from "./store";

type BookingState = {
  bookings: Booking[];
  takenSlots: TakenSlot[];
  connectedCalendarId: string;
  calendarIdInput: string;
  title: string;
  startsAt: string;
  endsAt: string;
};

const initialBookingRange = getInitialBookingRange();

const initialState: BookingState = {
  bookings: [],
  takenSlots: [],
  connectedCalendarId: "",
  calendarIdInput: "",
  title: "",
  startsAt: initialBookingRange.startsAt,
  endsAt: initialBookingRange.endsAt,
};

function applyDashboardState(
  state: BookingState,
  payload: {
    bookings: Booking[];
    takenSlots: TakenSlot[];
    connectedCalendarId: string;
    calendarIdInput: string;
  },
) {
  state.bookings = payload.bookings;
  state.takenSlots = payload.takenSlots;
  state.connectedCalendarId = payload.connectedCalendarId;
  state.calendarIdInput = payload.calendarIdInput;
}

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setTitle(state, action: PayloadAction<string>) {
      state.title = action.payload;
    },
    setStartsAt(state, action: PayloadAction<string>) {
      state.startsAt = action.payload;
    },
    setEndsAt(state, action: PayloadAction<string>) {
      state.endsAt = action.payload;
    },
    setCalendarIdInput(state, action: PayloadAction<string>) {
      state.calendarIdInput = action.payload;
    },
    applySlotToForm(state, action: PayloadAction<{ slotStart: Date; slotEnd: Date }>) {
      state.startsAt = formatDateTimeLocalValue(action.payload.slotStart);
      state.endsAt = formatDateTimeLocalValue(action.payload.slotEnd);
    },
    resetBookingState(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (!action.payload) {
          return;
        }

        applyDashboardState(state, action.payload.dashboard);
      })
      .addCase(authenticateWithGoogle.fulfilled, (state, action) => {
        applyDashboardState(state, action.payload.dashboard);
      })
      .addCase(createBookingEntry.fulfilled, (state, action) => {
        applyDashboardState(state, action.payload);
        state.title = "";
      })
      .addCase(cancelBookingEntry.fulfilled, (state, action) => {
        applyDashboardState(state, action.payload);
      })
      .addCase(connectUserCalendar.fulfilled, (state, action) => {
        applyDashboardState(state, action.payload);
      });
  },
});

export const {
  setTitle,
  setStartsAt,
  setEndsAt,
  setCalendarIdInput,
  applySlotToForm,
  resetBookingState,
} = bookingSlice.actions;

export const selectAvailableSlots = createSelector(
  [(state: RootState) => state.booking.takenSlots],
  (takenSlots) => computeAvailableSlots(takenSlots),
);

export default bookingSlice.reducer;
