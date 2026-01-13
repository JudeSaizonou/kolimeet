import { useThreads } from "@/hooks/useThreads";
import { useAuth } from "@/hooks/useAuth";
import { ThreadCard } from "@/components/messaging/ThreadCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { MessageSquare } from "lucide-react";
import { Outlet, useParams } from "react-router-dom";

const MessagesLayout = () => {
  const { user } = useAuth();
  const { threads, loading } = useThreads();
  const { id } = useParams();

  return (
    <div className="pt-20 md:pt-32 h-screen">
      <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-7rem)]">
        {/* Mobile: full page, Desktop: split view */}
        <div className="h-full flex md:border md:border-border md:rounded-lg md:overflow-hidden md:shadow-sm md:mx-4 lg:mx-8">
        {/* Sidebar - Liste des conversations */}
        <aside
          className={`
            w-full md:w-96 lg:w-[400px] 
            md:border-r md:border-border bg-background
            ${id ? 'hidden md:block' : 'block'}
          `}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-3 md:px-6 py-3 md:py-5 border-b">
              <h1 className="text-xl md:text-3xl font-bold">Messagerie</h1>
            </div>

            {/* Liste scrollable */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : threads.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={MessageSquare}
                    title="Aucune conversation"
                    description="Vos conversations apparaîtront ici après avoir contacté un voyageur ou un expéditeur."
                  />
                </div>
              ) : (
                <div className="p-3 md:p-4 space-y-2">
                  {threads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      id={thread.id}
                      otherUser={thread.other_user!}
                      lastMessage={thread.last_message}
                      lastMessageAt={thread.last_message_at}
                      unreadCount={thread.unread_count || 0}
                      currentUserId={user?.id || ""}
                      isActive={thread.id === id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Zone de conversation */}
        <main
          className={`
            flex-1 bg-background
            ${!id ? 'hidden md:flex' : 'flex'}
          `}
        >
          {id ? (
            <Outlet />
          ) : (
            <div className="hidden md:flex items-center justify-center w-full h-full">
              <EmptyState
                icon={MessageSquare}
                title="Sélectionnez une conversation"
                description="Choisissez une conversation dans la liste pour commencer à discuter."
              />
            </div>
          )}
        </main>
        </div>
      </div>
    </div>
  );
};

export default MessagesLayout;
