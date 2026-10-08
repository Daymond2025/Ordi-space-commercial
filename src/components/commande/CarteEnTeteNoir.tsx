import type { ReactNode } from "react";

/**
 * Carte à en-tête noir, sans chevron/repli (toujours ouverte) — copiée de
 * Cordinateur_App_Web/src/components/commande/CarteEnTeteNoir.tsx (même
 * origine), écran récapitulatif de création de commande.
 */
export function CarteEnTeteNoir({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[9px] bg-white">
      <div className="flex w-full items-center justify-center bg-black px-3.5 py-2.5">
        <span className="text-xs font-extrabold uppercase tracking-wide text-white underline decoration-[color:var(--brand-blue-end)] decoration-2 underline-offset-4">
          {titre}
        </span>
      </div>

      <div className="px-3.5 pb-3.5 pt-3">{children}</div>

      <div className="h-4 w-full bg-black" />
    </div>
  );
}
