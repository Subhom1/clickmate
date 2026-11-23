import { execFileSync } from "node:child_process";
import path from "node:path";

const helper = path.resolve(__dirname, "../../app/search/localSchedule.js");
function schedule(tz, date, time) {
  const code = `const {resolveLocalSchedule}=require(${JSON.stringify(helper)}); console.log(JSON.stringify(resolveLocalSchedule(${JSON.stringify(date)},${JSON.stringify(time)})))`;
  return JSON.parse(execFileSync(process.execPath, ["-e", code], { env: { ...process.env, TZ: tz }, encoding: "utf8" }));
}

test("New York offsets reflect winter and summer, Singapore has no DST", () => {
  expect(schedule("America/New_York", "2027-01-15", "09:00")).toEqual({ timeZone: "America/New_York", utcOffsetMinutes: -300 });
  expect(schedule("America/New_York", "2027-07-15", "09:00")).toEqual({ timeZone: "America/New_York", utcOffsetMinutes: -240 });
  expect(schedule("Asia/Singapore", "2027-01-15", "22:00")).toEqual({ timeZone: "Asia/Singapore", utcOffsetMinutes: 480 });
});

test("rejects nonexistent spring and ambiguous autumn local times", () => {
  expect(schedule("America/New_York", "2027-03-14", "02:30")).toEqual({ error: "nonexistent" });
  expect(schedule("America/New_York", "2027-11-07", "01:30")).toEqual({ error: "ambiguous" });
});

test("handles half-hour DST transitions and quarter-hour time zones", () => {
  expect(schedule("Australia/Lord_Howe", "2027-10-03", "02:15")).toEqual({ error: "nonexistent" });
  expect(schedule("Australia/Lord_Howe", "2027-04-04", "01:45")).toEqual({ error: "ambiguous" });
  expect(schedule("Asia/Kathmandu", "2027-01-15", "09:00").utcOffsetMinutes).toBe(345);
});

test("rejects unsupported years and malformed time input", () => {
  expect(schedule("UTC", "0099-12-31", "09:00")).toEqual({ error: "invalid" });
  expect(schedule("UTC", "2027-01-15", "24:00")).toEqual({ error: "invalid" });
});
