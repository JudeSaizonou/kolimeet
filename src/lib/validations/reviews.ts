import { z } from "zod";

export const createReviewSchema = z.object({
  target_user_id: z.string().uuid("ID utilisateur invalide"),
  rating: z.number()
    .int("La note doit être un nombre entier")
    .min(1, "Note minimale : 1")
    .max(5, "Note maximale : 5"),
  comment: z.string()
    .max(1000, "Commentaire limité à 1000 caractères")
    .optional()
    .transform(val => val?.trim()),
});

export const updateReviewSchema = z.object({
  rating: z.number()
    .int("La note doit être un nombre entier")
    .min(1, "Note minimale : 1")
    .max(5, "Note maximale : 5")
    .optional(),
  comment: z.string()
    .max(1000, "Commentaire limité à 1000 caractères")
    .optional()
    .transform(val => val?.trim()),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
