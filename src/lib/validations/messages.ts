import { z } from "zod";

export const createThreadSchema = z.object({
  other_user_id: z.string().uuid("ID utilisateur invalide"),
  related_type: z.enum(["trip", "parcel"], {
    errorMap: () => ({ message: "Type de relation invalide" }),
  }),
  related_id: z.string().uuid("ID d'annonce invalide"),
});

export const createMessageSchema = z.object({
  thread_id: z.string().uuid("ID de conversation invalide"),
  content: z.string()
    .min(1, "Le message ne peut pas être vide")
    .max(2000, "Message limité à 2000 caractères")
    .trim(),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
