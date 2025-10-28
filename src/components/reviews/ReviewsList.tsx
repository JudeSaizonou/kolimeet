import { ReviewCard } from "./ReviewCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReviews } from "@/hooks/useReviews";

interface ReviewsListProps {
  targetUserId: string;
}

export function ReviewsList({ targetUserId }: ReviewsListProps) {
  const { reviews, loading, hasMore, loadMore } = useReviews(targetUserId);

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucun avis pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          reviewerName={review.reviewer?.full_name || null}
          reviewerAvatar={review.reviewer?.avatar_url || null}
          rating={review.rating}
          comment={review.comment}
          createdAt={review.created_at}
        />
      ))}

      {hasMore && (
        <Button
          variant="outline"
          onClick={loadMore}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Chargement..." : "Voir plus"}
        </Button>
      )}
    </div>
  );
}
