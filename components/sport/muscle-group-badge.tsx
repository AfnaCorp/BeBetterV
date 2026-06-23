import type { MuscleGroup } from "@/types/muscle";
import { MUSCLE_GROUP_COLORS, MUSCLE_GROUP_LABELS } from "@/types/muscle";

/**
 * Repère visuel sobre d'un groupe musculaire : pastille colorée + libellé (par
 * défaut), ou simple point coloré (`label={false}`) pour les contextes denses.
 * La couleur vient de `MUSCLE_GROUP_COLORS` — cohérente partout dans l'app.
 */
export function MuscleGroupBadge({
  group,
  label = true,
}: {
  group: MuscleGroup;
  /** Afficher le nom du groupe à côté du point (pastille). Sinon, point seul. */
  label?: boolean;
}) {
  const c = MUSCLE_GROUP_COLORS[group];

  if (!label) {
    return (
      <span
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${c.dot}`}
        title={MUSCLE_GROUP_LABELS[group]}
        aria-label={MUSCLE_GROUP_LABELS[group]}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ${c.pill}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} aria-hidden />
      {MUSCLE_GROUP_LABELS[group]}
    </span>
  );
}
