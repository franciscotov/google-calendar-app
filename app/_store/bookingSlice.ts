import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { computeAvailableSlots, formatDateTimeLocalValue, getInitialBookingRange } from "../_lib/utils";
import type { Booking, TakenSlot } from "../_lib/types";
import { authenticateWithGoogle, cancelBookingEntry, createBookingEntry, restoreSession } from "./thunks";
import type { RootState } from "./store";

type BookingState = {
  bookings: Booking[];
  takenSlots: TakenSlot[];
  title: string;
  startsAt: string;
  endsAt: string;
};

const initialBookingRange = getInitialBookingRange();

const initialState: BookingState = {
  bookings: [],
  takenSlots: [],
  title: "",
  startsAt: initialBookingRange.startsAt,
  endsAt: initialBookingRange.endsAt,
};

function applyDashboardState(
  state: BookingState,
  payload: {
    bookings: Booking[];
    takenSlots: TakenSlot[];
  },
) {
  state.bookings = payload.bookings;
  state.takenSlots = payload.takenSlots;
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
    applySlotToForm(state, action: PayloadAction<{ slotStartIso: string; slotEndIso: string }>) {
      const slotStart = new Date(action.payload.slotStartIso);
      const slotEnd = new Date(action.payload.slotEndIso);

      if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) {
        return;
      }

      state.startsAt = formatDateTimeLocalValue(slotStart);
      state.endsAt = formatDateTimeLocalValue(slotEnd);
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
      });
  },
});

export const {
  setTitle,
  setStartsAt,
  setEndsAt,
  applySlotToForm,
  resetBookingState,
} = bookingSlice.actions;

export const selectAvailableSlots = createSelector(
  [(state: RootState) => state.booking.takenSlots],
  (takenSlots) => computeAvailableSlots(takenSlots),
);

export default bookingSlice.reducer;
