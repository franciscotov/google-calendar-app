import { renderHook, act, waitFor } from "@testing-library/react";
import type { GoogleOauthTokenResponse } from "../_lib/types";
import * as utils from "../_lib/utils";
import { setGoogleAccessToken, signedOut } from "../_store/authSlice";
import { resetBookingState } from "../_store/bookingSlice";
import { useAppDispatch, useAppSelector } from "../_store/hooks";
import { restoreSession } from "../_store/thunks";
import { setErrorMessage, setInfoMessage } from "../_store/uiSlice";
import { useBookingApp } from "./useBookingApp";

const mockUseAppDispatch = jest.mocked(useAppDispatch);
const mockUseAppSelector = jest.mocked(useAppSelector);

// Mock Redux hooks
jest.mock("../_store/hooks", () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock Redux slices
jest.mock("../_store/authSlice", () => ({
  setGoogleAccessToken: jest.fn(),
  signedOut: jest.fn(),
}));

jest.mock("../_store/bookingSlice", () => ({
  resetBookingState: jest.fn(),
}));

jest.mock("../_store/uiSlice", () => ({
  setErrorMessage: jest.fn(),
  setInfoMessage: jest.fn(),
}));

// Mock thunks
jest.mock("../_store/thunks", () => ({
  authenticateWithGoogle: jest.fn(),
  restoreSession: jest.fn(),
}));

// Mock utils
jest.mock("../_lib/utils", () => ({
  clearSession: jest.fn(),
  decodeJwtPayload: jest.fn(),
  GOOGLE_CLIENT_ID: "test-client-id",
  persistGoogleAccessToken: jest.fn(),
}));

describe("useBookingApp", () => {
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch = jest.fn();

    mockUseAppDispatch.mockReturnValue(mockDispatch);
    mockUseAppSelector.mockImplementation((selector) => {
      // Default mock state
      const state = {
        auth: {
          user: null,
          googleAccessToken: null,
          sessionHydrated: false,
        },
        booking: {},
        ui: {},
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });
  });

  afterEach(() => {
    jest.resetModules();
    window.google = undefined;
  });

  it("should initialize properly when googleLoaded is false", () => {
    const { result } = renderHook(() => useBookingApp(false));

    expect(result.current.googleButtonRef).toBeDefined();
    expect(result.current.hasCalendarAccess).toBe(false);
  });

  it("should return correct initial bindings", () => {
    const { result } = renderHook(() => useBookingApp(false));

    expect(result.current).toHaveProperty("googleButtonRef");
    expect(result.current).toHaveProperty("signOut");
    expect(result.current).toHaveProperty("grantCalendarAccess");
    expect(result.current).toHaveProperty("hasCalendarAccess");
  });

  it("should set hasCalendarAccess to true when googleAccessToken is present", () => {
    mockUseAppSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          user: null,
          googleAccessToken: "test-token",
          sessionHydrated: true,
        },
        booking: {},
        ui: {},
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    const { result } = renderHook(() => useBookingApp(false));
    expect(result.current.hasCalendarAccess).toBe(true);
  });

  it("should dispatch signedOut, resetBookingState, and setInfoMessage when signOut is called", () => {
    const { result } = renderHook(() => useBookingApp(false));

    act(() => {
      result.current.signOut();
    });

    expect(utils.clearSession).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(signedOut());
    expect(mockDispatch).toHaveBeenCalledWith(resetBookingState());
    expect(mockDispatch).toHaveBeenCalledWith(
      setInfoMessage("You are signed out."),
    );
  });

  it("should setup googleButtonRef when hook is initialized", () => {
    const { result } = renderHook(() => useBookingApp(false));

    expect(result.current.googleButtonRef).toBeDefined();
    expect(result.current.googleButtonRef.current).toBeNull();
  });

  it("should not render Google button when user is already logged in", () => {
    const mockRenderButton = jest.fn();

    window.google = {
      accounts: {
        id: {
          initialize: jest.fn(),
          renderButton: mockRenderButton,
        },
        oauth2: {
          initTokenClient: jest.fn(() => ({
            requestAccessToken: jest.fn(),
          })),
        },
      },
    };

    mockUseAppSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          user: { email: "test@example.com", name: "Test User" },
          googleAccessToken: null,
          sessionHydrated: true,
        },
        booking: {},
        ui: {},
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    renderHook(() => useBookingApp(true));

    // Should not call renderButton since user exists
    expect(mockRenderButton).not.toHaveBeenCalled();
  });

  it("should initialize OAuth token client when googleLoaded is true", () => {
    const mockInitTokenClient = jest.fn();

    window.google = {
      accounts: {
        id: {
          initialize: jest.fn(),
          renderButton: jest.fn(),
        },
        oauth2: {
          initTokenClient: mockInitTokenClient,
        },
      },
    };

    mockUseAppSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          user: null,
          googleAccessToken: null,
          sessionHydrated: true,
        },
        booking: {},
        ui: {},
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    renderHook(() => useBookingApp(true));

    expect(mockInitTokenClient).toHaveBeenCalledWith({
      client_id: "test-client-id",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: expect.any(Function),
      error_callback: expect.any(Function),
    });
  });

  it("should handle grantCalendarAccess and return a promise", async () => {
    const mockRequestAccessToken = jest.fn();
    const tokenClient = {
      requestAccessToken: mockRequestAccessToken,
    };

    window.google = {
      accounts: {
        id: {
          initialize: jest.fn(),
          renderButton: jest.fn(),
        },
        oauth2: {
          initTokenClient: jest.fn(() => tokenClient),
        },
      },
    };

    mockUseAppSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          user: { email: "test@example.com" },
          googleAccessToken: null,
          sessionHydrated: true,
        },
        booking: {},
        ui: {},
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    const { result } = renderHook(() => useBookingApp(true));

    act(() => {
      void result.current.grantCalendarAccess();
    });

    waitFor(() => {
      expect(mockRequestAccessToken).toHaveBeenCalledWith({
        prompt: "consent",
      });
    });
  });

  it("should dispatch error message when grantCalendarAccess fails due to no token client", async () => {
    mockUseAppSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          user: { email: "test@example.com" },
          googleAccessToken: null,
          sessionHydrated: true,
        },
        booking: {},
        ui: {},
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    const { result } = renderHook(() => useBookingApp(false));

    const grantPromise = result.current.grantCalendarAccess();

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setErrorMessage("Google OAuth is not ready yet. Please try again."),
      );
    });

    expect(await grantPromise).toBe(false);
  });

  it("should restore session on mount if not hydrated", () => {
    mockUseAppSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          user: null,
          googleAccessToken: null,
          sessionHydrated: false,
        },
        booking: {},
        ui: {},
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    renderHook(() => useBookingApp(false));

    waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(restoreSession());
    });
  });

  it("should not restore session if already hydrated", () => {
    mockUseAppSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          user: null,
          googleAccessToken: null,
          sessionHydrated: true,
        },
        booking: {},
        ui: {},
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    renderHook(() => useBookingApp(false));

    expect(mockDispatch).not.toHaveBeenCalledWith(restoreSession());
  });

  it("should handle OAuth token success response", async () => {
    let tokenCallback: ((response: GoogleOauthTokenResponse) => void) | null =
      null;
    const mockInitTokenClient = jest.fn((config) => {
      tokenCallback = config.callback;
      return {
        requestAccessToken: jest.fn(),
      };
    });

    window.google = {
      accounts: {
        id: {
          initialize: jest.fn(),
          renderButton: jest.fn(),
        },
        oauth2: {
          initTokenClient: mockInitTokenClient,
        },
      },
    };

    mockUseAppSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          user: { email: "test@example.com" },
          googleAccessToken: null,
          sessionHydrated: true,
        },
        booking: {},
        ui: {},
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    renderHook(() => useBookingApp(true));

    const mockResponse: GoogleOauthTokenResponse = {
      access_token: "test-access-token",
      expires_in: 3600,
    };

    waitFor(() => {
      if (tokenCallback) {
        tokenCallback(mockResponse);
      }

      expect(mockDispatch).toHaveBeenCalledWith(
        setGoogleAccessToken("test-access-token"),
      );
      expect(utils.persistGoogleAccessToken).toHaveBeenCalledWith(
        "test-access-token",
        3600,
      );
    });
  });

  it("should handle OAuth token error response", async () => {
    let errorCallback: ((error: { message?: string; type?: string }) => void) | null = null;

    const mockInitTokenClient = jest.fn((config) => {
      errorCallback = config.error_callback;
      return {
        requestAccessToken: jest.fn(),
      };
    });

    window.google = {
      accounts: {
        id: {
          initialize: jest.fn(),
          renderButton: jest.fn(),
        },
        oauth2: {
          initTokenClient: mockInitTokenClient,
        },
      },
    };

    mockUseAppSelector.mockImplementation((selector) => {
      const state = {
        auth: {
          user: { email: "test@example.com" },
          googleAccessToken: null,
          sessionHydrated: true,
        },
        booking: {},
        ui: {},
      };
      return selector(state as unknown as Parameters<typeof selector>[0]);
    });

    renderHook(() => useBookingApp(true));

    waitFor(() => {
      if (errorCallback) {
        errorCallback({ message: "User cancelled" });
      }

      expect(mockDispatch).toHaveBeenCalledWith(
        setErrorMessage("User cancelled"),
      );
    });
  });
});
