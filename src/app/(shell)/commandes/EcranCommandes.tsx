"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { CarteCommande } from "@/components/commande/CarteCommande";
import type { CommandeListe, Pagination } from "@/lib/types";

/**
 * "Mes commandes" — GET /commandes (CommandeController::index(), déjà scopé
 * commercial_id = moi côté backend, match ROLE_COMMERCIAL). Liste plate
 * (pas d'onglets par bucket comme chez le Fournisseur : aucun endpoint
 * backend équivalent à /fournisseur/moi/commandes pour ce rôle — hors
 * périmètre V1, le volume d'un commercial individuel reste limité).
 */
export function EcranCommandes() {
  const { token } = useAuth();
  const [commandes, setCommandes] = useState<CommandeListe[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<Pagination<CommandeListe>>("/commandes", { token })
      .then((pagination) => {
        if (!annule) setCommandes(pagination.data);
      })
      .catch(() => {
        if (!annule) setCommandes([]);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  return (
    <div>
      <div className="bg-gradient-espace rounded-b-[22px] px-4 pb-5 pt-6 text-white">
        <p className="text-center text-lg font-extrabold">Mes commandes</p>
      </div>

      <div className="flex flex-col gap-2.5 px-4 py-4">
        {commandes === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : commandes.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-center text-sm text-brand-muted">Aucune commande pour l&apos;instant.</p>
            <Link href="/nouvelle-commande" className="text-sm font-semibold text-[color:var(--brand-blue-end)]">
              + Créer une nouvelle commande
            </Link>
          </div>
        ) : (
          commandes.map((commande) => <CarteCommande key={commande.id} commande={commande} />)
        )}
      </div>
    </div>
  );
}
