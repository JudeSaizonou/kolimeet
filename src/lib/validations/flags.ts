import { z } from "zod";

export const createFlagSchema = z.object({
  entity_type: z.enum(["trip", "parcel", "message", "profile"], {
    errorMap: () => ({ message: "Type d'entité invalide" }),
  }),
  entity_id: z.string().uuid("ID d'entité invalide"),
  reason: z.string()
    .min(10, "La raison doit contenir au moins 10 caractères")
    .max(500, "Raison limitée à 500 caractères")
    .trim(),
});

export type CreateFlagInput = z.infer<typeof createFlagSchema>;
