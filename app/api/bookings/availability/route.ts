import { apiHandler, jsonError, jsonOk } from "@/lib/http";
import { getSettings } from "@/lib/settings";
import { hoursForDate, slotsForDate, todayISO } from "@/lib/booking";
import { getServiceById } from "@/lib/data/bookings";

/**
 * Public availability feed for the booking widget: opening hours for the
 * requested date plus which start hours are already taken (or in the past).
 */
export const GET = apiHandler(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const date = params.get("date") ?? "";
  const hours = Math.max(1, Math.min(Number.parseInt(params.get("hours") ?? "1", 10) || 1, 16));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonError("Pick a date first", 422);
  if (date < todayISO()) return jsonOk({ closed: true, slots: [] });

  const settings = await getSettings();
  const day = hoursForDate(settings, date);
  if (!day) return jsonOk({ closed: true, slots: [] });

  // Cap by the chosen service's max so the grid never shows impossible slots.
  const serviceId = params.get("serviceId");
  let maxHours = hours;
  if (serviceId) {
    const service = getServiceById(serviceId);
    if (service) maxHours = Math.min(hours, service.maxHours);
  }

  const result = slotsForDate({ settings, dateISO: date, hours: maxHours });
  if (!result) return jsonOk({ closed: true, slots: [] });

  return jsonOk({
    closed: false,
    open: result.open,
    close: result.close,
    slots: result.slots,
  });
});
