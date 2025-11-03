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
    <form onSubmit={handleSubmit} className="border-t bg-background p-4">
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Votre message..."
          disabled={disabled}
          className="min-h-[60px] resize-none"
          maxLength={2000}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || disabled}
          className="h-[60px] w-[60px] shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {content.length}/2000 caractères
      </p>
    </form>
  );
};
