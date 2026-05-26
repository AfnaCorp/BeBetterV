import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils/cn";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 md:max-w-[74%]",
          isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
