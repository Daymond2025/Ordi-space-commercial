import { StoreIcon } from "@/components/icons";

/**
 * Écran provisoire pour les destinations de la nav du bas dont le mockup
 * n'a pas encore été fourni/récupéré — copié de Ordi'Space_Fournisseur_App
 * (même origine). Sert juste à éviter un 404 ; à remplacer dès que l'écran
 * réel est construit (le PDG a précisé que ces écrans existent déjà dans
 * d'autres apps — à récupérer au fur et à mesure).
 */
export function EcranBientotDisponible({ titre }: { titre: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[color:var(--brand-blue-end)]">
        <StoreIcon className="h-8 w-8" />
      </div>
      <p className="text-base font-bold text-brand-ink">{titre}</p>
      <p className="text-sm text-brand-muted">Cet écran arrive bientôt.</p>
    </div>
  );
}
