import { useThreads } from "@/hooks/useThreads";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { ThreadCard } from "@/components/messaging/ThreadCard";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const { threads, loading } = useThreads();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Messagerie</h1>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Aucune conversation
              </h2>
              <p className="text-muted-foreground">
                Vos conversations apparaîtront ici
              </p>
            </div>
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
      </main>

      <Footer />
    </div>
  );
};

export default Messages;
