"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useAppData } from "@/components/app-data-provider";
import { setCoachHint } from "@/lib/coach-feedback";
import { ProgramEditor, type ProgramDraftValue } from "@/components/sport/program-editor";

/** Nombre maximum de programmes par utilisateur. */
const MAX_PROGRAMS = 3;

function ProgramEdit() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const { profile, programs, addProgram, updateProgram } = useAppData();

  // Onglet courant : le programme `?id=`, sinon (création) le 1er programme s'il en
  // existe — on n'ouvre la création vierge que via l'onglet « + ».
  const creating = id === "new" || (!id && programs.length === 0);
  const currentId = creating ? null : id ?? programs[0]?.id ?? null;
  const program = currentId ? programs.find((p) => p.id === currentId) : undefined;

  const userName = profile?.name?.trim();
  const defaultName = userName ? `Programme de ${userName}` : "Mon programme";

  // Petite incitation « sortant » du coach : proposer de remplir le programme à la
  // place de l'utilisateur. Affichée pendant la création, retirée en quittant la page.
  useEffect(() => {
    if (!creating) return;
    setCoachHint("Pas envie de tout remplir à la main ? Dis-moi ton programme, je m'en occupe");
    return () => setCoachHint(null);
  }, [creating]);

  // Programme à modifier (si onglet existant), sinon création. On clone les sessions
  // pour ne pas muter l'objet du contexte temps réel pendant l'édition.
  const initial: ProgramDraftValue = program
    ? { name: program.name, sessions: JSON.parse(JSON.stringify(program.sessions)), active: program.active }
    : { name: defaultName, sessions: [] };

  async function handleSave(draft: ProgramDraftValue) {
    if (program) {
      await updateProgram(program.id, draft);
    } else {
      // Garde-fou : on ne crée pas au-delà du maximum (l'UI masque déjà l'onglet +).
      if (programs.length >= MAX_PROGRAMS) {
        router.push("/sport");
        return;
      }
      // Nouveau programme : actif par défaut → devient le programme courant et met
      // les autres en pause (un seul actif à la fois).
      const newId = await addProgram({ ...draft, active: true });
      await deactivateOthers(newId);
    }
    router.push("/sport");
  }

  /** Met en pause tous les programmes sauf `keepId` (un seul actif à la fois). */
  async function deactivateOthers(keepId: string) {
    await Promise.all(
      programs
        .filter((p) => p.id !== keepId && p.active !== false)
        .map((p) => updateProgram(p.id, { active: false }))
    );
  }

  /** Active le programme courant (et met les autres en pause). */
  async function handleActivate() {
    if (!program) return;
    await updateProgram(program.id, { active: true });
    await deactivateOthers(program.id);
  }

  const canAddMore = programs.length < MAX_PROGRAMS;

  // Onglets de programmes (un par programme + « Nouveau »). Rendus par l'éditeur
  // juste sous le bandeau « Retour ». Masqués à la toute première création.
  const tabs =
    programs.length > 0 ? (
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {programs.map((p) => {
          const selected = !creating && p.id === currentId;
          const paused = p.active === false;
          return (
            <button
              key={p.id}
              onClick={() => router.push(`/sport/edit?id=${p.id}`)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selected ? "bg-accent-gradient text-white shadow-sm" : "neu-surface-sm text-muted-foreground"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  paused ? "bg-muted-foreground/40" : selected ? "bg-white" : "bg-green-500"
                }`}
                aria-hidden
              />
              <span className="max-w-[10rem] truncate">{p.name || "Sans nom"}</span>
            </button>
          );
        })}
        {/* En création (alors que d'autres programmes existent), onglet actif
            non-cliquable. Sinon, bouton « Nouveau » (jusqu'au maximum). */}
        {creating ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-accent-gradient px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Nouveau
          </span>
        ) : (
          canAddMore && (
            <button
              onClick={() => router.push("/sport/edit?id=new")}
              className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-muted px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:border-primary hover:bg-primary/5"
            >
              <Plus className="h-3.5 w-3.5" /> Nouveau
            </button>
          )
        )}
      </div>
    ) : undefined;

  return (
    <ProgramEditor
      key={currentId ?? "new"}
      initial={initial}
      isActive={program ? program.active !== false : false}
      canActivate={!!program}
      onActivate={handleActivate}
      tabs={tabs}
      onSave={handleSave}
      onCancel={() => router.push("/sport")}
    />
  );
}

export default function ProgramEditPage() {
  return (
    <Suspense fallback={null}>
      <ProgramEdit />
    </Suspense>
  );
}
