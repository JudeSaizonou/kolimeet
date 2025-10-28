import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ReviewCardProps {
  reviewerName: string | null;
  reviewerAvatar: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export function ReviewCard({
  reviewerName,
  reviewerAvatar,
  rating,
  comment,
  createdAt,
}: ReviewCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={reviewerAvatar || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {reviewerName?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="font-medium text-sm">{reviewerName || "Anonyme"}</p>
            <time className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </time>
          </div>

          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < rating
                    ? "fill-[#F59E0B] text-[#F59E0B]"
                    : "text-[#E5E7EB]"
                }`}
              />
            ))}
          </div>

          {comment && (
            <p className="text-sm text-foreground leading-relaxed">
              {comment}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
