import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  inCountry,
  filterPlaces,
  dateKey,
  eventGroups,
  safeURL,
  ics,
} from "../domain.js";
const boundary = JSON.parse(
  await readFile(new URL("../data/lithuania.geojson", import.meta.url)),
);
const snapshot = JSON.parse(
  await readFile(new URL("../data/merchants-snapshot.json", import.meta.url)),
);
const events = JSON.parse(
  await readFile(new URL("../data/events.json", import.meta.url)),
);
test("Lithuania contains Vilnius, excludes Riga and Kaliningrad", () => {
  assert.equal(inCountry({ lat: 54.6872, lon: 25.2797 }, boundary), true);
  assert.equal(inCountry({ lat: 56.9496, lon: 24.1052 }, boundary), false);
  assert.equal(inCountry({ lat: 54.7104, lon: 20.4522 }, boundary), false);
});
test("Polygon holes, deletion and duplicate records are excluded", () => {
  const b = {
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
        [
          [4, 4],
          [6, 4],
          [6, 6],
          [4, 6],
          [4, 4],
        ],
      ],
    },
  };
  assert.equal(inCountry({ lon: 5, lat: 5 }, b), false);
  assert.equal(
    filterPlaces(
      [
        { id: 1, lat: 2, lon: 2 },
        { id: 1, lat: 2, lon: 2 },
        { id: 2, lat: 2, lon: 2, deleted_at: "2026-01-01" },
        { id: 3, lat: NaN, lon: 2 },
      ],
      b,
    ).length,
    1,
  );
});
test("Real snapshot produces 8 Lithuanian places", () =>
  assert.equal(filterPlaces(snapshot.places, boundary).length, 8));
test("Dates use Vilnius midnight in summer and winter", () => {
  assert.equal(dateKey("2026-08-06T21:30:00Z"), "2026-08-07");
  assert.equal(dateKey("2026-01-06T22:30:00Z"), "2026-01-07");
});
test("An ongoing event stays upcoming; archive order is newest first", () => {
  const original = events.filter((e) =>
    ["2026-08-06-fed", "2026-07-02-farmer", "2026-06-04-ekasi"].includes(e.id),
  );
  const groups = eventGroups(original, new Date("2026-08-06T16:00:00Z"));
  assert.equal(groups.upcoming.length, 1);
  assert.equal(groups.past.length, 2);
  assert.equal(eventGroups(events, new Date("2026-09-30")).upcoming.length, 0);
  assert.equal(
    eventGroups(events, new Date("2026-09-30")).past[0].start,
    events.find((e) => e.id === "meetup-315774816").start,
  );
});
test("Unsafe external URLs are rejected", () => {
  assert.equal(safeURL("javascript:alert(1)"), null);
  assert.equal(safeURL("data:text/html,test"), null);
  assert.equal(safeURL("https://btcmap.org/"), "https://btcmap.org/");
});
test("ICS exports actual UTC times and escapes event text", () => {
  const e = {
    ...events.find((e) => e.id === "2026-08-06-fed"),
    title: { en: "Test, event; one" },
    description: { en: "Line 1\nLine 2" },
  };
  const out = ics(e);
  assert.ok(out.includes("DTSTART:20260806T150000Z"));
  assert.ok(out.includes("DTEND:20260806T170000Z"));
  assert.ok(out.includes("SUMMARY:Test\\, event\\; one"));
  assert.ok(out.includes("DESCRIPTION:Line 1\\nLine 2"));
  assert.ok(out.endsWith("END:VCALENDAR\r\n"));
});

test("ICS folds long UTF-8 content without splitting characters", () => {
  const e = {
    ...events.find((e) => e.id === "meetup-315774816"),
    description: { en: "Žąsis ".repeat(45) + "\r\nNext line" },
  };
  const out = ics(e);
  for (const line of out.split("\r\n"))
    assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  const unfolded = out.replace(/\r\n /g, "");
  assert.ok(
    unfolded.includes("DESCRIPTION:" + "Žąsis ".repeat(45) + "\\nNext line"),
  );
});

test("Undated planned events stay separate and cannot generate calendar entries", () => {
  const groups = eventGroups(events, new Date("2030-01-01"));
  assert.equal(groups.planned.length, 2);
  assert.equal(groups.past.length, 5);
  assert.equal(groups.upcoming.length, 0);
  for (const event of groups.planned) {
    assert.equal(event.start, undefined);
    assert.throws(() => ics(event), /date is not confirmed/);
  }
});
