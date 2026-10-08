import type { ReactNode } from "react";
import { RouteGuard } from "@/components/RouteGuard";
import { BottomNav } from "@/components/space/BottomNav";

// Hauteur bornée (h-dvh, pas min-h-dvh) + overflow-hidden sur la coquille —
// même correctif que les autres apps (Fournisseur) : sans ça, la page
// entière grandissait avec le contenu au lieu de la seule zone `flex-1`,
// ce qui empêchait la barre de saisie de la discussion produit de rester
// ancrée juste au-dessus de la nav. Ne change rien sur les écrans qui
// tiennent déjà dans l'écran (accueil...), les rend juste correctement
// défilants indépendamment de la nav. Aucun écran ne masque encore la nav
// ici (pas de "détail produit" plein écran construit pour ce rôle) — à
// ajouter via une regex sur `pathname` (usePathname + masquerNav) le jour
// où un tel écran arrive, comme Ordi'Space_Fournisseur_App/src/app/(shell)/layout.tsx.
export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard>
      <div className="mx-auto flex h-dvh w-full max-w-xl flex-col overflow-hidden bg-[#f2f5fa] md:my-6 md:h-[calc(100dvh-3rem)] md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
        <div className="flex-1 overflow-y-auto">{children}</div>
        <BottomNav />
      </div>
    </RouteGuard>
  );
}
