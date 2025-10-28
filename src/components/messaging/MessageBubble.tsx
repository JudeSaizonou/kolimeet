import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isOwn: boolean;
}

export const MessageBubble = ({
  content,
  createdAt,
  isOwn,
}: MessageBubbleProps) => {
  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-4 py-2",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
        <span
          className={cn(
            "text-xs mt-1 block",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {format(new Date(createdAt), "HH:mm", { locale: fr })}
        </span>
      </div>
    </div>
  );
};
