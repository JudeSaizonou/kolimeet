import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ThreadCardProps {
  id: string;
  otherUser: {
    full_name: string;
    avatar_url?: string;
  };
  lastMessage?: {
    content: string;
    sender_id: string;
  };
  lastMessageAt: string;
  unreadCount: number;
  currentUserId: string;
  isActive?: boolean;
}

export const ThreadCard = ({
  id,
  otherUser,
  lastMessage,
  lastMessageAt,
  unreadCount,
  currentUserId,
  isActive = false,
}: ThreadCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className={`cursor-pointer transition-all ${
        isActive 
          ? 'bg-primary/5 border-primary/50 shadow-sm' 
          : 'hover:bg-muted/50'
      }`}
      onClick={() => navigate(`/messages/${id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={otherUser.avatar_url} />
            <AvatarFallback>{otherUser.full_name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold truncate">{otherUser.full_name}</h3>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(lastMessageAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>

            {lastMessage && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground truncate flex-1">
                  {lastMessage.sender_id === currentUserId && "Vous : "}
                  {lastMessage.content}
                </p>
                {unreadCount > 0 && (
                  <Badge variant="default" className="shrink-0">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
