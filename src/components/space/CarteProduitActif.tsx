import Image from "next/image";
import Link from "next/link";
import { DoubleCheckIcon, MonitorIcon } from "@/components/icons";
import { formaterTempsRelatif } from "@/lib/temps";
import type { ProduitActifCommercial } from "@/lib/types";

/**
 * Carte "produit vendu" de l'accueil — même mise en page que
 * Ordi'Space_Fournisseur_App/src/components/space/CarteProduitActif.tsx
 * (mockup fourni), mais la donnée vient de GET /commercial/espace/
 * produits-actifs (scopé commercial_id, pas fournisseur_id — ce rôle ne
 * possède aucun produit en propre). Mène vers /produit/[id] — la
 * "Discussion produit" (même écran que chez le Coordinateur, demande
 * explicite), déjà scopée aux commandes DE ce commercial côté backend.
 *
 * Le badge vert/double-check : là-bas c'est "messages non lus" sur le fil de
 * discussion produit — ici interprété comme `commandes_en_cours` de CE
 * produit (>0 = encore une action à suivre, sinon double-check "tout est
 * réglé"), faute d'un compteur de non-lus propre à cette liste groupée.
 */
export function CarteProduitActif({ produit }: { produit: ProduitActifCommercial }) {
  const { statistiques } = produit;

  return (
    <Link href={`/produit/${produit.produit_id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-slate-900/5">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
        {produit.photo ? (
          <Image src={produit.photo} alt={produit.nom_produit} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <MonitorIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-ink">{produit.nom_produit}</p>
        <p className="mt-0.5 text-xs text-brand-muted">
          <span className="font-semibold text-brand-ink">{statistiques.recues}</span> Commandes ·{" "}
          <span className="font-semibold text-green-600">{statistiques.livrees}</span> livrées ·{" "}
          <span className="font-semibold text-[color:var(--brand-blue-end)]">{statistiques.en_cours}</span> en cours ·{" "}
          <span className="font-semibold text-rose-500">{statistiques.annulees}</span> annulée
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[11px] text-brand-muted">{formaterTempsRelatif(produit.derniere_activite)}</span>
        {statistiques.en_cours > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500 px-1 text-[11px] font-bold text-white">
            {statistiques.en_cours}
          </span>
        ) : (
          <DoubleCheckIcon className="h-4 w-4 text-[color:var(--brand-blue-end)]" />
        )}
      </div>
    </Link>
  );
}
