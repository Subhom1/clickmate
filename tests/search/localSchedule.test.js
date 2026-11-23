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
