// Search times are selected in the device's local zone, not the server's zone.
function resolveLocalSchedule(date, time) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) return { error: 'invalid' };
  const [, y, m, d] = dateMatch.map(Number);
  const [, h, min] = timeMatch.map(Number);
  if (y < 100 || m < 1 || m > 12 || d < 1 || d > 31 || h > 23 || min > 59) return { error: 'invalid' };
  const local = new Date(y, m - 1, d, h, min, 0, 0);
  const matches = (value) => value.getFullYear() === y && value.getMonth() === m - 1 &&
    value.getDate() === d && value.getHours() === h && value.getMinutes() === min;
  if (!matches(local)) return { error: 'nonexistent' };

  // Sample the zone offsets around the selected instant, then round-trip each
  // candidate. This detects repeated local times without silently choosing one.
  const offsets = new Set();
  for (let hour = -48; hour <= 48; hour += 1) {
    offsets.add(new Date(local.getTime() + hour * 3600000).getTimezoneOffset());
  }
  const naive = Date.UTC(y, m - 1, d, h, min);
  const occurrences = [...offsets].map((offset) => new Date(naive + offset * 60000)).filter(matches);
  if (occurrences.length !== 1) return { error: occurrences.length ? 'ambiguous' : 'nonexistent' };
  let timeZone;
  try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* unavailable on this device */ }
  if (!timeZone || typeof timeZone !== 'string') return { error: 'timezone' };
  return { timeZone, utcOffsetMinutes: -occurrences[0].getTimezoneOffset() };
}

module.exports = { resolveLocalSchedule };
