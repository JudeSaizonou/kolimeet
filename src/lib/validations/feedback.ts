import { z } from "zod";

export const createFeedbackSchema = z.object({
  message: z.string()
    .min(1, "Le message ne peut pas être vide")
    .max(1000, "Message limité à 1000 caractères")
    .trim(),
  category: z.enum(["bug", "suggestion", "autre"], {
    errorMap: () => ({ message: "Catégorie invalide" }),
  }),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
