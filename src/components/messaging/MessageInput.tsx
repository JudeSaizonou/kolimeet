import { useState, FormEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const MessageInput = ({ onSend, onTyping, disabled }: MessageInputProps) => {
  const [content, setContent] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping?.(false);
    };
  }, [onTyping]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Notify typing status
    if (onTyping) {
      console.log('[MessageInput] ⌨️ User is typing, calling onTyping(true)');
      onTyping(true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        console.log('[MessageInput] ⏱️ Typing timeout, calling onTyping(false)');
        onTyping(false);
      }, 2000);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled) return;

    // Stop typing indicator when sending
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    console.log('[MessageInput] 📤 Sending message, calling onTyping(false)');
    onTyping?.(false);

    onSend(content);
    setContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-background p-3 md:p-4 safe-bottom">
      <div className="flex gap-2 items-end">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          disabled={disabled}
          className="min-h-[44px] max-h-[120px] resize-none text-base md:text-sm flex-1"
          maxLength={2000}
          rows={1}
          aria-label="Champ de message"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || disabled}
          className="h-11 w-11 md:h-12 md:w-12 shrink-0"
          aria-label="Envoyer le message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      {content.length > 1800 && (
        <p className="text-xs text-muted-foreground mt-2 ml-1">
          {content.length}/2000 caractères
        </p>
      )}
    </form>
  );
};
