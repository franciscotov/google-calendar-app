"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../_lib/api";
import { useBookingApp } from "../_hooks/useBookingApp";
import { useAppDispatch, useAppSelector } from "../_store/hooks";
import { clearMessages } from "../_store/uiSlice";
import { AvailableSlotsCard } from "./AvailableSlotsCard";
import { CreateBookingCard } from "./CreateBookingCard";
import { YourBookingsCard } from "./YourBookingsCard";
import { GOOGLE_CLIENT_ID } from "../_lib/utils";

export function BookingAppView() {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const dispatch = useAppDispatch();
  const { googleButtonRef, signOut, grantCalendarAccess, hasCalendarAccess } =
    useBookingApp(googleLoaded);
  const user = useAppSelector((state) => state.auth.user);
  const isBusy = useAppSelector((state) => state.ui.isBusy);
  const infoMessage = useAppSelector((state) => state.ui.infoMessage);
  const errorMessage = useAppSelector((state) => state.ui.errorMessage);
  const activeMessage = errorMessage || infoMessage;

  useEffect(() => {
    if (!activeMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(clearMessages());
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeMessage, dispatch]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleLoaded(true)}
      />

      <div className="relative min-h-screen overflow-hidden bg-[#f9f8f4] text-[#1e2a24]">
        <div className="pointer-events-none absolute left-[-5rem] top-[-4rem] h-80 w-80 rounded-full bg-[#f4d8a7] blur-3xl" />
        <div className="pointer-events-none absolute right-[-5rem] top-16 h-72 w-72 rounded-full bg-[#9fc8b8] blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-7rem] left-1/3 h-72 w-72 rounded-full bg-[#c7d6f0] blur-3xl" />

        <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-12 pt-10 sm:px-8 lg:px-12">
          <section className="rounded-3xl border border-white/70 bg-white/80 p-7 shadow-[0_25px_60px_-30px_rgba(50,70,60,0.45)] backdrop-blur md:p-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6a7f73]">
                  Smart Booking Desk
                </p>
                <h1 className="font-display text-3xl leading-tight md:text-5xl">
                  Book time without collisions.
                </h1>
                <p className="max-w-2xl text-sm text-[#46594f] md:text-base">
                  Sign in with Google and book slots that are validated
                  against both system bookings and Google Calendar events before confirmation.
                </p>
              </div>

              <div className="rounded-2xl border border-[#dbe5dd] bg-[#f2f7f3] p-4 text-sm text-[#2e4338]">
                <p className="font-semibold">Backend URL</p>
                <p className="break-all">{API_BASE_URL}</p>
              </div>
            </div>
          </section>

          {!user && (
            <section className="rounded-3xl border border-[#dbe5dd] bg-white p-7 shadow-[0_20px_40px_-25px_rgba(28,46,38,0.5)] md:p-9">
              <h2 className="font-display text-2xl">Sign in</h2>
              <p className="mt-2 text-sm text-[#4c6155]">
                Use your Google account to access your booking dashboard.
              </p>

              {!GOOGLE_CLIENT_ID ? (
                <div className="mt-5 rounded-xl border border-[#f1cf8b] bg-[#fff7e1] p-4 text-sm text-[#6f561e]">
                  Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in your frontend environment.
                </div>
              ) : (
                <div className="mt-6" ref={googleButtonRef} />
              )}
            </section>
          )}

          {user && (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="space-y-6 rounded-3xl border border-[#dbe5dd] bg-white p-6 shadow-[0_20px_40px_-25px_rgba(28,46,38,0.5)] md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl">Welcome, {user.name || user.email}</h2>
                    <p className="text-sm text-[#4c6155]">{user.email}</p>
                  </div>

                  <button
                    type="button"
                    onClick={signOut}
                    className="cursor-pointer rounded-full border border-[#274a3b] px-4 py-2 text-sm font-medium text-[#274a3b] transition hover:bg-[#274a3b] hover:text-white"
                  >
                    Sign out
                  </button>
                </div>

                <div className="rounded-2xl border border-[#dbe5dd] bg-[#f4f8ff] p-5">
                  <h3 className="font-display text-xl">Calendar permission</h3>
                  <p className="mt-1 text-sm text-[#4c6155]">
                    Booking checks use your Google Calendar events in real time.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                        hasCalendarAccess
                          ? "bg-[#daf3e1] text-[#1e5b33]"
                          : "bg-[#fff0d6] text-[#7b4d0f]"
                      }`}
                    >
                      {hasCalendarAccess ? "Permission granted" : "Permission required"}
                    </span>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        void grantCalendarAccess();
                      }}
                      className="cursor-pointer rounded-xl bg-[#274a3b] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f3b30] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {hasCalendarAccess ? "Refresh access" : "Grant calendar access"}
                    </button>
                  </div>
                </div>

                <CreateBookingCard />
                <YourBookingsCard />
              </section>

              <AvailableSlotsCard />
            </div>
          )}

          {activeMessage && (
            <section
              className={`fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-2xl border px-4 py-3 text-sm shadow-[0_20px_45px_-25px_rgba(28,46,38,0.45)] backdrop-blur sm:left-auto sm:right-6 sm:w-[min(100%-3rem,24rem)] ${
                errorMessage
                  ? "border-[#f1b8b8] bg-[#fff5f5]/95 text-[#8a2d2d]"
                  : "border-[#bfe3cc] bg-[#f2fbf4]/95 text-[#1e5b33]"
              }`}
              role={errorMessage ? "alert" : "status"}
              aria-live={errorMessage ? "assertive" : "polite"}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    errorMessage ? "bg-[#fbd6d6]" : "bg-[#d8f1df]"
                  }`}
                >
                  {errorMessage ? "!" : "i"}
                </span>
                <p className="min-w-0 flex-1 pr-2 font-medium">{activeMessage}</p>
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
