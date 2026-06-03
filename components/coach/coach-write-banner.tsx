"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { consumeCoachWrite } from "@/lib/coach-feedback";

/**
 * Bannière "(new)" éphémère affichée en haut d'une page quand le coach vient
 * d'y écrire. S'affiche à l'arrivée sur la page, puis disparaît au bout de ~3s.
 */
export function CoachWriteBanner({ route }: { route: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (consumeCoachWrite(route)) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(t);
    }
  }, [route]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="mb-4 flex items-center gap-2 rounded-2xl bg-accent-gradient px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          Mis à jour par le coach
          <span className="ml-auto rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            new
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
