import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import bookingReducer from "./bookingSlice";
import uiReducer from "./uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    ui: uiReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
