"use client";

import { useEffect, useRef } from "react";
import { SHORT_DAYS, buildTimeline } from "@/lib/utils/timeline";
import { toISODate } from "@/lib/utils/dates";

/**
 * Frise chronologique horizontale (sélecteur de date) partagée entre Journal et
 * Sport. Pleine largeur (full-bleed via `-mx`), scroll auto sur la date choisie,
 * point sous chaque jour ayant des données. L'appelant fournit `hasData(iso)`.
 */
export function DateStrip({
  selected,
  onSelect,
  hasData,
  days,
}: {
  selected: string;
  onSelect: (iso: string) => void;
  /** Le jour ISO porte-t-il des données (affiche un point sous la date) ? */
  hasData: (iso: string) => boolean;
  days?: number;
}) {
  const timeline = days ? buildTimeline(days) : buildTimeline();
  const todayIso = toISODate(new Date());
  const selectedDate = new Date(`${selected}T00:00:00`);
  const monthLabel = selectedDate.toLocaleDateString("fr-FR", { month: "long" });
  const stripRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  // Au montage, centrer sur aujourd'hui (les jours à venir restent accessibles à droite).
  useEffect(() => {
    todayRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, []);

  return (
    <div className="-mx-4 sm:-mx-5">
      <p className="px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
        {monthLabel}
      </p>
      <div
        ref={stripRef}
        role="tablist"
        aria-label="Choisir une date"
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 pt-2 sm:px-5 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {timeline.map((day) => {
          const iso = toISODate(day);
          const isSelected = iso === selected;
          const isToday = iso === todayIso;
          const has = hasData(iso);
          return (
            <button
              key={iso}
              ref={isSelected ? selectedRef : isToday ? todayRef : undefined}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelect(iso)}
              className={`flex w-12 shrink-0 snap-center flex-col items-center gap-1 rounded-2xl px-1 py-2 transition ${
                isSelected
                  ? "gradient-accent text-white"
                  : "neu-surface-sm text-muted-foreground hover:text-foreground"
              }`}
              style={{
                boxShadow: isSelected
                  ? "0 6px 14px -5px rgba(0,0,0,0.30), 0 16px 28px -12px rgba(198,74,214,0.42)"
                  : undefined,
              }}
            >
              <span className={`text-[10px] uppercase tracking-wide ${isSelected ? "text-white/80" : ""}`}>
                {SHORT_DAYS[day.getDay()]}
              </span>
              <span className={`text-base font-semibold ${isSelected ? "text-white" : "text-foreground"}`}>
                {day.getDate()}
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full transition ${
                  has
                    ? isSelected
                      ? "bg-white"
                      : "bg-accent-gradient gradient-accent"
                    : "bg-transparent"
                } ${isToday && !isSelected ? "ring-2 ring-primary/40" : ""}`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
