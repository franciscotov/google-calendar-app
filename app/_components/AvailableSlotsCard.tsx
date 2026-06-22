import type { TimeSlot } from "../_lib/types";
import { slotFormatter } from "../_lib/utils";

type AvailableSlotsCardProps = {
  availableSlots: TimeSlot[];
  onApplySlot: (slotStart: Date, slotEnd: Date) => void;
};

export function AvailableSlotsCard({
  availableSlots,
  onApplySlot,
}: AvailableSlotsCardProps) {
  return (
    <section className="rounded-3xl border border-[#dbe5dd] bg-white p-6 shadow-[0_20px_40px_-25px_rgba(28,46,38,0.5)] md:p-8">
      <h2 className="font-display text-2xl">Available slots</h2>
      <p className="mt-2 text-sm text-[#4c6155]">
        These are system-available one-hour slots for the next 7 days. Google conflicts are
        checked on booking confirmation.
      </p>

      <div className="mt-5 max-h-[34rem] space-y-2 overflow-auto pr-1">
        {availableSlots.length === 0 ? (
          <p className="text-sm text-[#4c6155]">No system-available slots found.</p>
        ) : (
          availableSlots.map((slot) => (
            <button
              key={`${slot.startsAt.toISOString()}-${slot.endsAt.toISOString()}`}
              type="button"
              onClick={() => onApplySlot(slot.startsAt, slot.endsAt)}
              className="w-full cursor-pointer rounded-xl border border-[#d8e3dc] bg-[#fbfdfc] px-3 py-2 text-left text-sm font-medium text-[#274a3b] transition hover:border-[#274a3b] hover:bg-[#f1f7f3]"
            >
              {slotFormatter.format(slot.startsAt)} - {slotFormatter.format(slot.endsAt)}
            </button>
          ))
        )}
      </div>
    </section>
  );
}
