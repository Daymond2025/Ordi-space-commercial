"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { CarteStatistique } from "@/components/space/CarteStatistique";
import { SelecteurPeriode } from "@/components/space/SelecteurPeriode";
import { CarteProduitActif } from "@/components/space/CarteProduitActif";
import { formaterMontant } from "@/lib/types";
import type { PeriodeEspace, ProduitActifCommercial, ProfilUtilisateur, StatistiquesCommercial } from "@/lib/types";

/**
 * "Space" — accueil de l'app Commercial, construit sur le mockup fourni
 * (même structure que l'écran Space des autres apps : en-tête + 3 cartes de
 * stats flottantes + liste "Commandes"). 3 cartes seulement ici (pas 6 comme
 * la version précédente, provisoire avant ce mockup) : Commande total
 * envoyé/validée/commission — correspond à GET /commercial/espace/
 * statistiques. La liste "Commandes" vient de GET /commercial/espace/
 * produits-actifs (nouveau, scopé commercial_id — voir Api\Commercial\
 * EspaceController::produitsActifs()), même mise en page que la liste
 * "produits actifs" du Fournisseur mais regroupée par produit VENDU plutôt
 * que par produit POSSÉDÉ (ce rôle n'a aucun produit en propre).
 */
export function EcranAccueil() {
  const { token } = useAuth();
  const [periode, setPeriode] = useState<PeriodeEspace>("semaine");
  const [profil, setProfil] = useState<ProfilUtilisateur | null>(null);
  const [stats, setStats] = useState<StatistiquesCommercial | null>(null);
  const [produits, setProduits] = useState<ProduitActifCommercial[] | null>(null);

  // 3 appels indépendants (pas un Promise.all()) : le profil, les stats et
  // la liste des produits n'ont aucune raison d'attendre l'un l'autre.
  useEffect(() => {
    if (!token) return;
    let annule = false;
    apiFetch<ProfilUtilisateur>("/moi/profil", { token }).then((data) => {
      if (!annule) setProfil(data);
    });
    return () => {
      annule = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<StatistiquesCommercial>(`/commercial/espace/statistiques?periode=${periode}`, { token })
      .then((data) => {
        if (!annule) setStats(data);
      })
      .catch(() => {
        if (!annule) setStats(null);
      });

    return () => {
      annule = true;
    };
  }, [token, periode]);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ProduitActifCommercial[]>("/commercial/espace/produits-actifs", { token })
      .then((data) => {
        if (!annule) setProduits(data);
      })
      .catch(() => {
        if (!annule) setProduits([]);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  const nomComplet = profil ? `${profil.prenom ?? ""} ${profil.nom}`.trim().toUpperCase() : "";

  return (
    <div>
      {/* Fond blanc net du haut de l'écran jusqu'à la ligne sous « Commandes »
          (maquette) — y compris derrière les coins arrondis du header. */}
      <div className="bg-white">
        {/* pb-20 : espace entre le profil et les 3 cartes, qui remontent sur le header. */}
        <div className="bg-gradient-espace relative rounded-b-[22px] px-4 pb-20 pt-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/compte"
                aria-label="Voir mon compte"
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border-2 border-white/50 bg-white/20"
              >
                {profil?.photo ? (
                  <Image src={profil.photo} alt="" fill className="object-cover" />
                ) : (
                  <Image src="/images/profil-default.png" alt="" fill className="object-cover" />
                )}
              </Link>
              <div>
                <p className="text-sm">Bonjour, 👋</p>
                <p className="text-lg font-extrabold leading-tight">{nomComplet || "…"}</p>
              </div>
            </div>

            <SelecteurPeriode value={periode} onChange={setPeriode} />
          </div>
        </div>

        {/* Les cartes remontent sur le header (translateY négatif) ; plus de
            bande blanche séparée derrière elles, tout le bloc est blanc. */}
        <div className="relative px-3" style={{ height: "44px" }}>
          <div className="absolute inset-x-3 flex gap-3" style={{ transform: "translateY(-52px)" }}>
            <CarteStatistique type="compte" couleur="orange" valeur={stats?.commandes_total ?? 0} label="Commande total envoyé" />
            <CarteStatistique type="compte" couleur="green" valeur={stats?.commandes_validees ?? 0} label="Commande Total validée" />
            <CarteStatistique type="montant" couleur="blue" valeur={formaterMontant(stats?.commission_totale ?? 0)} label="Commission totale, gagné" />
          </div>
        </div>

        <p className="px-4 pb-2.5 pt-5 text-sm font-bold text-brand-ink">Commandes</p>
      </div>

      {/* Ligne de séparation sur toute la largeur de l'écran. */}
      <div className="h-px w-full bg-brand-line" />

      <div className="flex flex-col gap-2.5 px-4 pb-6 pt-4">
        {produits === null ? (
          <p className="py-6 text-center text-sm text-brand-muted">Chargement…</p>
        ) : produits.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-muted">Aucune commande pour l&apos;instant.</p>
        ) : (
          produits.map((produit) => <CarteProduitActif key={produit.produit_id} produit={produit} />)
        )}
      </div>
    </div>
  );
}
