import { generateText } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { extractSpendFromImage } from "./extract-spend";

describe("extractSpendFromImage", () => {
  it("returns a form draft from a vision model", async () => {
    const result = await extractSpendFromImage({
      image: new Uint8Array([1, 2, 3]),
      mediaType: "image/png",
      generate: generateText,
      model: new MockLanguageModelV4({
        doGenerate: async () => ({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                amountPounds: 8.4,
                description: "Pret a Manger",
                date: "2026-09-16",
                paidBy: "Ian",
                note: "card ending 4412",
              }),
            },
          ],
          finishReason: { unified: "stop", raw: undefined },
          usage: {
            inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
            outputTokens: { total: 20, text: 20, reasoning: undefined },
          },
          warnings: [],
        }),
      }),
    });

    expect(result).toEqual({
      ok: true,
      draft: {
        amount: "8.40",
        description: "Pret a Manger",
        date: "2026-09-16",
        paidBy: "Ian",
        note: "card ending 4412",
      },
    });
  });

  it("returns an error when the model output is empty", async () => {
    const result = await extractSpendFromImage({
      image: new Uint8Array([1, 2, 3]),
      mediaType: "image/png",
      generate: generateText,
      model: new MockLanguageModelV4({
        doGenerate: async () => ({
          content: [{ type: "text", text: "{}" }],
          finishReason: { unified: "stop", raw: undefined },
          usage: {
            inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
            outputTokens: { total: 1, text: 1, reasoning: undefined },
          },
          warnings: [],
        }),
      }),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/could not read/i);
    }
  });
});
