"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  GoogleCredentialResponse,
  GoogleOauthTokenResponse,
  GoogleUser,
} from "../_lib/types";
import {
  clearSession,
  decodeJwtPayload,
  GOOGLE_CLIENT_ID,
  persistGoogleAccessToken,
} from "../_lib/utils";
import { USER_EMAIL_MAX_LENGTH, USER_NAME_MAX_LENGTH } from "../_lib/validation";
import { setGoogleAccessToken, signedOut } from "../_store/authSlice";
import { resetBookingState } from "../_store/bookingSlice";
import { useAppDispatch, useAppSelector } from "../_store/hooks";
import { authenticateWithGoogle, restoreSession } from "../_store/thunks";
import { setErrorMessage, setInfoMessage } from "../_store/uiSlice";

const CALENDAR_READ_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

type OAuthPrompt = "" | "consent";

type TokenClient = {
  requestAccessToken: (options?: { prompt?: OAuthPrompt }) => void;
};

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
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleOauthTokenResponse) => void;
            error_callback?: (response: { message?: string; type?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

export type BookingAppBindings = {
  googleButtonRef: React.MutableRefObject<HTMLDivElement | null>;
  signOut: () => void;
  grantCalendarAccess: () => Promise<boolean>;
  hasCalendarAccess: boolean;
};

export function useBookingApp(googleLoaded: boolean): BookingAppBindings {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const googleAccessToken = useAppSelector((state) => state.auth.googleAccessToken);
  const sessionHydrated = useAppSelector((state) => state.auth.sessionHydrated);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const tokenClientRef = useRef<TokenClient | null>(null);
  const tokenResolverRef = useRef<((value: boolean) => void) | null>(null);

  const signOut = useCallback(() => {
    clearSession();
    dispatch(signedOut());
    dispatch(resetBookingState());
    dispatch(setInfoMessage("You are signed out."));
  }, [dispatch]);

  const requestGoogleCalendarAccess = useCallback(
    (prompt: OAuthPrompt): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!tokenClientRef.current) {
          dispatch(setErrorMessage("Google OAuth is not ready yet. Please try again."));
          resolve(false);
          return;
        }

        tokenResolverRef.current = resolve;
        if (user) {
          tokenClientRef.current.requestAccessToken({ prompt });
        }
      });
    },
    [dispatch, user],
  );

  const grantCalendarAccess = useCallback(() => {
    return requestGoogleCalendarAccess("consent");
  }, [requestGoogleCalendarAccess]);

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        dispatch(setErrorMessage("Google sign-in failed. Please try again."));
        return;
      }

      const payload = decodeJwtPayload<{ email?: string; name?: string }>(response.credential);
      if (!payload?.email) {
        dispatch(setErrorMessage("Google payload did not include an email."));
        return;
      }

      const normalizedEmail = payload.email.trim();
      const normalizedName = payload.name?.trim() || undefined;

      if (!normalizedEmail) {
        dispatch(setErrorMessage("Google payload did not include a valid email."));
        return;
      }

      if (normalizedEmail.length > USER_EMAIL_MAX_LENGTH) {
        dispatch(
          setErrorMessage(`Email must be at most ${USER_EMAIL_MAX_LENGTH} characters.`),
        );
        return;
      }

      if (normalizedName && normalizedName.length > USER_NAME_MAX_LENGTH) {
        dispatch(
          setErrorMessage(`Name must be at most ${USER_NAME_MAX_LENGTH} characters.`),
        );
        return;
      }

      const nextUser: GoogleUser = {
        email: normalizedEmail,
        name: normalizedName,
      };

      try {
        await dispatch(authenticateWithGoogle(nextUser)).unwrap();
        await requestGoogleCalendarAccess("consent");
      } catch {
        // Errors are handled by thunk rejections in ui slice.
      }
    },
    [dispatch, requestGoogleCalendarAccess],
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

  useEffect(() => {
    if (!googleLoaded || !GOOGLE_CLIENT_ID || !window.google) {
      return;
    }

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: CALENDAR_READ_SCOPE,
      callback: (response: GoogleOauthTokenResponse) => {
        const resolve = tokenResolverRef.current;
        tokenResolverRef.current = null;

        if (response.error || !response.access_token) {
          const fallback = response.error_description || response.error || "Calendar access failed.";
          dispatch(setErrorMessage(fallback));
          resolve?.(false);
          return;
        }

        dispatch(setGoogleAccessToken(response.access_token));
        persistGoogleAccessToken(response.access_token, response.expires_in);
        resolve?.(true);
      },
      error_callback: (error) => {
        const resolve = tokenResolverRef.current;
        tokenResolverRef.current = null;
        dispatch(setErrorMessage(error.message || "Google OAuth request failed."));
        resolve?.(false);
      },
    });
  }, [dispatch, googleLoaded]);

  return {
    googleButtonRef,
    signOut,
    grantCalendarAccess,
    hasCalendarAccess: Boolean(googleAccessToken),
  };
}
