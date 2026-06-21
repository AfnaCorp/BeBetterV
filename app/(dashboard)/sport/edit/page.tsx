"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppData } from "@/components/app-data-provider";
import { ProgramEditor, type ProgramDraftValue } from "@/components/sport/program-editor";

function ProgramEdit() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const { programs, addProgram, updateProgram } = useAppData();

  // Programme à modifier (si `?id=`), sinon création. On clone les sessions pour ne
  // pas muter l'objet du contexte temps réel pendant l'édition.
  const program = id ? programs.find((p) => p.id === id) : undefined;
  const initial: ProgramDraftValue = program
    ? { name: program.name, sessions: JSON.parse(JSON.stringify(program.sessions)) }
    : { name: "", sessions: [] };

  async function handleSave(draft: ProgramDraftValue) {
    if (id) {
      await updateProgram(id, draft);
    } else {
      await addProgram(draft);
    }
    router.push("/sport");
  }

  return (
    <ProgramEditor
      key={id ?? "new"}
      initial={initial}
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
