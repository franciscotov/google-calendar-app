type CreateBookingCardProps = {
  title: string;
  startsAt: string;
  endsAt: string;
  isBusy: boolean;
  onTitleChange: (value: string) => void;
  onStartsAtChange: (value: string) => void;
  onEndsAtChange: (value: string) => void;
  onCreateBooking: () => Promise<void>;
};

export function CreateBookingCard({
  title,
  startsAt,
  endsAt,
  isBusy,
  onTitleChange,
  onStartsAtChange,
  onEndsAtChange,
  onCreateBooking,
}: CreateBookingCardProps) {
  return (
    <div className="rounded-2xl border border-[#dbe5dd] bg-[#fcfdfb] p-5">
      <h3 className="font-display text-xl">Create booking</h3>
      <p className="mt-1 text-sm text-[#4c6155]">
        The backend verifies conflicts with system bookings and Google Calendar before confirming.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <input
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Booking title"
          className="rounded-xl border border-[#c6d4cb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#274a3b] md:col-span-2"
        />
        <label className="text-sm text-[#33483d]">
          Start
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(event) => onStartsAtChange(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#c6d4cb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#274a3b]"
          />
        </label>
        <label className="text-sm text-[#33483d]">
          End
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(event) => onEndsAtChange(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#c6d4cb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#274a3b]"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={isBusy}
        onClick={onCreateBooking}
        className="mt-4 cursor-pointer rounded-xl bg-[#1f6d58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#185848] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Create booking
      </button>
    </div>
  );
}
