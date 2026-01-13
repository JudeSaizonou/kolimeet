import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Profile } from "@/integrations/supabase/types";

interface UserBadgeProps {
  user?: Pick<Profile, "user_id" | "full_name" | "avatar_url" | "trust_score"> | null;
  showTrustScore?: boolean;
  className?: string;
  onClick?: () => void;
}

export function UserBadge({
  user,
  showTrustScore = true,
  className,
  onClick,
}: UserBadgeProps) {
  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "bg-emerald-100 text-emerald-700";
    if (score >= 60) return "bg-blue-100 text-blue-700";
    if (score >= 40) return "bg-amber-100 text-amber-700";
    return "bg-rose-100 text-rose-700";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
      onClick={onClick}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || ""} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{user?.full_name || "Sans nom"}</span>
        {showTrustScore && user?.trust_score !== undefined && (
          <Badge
            variant="secondary"
            className={cn("text-xs font-semibold", getTrustScoreColor(user.trust_score))}
          >
            {user.trust_score}
          </Badge>
        )}
      </div>
    </div>
  );
}
