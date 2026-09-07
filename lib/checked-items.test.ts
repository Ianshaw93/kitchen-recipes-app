import { describe, expect, it } from "vitest";
import {
  checklistStorageKey,
  readChecked,
  writeChecked,
} from "./checked-items";

describe("checklist storage", () => {
  it("uses separate keys for ingredients and steps on the same recipe", () => {
    expect(checklistStorageKey("ingredients", "ginisang-hipon")).toBe(
      "kusina:checked:ginisang-hipon",
    );
    expect(checklistStorageKey("steps", "ginisang-hipon")).toBe(
      "kusina:checked:steps:ginisang-hipon",
    );
    expect(checklistStorageKey("ingredients", "ginisang-hipon")).not.toBe(
      checklistStorageKey("steps", "ginisang-hipon"),
    );
  });

  it("reads and writes independently per key", () => {
    const ingredientKey = checklistStorageKey("ingredients", "ginisang-hipon");
    const stepKey = checklistStorageKey("steps", "ginisang-hipon");

    writeChecked(ingredientKey, { prawns: true });
    writeChecked(stepKey, { "0": true });

    expect(readChecked(ingredientKey)).toEqual({ prawns: true });
    expect(readChecked(stepKey)).toEqual({ "0": true });

    writeChecked(stepKey, {});

    expect(readChecked(ingredientKey)).toEqual({ prawns: true });
    expect(readChecked(stepKey)).toEqual({});
  });
});
