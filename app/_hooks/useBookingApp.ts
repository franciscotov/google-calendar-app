"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GoogleCredentialResponse, GoogleUser } from "../_lib/types";
import {
  clearSession,
  decodeJwtPayload,
  GOOGLE_CLIENT_ID,
} from "../_lib/utils";
import { signedOut } from "../_store/authSlice";
import { resetBookingState } from "../_store/bookingSlice";
import { useAppDispatch, useAppSelector } from "../_store/hooks";
import { authenticateWithGoogle, restoreSession } from "../_store/thunks";
import { setErrorMessage, setInfoMessage } from "../_store/uiSlice";

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

export type BookingAppBindings = {
  googleButtonRef: React.MutableRefObject<HTMLDivElement | null>;
  signOut: () => void;
};

export function useBookingApp(googleLoaded: boolean): BookingAppBindings {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const sessionHydrated = useAppSelector((state) => state.auth.sessionHydrated);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const signOut = useCallback(() => {
    clearSession();
    dispatch(signedOut());
    dispatch(resetBookingState());
    dispatch(setInfoMessage("You are signed out."));
  }, [dispatch]);

  const handleGoogleCredential = useCallback(
    (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        dispatch(setErrorMessage("Google sign-in failed. Please try again."));
        return;
      }

      const payload = decodeJwtPayload<{ email?: string; name?: string }>(response.credential);
      if (!payload?.email) {
        dispatch(setErrorMessage("Google payload did not include an email."));
        return;
      }

      const nextUser: GoogleUser = {
        email: payload.email,
        name: payload.name,
      };

      dispatch(authenticateWithGoogle(nextUser));
    },
    [dispatch],
  );

  useEffect(() => {
    if (!sessionHydrated) {
      dispatch(restoreSession());
    }
  }, [dispatch, sessionHydrated]);

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

  return {
    googleButtonRef,
    signOut,
  };
}
