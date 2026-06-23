"use client";

import { setEndsAt, setStartsAt, setTitle } from "../_store/bookingSlice";
import { useAppDispatch, useAppSelector } from "../_store/hooks";
import { createBookingEntry } from "../_store/thunks";
import { BOOKING_TITLE_MAX_LENGTH } from "../_lib/validation";

export function CreateBookingCard() {
  const dispatch = useAppDispatch();
  const { title, startsAt, endsAt } = useAppSelector((state) => state.booking);
  const hasCalendarAccess = useAppSelector((state) => Boolean(state.auth.googleAccessToken));
  const isBusy = useAppSelector((state) => state.ui.isBusy);

  return (
    <div className="rounded-2xl border border-[#dbe5dd] bg-[#fcfdfb] p-5">
      <h3 className="font-display text-xl">Create booking</h3>
      <p className="mt-1 text-sm text-[#4c6155]">
        The backend verifies conflicts with system bookings and Google Calendar before confirming.
      </p>

      {!hasCalendarAccess && (
        <p className="mt-2 rounded-lg border border-[#f1cf8b] bg-[#fff7e1] px-3 py-2 text-xs text-[#6f561e]">
          Grant Google Calendar permission above before creating a booking.
        </p>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          type="text"
          value={title}
          onChange={(event) => dispatch(setTitle(event.target.value))}
          placeholder="Booking title"
          maxLength={BOOKING_TITLE_MAX_LENGTH}
          className="rounded-xl border border-[#c6d4cb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#274a3b] md:col-span-2"
        />
        <label className="text-sm text-[#33483d]">
          Start
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(event) => dispatch(setStartsAt(event.target.value))}
            className="mt-1 w-full rounded-xl border border-[#c6d4cb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#274a3b]"
          />
        </label>
        <label className="text-sm text-[#33483d]">
          End
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(event) => dispatch(setEndsAt(event.target.value))}
            className="mt-1 w-full rounded-xl border border-[#c6d4cb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#274a3b]"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={isBusy}
        onClick={() => dispatch(createBookingEntry())}
        className="mt-4 cursor-pointer rounded-xl bg-[#1f6d58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#185848] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Create booking
      </button>
    </div>
  );
}
