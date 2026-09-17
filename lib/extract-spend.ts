import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { isEmptyDraft, spendDraftFromOutput, type ExtractResult } from "./receipt-draft";

export const RECEIPT_MODEL = "google/gemini-3.8-flash";

const extractedSpendSchema = z.object({
  amountPounds: z.union([z.number(), z.string()]).nullish(),
  description: z.string().nullish(),
  date: z.string().nullish(),
  paidBy: z.string().nullish(),
  note: z.string().nullish(),
});

type GenerateFn = typeof generateText;

export async function extractSpendFromImage(params: {
  image: Uint8Array;
  mediaType: string;
  generate?: GenerateFn;
  model?: LanguageModel | string;
}): Promise<ExtractResult> {
  const generate = params.generate ?? generateText;
  const model = params.model ?? RECEIPT_MODEL;
  const error = "Could not read that screenshot. Try another photo or type it in.";

  try {
    const result = await generate({
      model,
      instructions:
        "Extract one household spend from a screenshot (receipt, bank app, Monzo, supermarket). " +
        "Ian and Avery share spends in the UK, so amounts are pounds sterling. " +
        "paidBy must be Ian or Avery only if the screenshot clearly shows which of them paid; otherwise null. " +
        "date must be YYYY-MM-DD if visible, otherwise null. " +
        "description is a short what-it-was-for (shop or item), not a full receipt dump. " +
        "note is extra useful detail or null.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Read this screenshot and extract the spend." },
            { type: "file", mediaType: params.mediaType, data: params.image },
          ],
        },
      ],
      output: Output.object({ schema: extractedSpendSchema }),
      ...(typeof model === "string"
        ? { providerOptions: { gateway: { tags: ["feature:payments-receipt"] } } }
        : {}),
    });

    const draft = spendDraftFromOutput(result.output ?? {});
    if (isEmptyDraft(draft)) {
      return { ok: false, error };
    }

    return { ok: true, draft };
  } catch {
    return { ok: false, error };
  }
}
