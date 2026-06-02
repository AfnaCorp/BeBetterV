import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils/cn";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-6 md:max-w-[74%]",
          isUser ? "bg-accent-gradient text-white" : "neu-surface-sm text-foreground"
        )}
      >
        {message.content}
        {message.writes && message.writes.length > 0 && (
          <div className="mt-3 space-y-1 border-t border-foreground/10 pt-2 text-xs text-muted-foreground">
            {message.writes.map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-accent-gradient" />
                {w.summary}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
