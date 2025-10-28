import { useThreads } from "@/hooks/useThreads";
import { useAuth } from "@/hooks/useAuth";
import { ThreadCard } from "@/components/messaging/ThreadCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { MessageSquare } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const { threads, loading } = useThreads();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Messagerie</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : threads.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Aucune conversation"
            description="Vos conversations apparaîtront ici après avoir contacté un voyageur ou un expéditeur."
          />
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                id={thread.id}
                otherUser={thread.other_user!}
                lastMessage={thread.last_message}
                lastMessageAt={thread.last_message_at}
                unreadCount={thread.unread_count || 0}
                currentUserId={user?.id || ""}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
