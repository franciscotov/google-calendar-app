type ConnectCalendarCardProps = {
  calendarIdInput: string;
  connectedCalendarId: string;
  defaultCalendarId: string;
  isBusy: boolean;
  onCalendarIdChange: (value: string) => void;
  onConnectCalendar: () => Promise<void>;
};

export function ConnectCalendarCard({
  calendarIdInput,
  connectedCalendarId,
  defaultCalendarId,
  isBusy,
  onCalendarIdChange,
  onConnectCalendar,
}: ConnectCalendarCardProps) {
  return (
    <div className="rounded-2xl border border-[#dbe5dd] bg-[#f6faf7] p-5">
      <h3 className="font-display text-xl">Connect Google Calendar</h3>
      <p className="mt-1 text-sm text-[#4c6155]">
        Use your primary email calendar ID or any Google Calendar ID you want to check.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={calendarIdInput}
          onChange={(event) => onCalendarIdChange(event.target.value)}
          placeholder={defaultCalendarId}
          className="w-full rounded-xl border border-[#c6d4cb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#274a3b]"
        />

        <button
          type="button"
          disabled={isBusy}
          onClick={onConnectCalendar}
          className="cursor-pointer rounded-xl bg-[#274a3b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f3b30] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {connectedCalendarId ? "Update calendar" : "Connect calendar"}
        </button>
      </div>

      {connectedCalendarId && (
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#5b7467]">
          Connected calendar: {connectedCalendarId}
        </p>
      )}
    </div>
  );
}
