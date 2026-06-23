import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { GoogleUser } from "../_lib/types";
import { authenticateWithGoogle, restoreSession } from "./thunks";

type AuthState = {
  accessToken: string;
  googleAccessToken: string;
  user: GoogleUser | null;
  sessionHydrated: boolean;
};

const initialState: AuthState = {
  accessToken: "",
  googleAccessToken: "",
  user: null,
  sessionHydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setGoogleAccessToken(state, action: PayloadAction<string>) {
      state.googleAccessToken = action.payload;
    },
    signedOut(state) {
      state.accessToken = "";
      state.googleAccessToken = "";
      state.user = null;
      state.sessionHydrated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.sessionHydrated = true;

        if (!action.payload) {
          state.accessToken = "";
          state.googleAccessToken = "";
          state.user = null;
          return;
        }

        state.accessToken = action.payload.token;
        state.googleAccessToken = action.payload.googleAccessToken;
        state.user = action.payload.user;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.accessToken = "";
        state.googleAccessToken = "";
        state.user = null;
        state.sessionHydrated = true;
      })
      .addCase(authenticateWithGoogle.fulfilled, (state, action) => {
        state.accessToken = action.payload.token;
        state.user = action.payload.user;
        state.googleAccessToken = "";
        state.sessionHydrated = true;
      });
  },
});

export const { setGoogleAccessToken, signedOut } = authSlice.actions;
export default authSlice.reducer;
