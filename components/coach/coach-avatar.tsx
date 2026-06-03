"use client";

import { getCoachAvatar } from "@/lib/coach-avatars";
import { cn } from "@/lib/utils/cn";

export function CoachAvatarBadge({
  avatarId,
  size = 28,
  className
}: {
  avatarId?: string;
  size?: number;
  className?: string;
}) {
  const avatar = getCoachAvatar(avatarId);
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: avatar.gradient,
        fontSize: size * 0.52,
        lineHeight: 1
      }}
    >
      {avatar.emoji}
    </span>
  );
}
