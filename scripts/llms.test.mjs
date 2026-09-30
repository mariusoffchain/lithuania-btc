import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) =>
  readFile(new URL(`../public-build/${path}`, import.meta.url), "utf8");
test("LLM reading guide points to generated resources with honest dates and country filtering", async () => {
  const guide = await read("llms.txt");
  for (const file of ["overview", "events", "merchants"]) {
    assert.ok(guide.includes(`/read/${file}.md`));
    assert.ok((await read(`read/${file}.md`)).startsWith("# "));
  }
  const events = await read("read/events.md");
  assert.ok(events.includes("Date and location to be announced."));
  assert.ok(events.includes("2026-09-27T13:00:00+03:00"));
  assert.ok(!events.includes("undefined"));
  const merchants = await read("read/merchants.md");
  assert.ok(merchants.includes("2026-09-29"));
  assert.ok(merchants.includes("Zolak"));
  assert.ok(!merchants.includes("Piercing4u"));
  assert.equal((merchants.match(/^## /gm) || []).length, 8);
});
