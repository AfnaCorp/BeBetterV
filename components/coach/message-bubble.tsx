"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ChatMessage } from "@/types";
import { cn } from "@/lib/utils/cn";
import { Markdown } from "./markdown";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const reduce = useReducedMotion();
  return (
    <motion.div
      layout
      initial={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, y: 12, scale: 0.96 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 md:max-w-[74%]",
          // Messages user : texte brut (préserve les retours à la ligne). Coach :
          // rendu Markdown (gras, listes, titres légers).
          isUser ? "whitespace-pre-line bg-accent-gradient text-white" : "neu-surface-sm text-foreground"
        )}
      >
        {isUser ? message.content : <Markdown content={message.content} />}
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
    </motion.div>
  );
}
