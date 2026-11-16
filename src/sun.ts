// Sunrise and sunset for a place and day, worked out in the page (the Almanac for
// Computers method, good to a minute or two; no network), and the time of day in a
// place's own time zone. Times are fractions of the local day: 0 midnight, 0.5 noon.
import type { Place } from './places.ts';

const RAD = Math.PI / 180;
const deg = { sin: (d: number) => Math.sin(d * RAD), cos: (d: number) => Math.cos(d * RAD), tan: (d: number) => Math.tan(d * RAD) };
const wrap = (x: number, m: number) => ((x % m) + m) % m;

/** The calendar date and time of day at `when`, in the given time zone. */
export function localTime(when: Date, timeZone: string): { y: number; m: number; d: number; tau: number } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' })
      .formatToParts(when).map((p) => [p.type, Number(p.value)]),
  );
  return { y: parts.year, m: parts.month, d: parts.day, tau: (parts.hour * 3600 + parts.minute * 60 + parts.second) / 86400 };
}

/** Sunrise and sunset on the place's local calendar day containing `when`. */
export function sunTimes(place: Place, when = new Date()): { rise: number; set: number } {
  const { y, m, d } = localTime(when, place.timeZone);
  const N = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
  const lngHour = place.lng / 15;
  const event = (rising: boolean): number => {
    const t = N + ((rising ? 6 : 18) - lngHour) / 24;
    const M = 0.9856 * t - 3.289;
    const L = wrap(M + 1.916 * deg.sin(M) + 0.02 * deg.sin(2 * M) + 282.634, 360);
    let RA = wrap(Math.atan(0.91764 * deg.tan(L)) / RAD, 360);
    RA = (RA + Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90) / 15;
    const sinDec = 0.39782 * deg.sin(L), cosDec = Math.cos(Math.asin(sinDec));
    const cosH = (deg.cos(90.833) - sinDec * deg.sin(place.lat)) / (cosDec * deg.cos(place.lat));
    const Hd = Math.acos(Math.max(-1, Math.min(1, cosH))) / RAD;
    const Hh = (rising ? 360 - Hd : Hd) / 15;
    const UT = wrap(Hh + RA - 0.06571 * t - 6.622 - lngHour, 24);
    // UT hours on that date, read back in the place's own zone (handles daylight saving)
    return localTime(new Date(Date.UTC(y, m - 1, d) + UT * 3600000), place.timeZone).tau;
  };
  return { rise: event(true), set: event(false) };
}
