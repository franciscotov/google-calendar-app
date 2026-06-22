import type { Booking } from "../_lib/types";
import { slotFormatter } from "../_lib/utils";

type YourBookingsCardProps = {
  bookings: Booking[];
  isBusy: boolean;
  onCancelBooking: (bookingId: string) => Promise<void>;
};

export function YourBookingsCard({
  bookings,
  isBusy,
  onCancelBooking,
}: YourBookingsCardProps) {
  return (
    <div className="rounded-2xl border border-[#dbe5dd] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-xl">Your bookings</h3>
        <span className="rounded-full bg-[#ecf4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#5a7266]">
          {bookings.length} total
        </span>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-[#4c6155]">No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="rounded-xl border border-[#dbe5dd] bg-[#f9fcfa] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-[#1f2e27]">{booking.title}</h4>
                  <p className="text-sm text-[#4c6155]">
                    {slotFormatter.format(new Date(booking.startsAt))} - {" "}
                    {slotFormatter.format(new Date(booking.endsAt))}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onCancelBooking(booking.id)}
                  disabled={isBusy}
                  className="cursor-pointer rounded-lg border border-[#b45d5d] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#b45d5d] transition hover:bg-[#b45d5d] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
