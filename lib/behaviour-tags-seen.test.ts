import { describe, expect, it } from "vitest";
import { SEEN_TAGS_STORAGE_KEY, markTagsSeen, readSeenTagIds, unseenTagIds } from "./behaviour-tags-seen";

describe("seen behaviour tags (per device)", () => {
  it("stores seen ids in localStorage under a Kusina key", () => {
    expect(SEEN_TAGS_STORAGE_KEY).toBe("kusina:us:seen-behaviour-tags");
    expect(readSeenTagIds()).toEqual([]);

    markTagsSeen(["a", "b"]);
    expect(JSON.parse(window.localStorage.getItem(SEEN_TAGS_STORAGE_KEY) ?? "null")).toEqual(["a", "b"]);
    expect(readSeenTagIds()).toEqual(["a", "b"]);
  });

  it("keeps earlier seen ids when marking more", () => {
    markTagsSeen(["a"]);
    markTagsSeen(["b"]);
    expect(readSeenTagIds().sort()).toEqual(["a", "b"]);
  });

  it("treats garbage in storage as nothing seen", () => {
    window.localStorage.setItem(SEEN_TAGS_STORAGE_KEY, "{not json");
    expect(readSeenTagIds()).toEqual([]);
    window.localStorage.setItem(SEEN_TAGS_STORAGE_KEY, JSON.stringify({ a: true }));
    expect(readSeenTagIds()).toEqual([]);
    window.localStorage.setItem(SEEN_TAGS_STORAGE_KEY, JSON.stringify(["a", 3, null]));
    expect(readSeenTagIds()).toEqual(["a"]);
  });

  it("finds unseen ids, and nothing for a device that has seen everything", () => {
    expect(unseenTagIds(["a", "b", "c"], ["b"])).toEqual(["a", "c"]);
    expect(unseenTagIds(["a", "b"], ["a", "b", "old"])).toEqual([]);
    expect(unseenTagIds([], [])).toEqual([]);
  });
});
