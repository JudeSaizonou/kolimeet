import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useReviews } from "@/hooks/useReviews";
import { createReviewSchema } from "@/lib/validations/reviews";

interface ReviewFormProps {
  targetUserId: string;
  targetUserName: string;
  onSuccess?: () => void;
}

export function ReviewForm({
  targetUserId,
  targetUserName,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { createReview } = useReviews(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      // Validate
      createReviewSchema.parse({
        target_user_id: targetUserId,
        rating,
        comment: comment || undefined,
      });

      setSubmitting(true);

      await createReview(targetUserId, rating, comment);

      toast({
        title: "Avis publié",
        description: "Merci pour votre retour !",
      });

      // Reset form
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          error.message || "Impossible de publier l'avis pour le moment",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-base">
          Notez votre expérience avec {targetUserName}
        </Label>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? "fill-[#F59E0B] text-[#F59E0B]"
                    : "text-[#E5E7EB]"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {rating === 1 && "Très insatisfait"}
            {rating === 2 && "Insatisfait"}
            {rating === 3 && "Correct"}
            {rating === 4 && "Satisfait"}
            {rating === 5 && "Très satisfait"}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="comment">Commentaire (optionnel)</Label>
        <Textarea
          id="comment"
          placeholder="Partagez votre expérience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={300}
          className="mt-2"
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {comment.length}/300
        </p>
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || submitting}
        className="w-full"
      >
        {submitting ? "Publication..." : "Publier l'avis"}
      </Button>
    </form>
  );
}
