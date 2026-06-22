import { createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  authenticateWithGoogle,
  cancelBookingEntry,
  connectUserCalendar,
  createBookingEntry,
  restoreSession,
} from "./thunks";

type UiState = {
  isBusy: boolean;
  infoMessage: string;
  errorMessage: string;
};

const initialState: UiState = {
  isBusy: false,
  infoMessage: "",
  errorMessage: "",
};

const pendingActions = [
  restoreSession,
  authenticateWithGoogle,
  createBookingEntry,
  cancelBookingEntry,
  connectUserCalendar,
];

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    clearMessages(state) {
      state.infoMessage = "";
      state.errorMessage = "";
    },
    setInfoMessage(state, action: PayloadAction<string>) {
      state.infoMessage = action.payload;
      state.errorMessage = "";
    },
    setErrorMessage(state, action: PayloadAction<string>) {
      state.errorMessage = action.payload;
      state.infoMessage = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state) => {
        state.isBusy = false;
      })
      .addCase(authenticateWithGoogle.fulfilled, (state) => {
        state.isBusy = false;
        state.infoMessage = "You are signed in. You can now create, view, and cancel bookings.";
      })
      .addCase(createBookingEntry.fulfilled, (state) => {
        state.isBusy = false;
        state.infoMessage = "Booking created successfully.";
      })
      .addCase(cancelBookingEntry.fulfilled, (state) => {
        state.isBusy = false;
        state.infoMessage = "Booking canceled.";
      })
      .addCase(connectUserCalendar.fulfilled, (state) => {
        state.isBusy = false;
        state.infoMessage = "Google Calendar connected. New bookings will be checked for conflicts.";
      })
      .addMatcher(isAnyOf(...pendingActions.map((thunk) => thunk.pending)), (state) => {
        state.isBusy = true;
        state.errorMessage = "";
      })
      .addMatcher(isAnyOf(...pendingActions.map((thunk) => thunk.rejected)), (state, action) => {
        state.isBusy = false;
        state.errorMessage = action.payload ?? "Something went wrong.";
      });
  },
});

export const { clearMessages, setInfoMessage, setErrorMessage } = uiSlice.actions;
export default uiSlice.reducer;
