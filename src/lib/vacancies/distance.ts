const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// We have no routing/transit-time API (postcodes.io only geocodes), so commute
// minutes are approximated from straight-line distance at an assumed average
// speed. 30mph is a rough blend of UK urban/suburban drive+rail+walk commuting —
// not measured, just a stated approximation so the "within N minutes" filter is
// usable at all. Flagged to Archie; revisit if a routing API is ever added.
const ASSUMED_COMMUTE_SPEED_MPH = 30;

export function maxCommuteMiles(maxCommuteMinutes: number): number {
  return (maxCommuteMinutes / 60) * ASSUMED_COMMUTE_SPEED_MPH;
}
