"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MonitorIcon } from "@/components/icons";
import { LIBELLES_STATUT, trouverBucketCommande } from "@/lib/statuts";
import { formaterMontant } from "@/lib/types";
import type { CommandeListe } from "@/lib/types";

function formaterDate(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Carte "Mes commandes" — contrairement à CarteCommandeFournisseur (forme
 * sérialisée dédiée, GET /fournisseur/moi/commandes), cette app consomme la
 * forme brute du modèle Commande renvoyée par GET /commandes (CommandeController::
 * index(), déjà scopé commercial_id = moi) : pas de bucket/compteurs
 * précalculés côté backend pour ce rôle encore — juste le statut réel,
 * coloré via le même trouverBucketCommande() que les autres apps.
 */
export function CarteCommande({ commande }: { commande: CommandeListe }) {
  const router = useRouter();
  const bucket = trouverBucketCommande(commande.statut_commande);
  const ligne = commande.lignes[0]?.produit ?? null;
  const client = commande.client?.user ?? null;

  return (
    <button
      type="button"
      onClick={() => router.push(`/commande/${commande.id}`)}
      className="flex w-full items-center gap-3 overflow-hidden rounded-[12px] bg-white p-3 text-left"
      style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[9px] bg-[#F6F8FE]">
        {ligne?.images[0]?.url_image ? (
          <Image src={ligne.images[0].url_image} alt={ligne.nom_produit} fill className="object-cover" sizes="56px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-brand-muted">
            <MonitorIcon className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold text-brand-ink">{ligne?.nom_produit ?? "Commande"}</p>
          <span className="shrink-0 text-xs text-brand-muted">{formaterDate(commande.date_commande)}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-brand-muted">
          {client ? `${client.prenom ? `${client.prenom} ` : ""}${client.nom}` : "Client"}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: bucket.degrade }}
          >
            {LIBELLES_STATUT[commande.statut_commande] ?? commande.statut_commande}
          </span>
          <span className="text-sm font-extrabold text-brand-ink">{formaterMontant(Number(commande.montant_total))}</span>
        </div>
      </div>
    </button>
  );
}
