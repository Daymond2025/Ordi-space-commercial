"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ArrowDownLeftIcon, ArrowUpRightIcon } from "@/components/icons";
import { CarteStatistique } from "@/components/space/CarteStatistique";
import { SelecteurPeriode } from "@/components/space/SelecteurPeriode";
import { FeuilleDemandeRetrait } from "@/components/paiement/FeuilleDemandeRetrait";
import { formaterDateTransaction } from "@/lib/temps";
import { formaterMontant, type DonneesPortefeuille, type PeriodeEspace, type TransactionPortefeuille } from "@/lib/types";

/**
 * "+1000 F"/"- 2500 F" — sans séparateur de milliers (contrairement à
 * SOLDES), comme le mockup. Number(...) : montant est un decimal:2 Laravel,
 * sérialisé en chaîne côté API malgré le typage TS `number`.
 */
function formaterMontantLigne(valeur: number): string {
  return `${Math.round(Number(valeur))} F`;
}

function LigneTransaction({ transaction }: { transaction: TransactionPortefeuille }) {
  const estCredit = transaction.type === "credit";

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3" style={{ boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)" }}>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${estCredit ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"}`}
      >
        {estCredit ? <ArrowDownLeftIcon className="h-5 w-5" /> : <ArrowUpRightIcon className="h-5 w-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-brand-ink">{transaction.libelle}</p>
        {transaction.client_nom ? (
          <p className="truncate text-xs text-brand-muted">
            Client : <span className="font-semibold text-brand-ink">{transaction.client_nom}</span>
            {transaction.client_localite ? ` de ${transaction.client_localite.toLowerCase()}` : ""}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-extrabold ${estCredit ? "text-emerald-600" : "text-rose-500"}`}>
          {estCredit ? "+" : "- "}
          {formaterMontantLigne(transaction.montant)}
        </p>
        <p className="mt-0.5 text-[11px] text-brand-muted">{formaterDateTransaction(transaction.date_transaction)}</p>
      </div>
    </div>
  );
}

/**
 * "Mes paiements" (onglet Paiement) — reproduit à l'identique le mockup
 * fourni : en-tête + sélecteur de période, carte SOLDES (toujours total, pas
 * filtrée), bouton "Demander un retrait" (FeuilleDemandeRetrait — réutilise
 * DemandeRetrait/Admin\RetraitController, déjà construits pour le Livreur),
 * historique des transactions (filtré par période). Le crédit "Commande
 * validé"/le débit "Commande annulée" (reprise) ou "Retrait effectué" (vrai
 * retrait validé par l'Admin) sont de vrais mouvements, pas des libellés
 * statiques — voir Commande::crediterCommissionCommercialSiEligible() et
 * Commercial::crediterPortefeuille()/debiterPortefeuille().
 */
export function EcranPaiement() {
  const { token } = useAuth();
  const [periode, setPeriode] = useState<PeriodeEspace>("semaine");
  const [donnees, setDonnees] = useState<DonneesPortefeuille | null>(null);
  const [feuilleRetraitOuverte, setFeuilleRetraitOuverte] = useState(false);

  function chargerPortefeuille() {
    if (!token) return;
    apiFetch<DonneesPortefeuille>(`/commercial/espace/portefeuille?periode=${periode}`, { token })
      .then(setDonnees)
      .catch(() => setDonnees(null));
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<DonneesPortefeuille>(`/commercial/espace/portefeuille?periode=${periode}`, { token })
      .then((data) => {
        if (!annule) setDonnees(data);
      })
      .catch(() => {
        if (!annule) setDonnees(null);
      });

    return () => {
      annule = true;
    };
  }, [token, periode]);

  // Number(...) impératif : montant est un decimal:2 Laravel, sérialisé en
  // chaîne ("5000.00") — un simple "+" concatène au lieu d'additionner dès
  // qu'il y a plus d'une transaction du même type (repéré en vérification réelle).
  const totalGagne = donnees?.transactions.filter((t) => t.type === "credit").reduce((s, t) => s + Number(t.montant), 0) ?? 0;
  const totalRepris = donnees?.transactions.filter((t) => t.type === "debit").reduce((s, t) => s + Number(t.montant), 0) ?? 0;
  const nombreTransactions = donnees?.transactions.length ?? 0;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace shrink-0 rounded-b-[30px] px-4 pb-14 pt-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold">Mes paiements</h1>
          <SelecteurPeriode value={periode} onChange={setPeriode} />
        </div>

        {/* Montant centré au milieu du bouton (pas dans l'espace restant à
            côté du libellé "Soldes" — vraiment au centre de toute la carte),
            bouton "Retirer" niché dans la carte elle-même, à droite. */}
        <div
          className="relative mt-4"
          style={{
            width: 349,
            height: 49,
            borderRadius: 9,
            background: "rgba(255, 255, 255, 0.29)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
          }}
        >
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-wide text-white/90">Soldes</span>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold">
            {donnees ? formaterMontant(donnees.solde) : "…"}
          </span>
          <button
            type="button"
            onClick={() => setFeuilleRetraitOuverte(true)}
            disabled={!donnees || donnees.disponible <= 0}
            className="absolute flex items-center justify-center border border-white/60 text-[11px] font-bold text-white disabled:opacity-50"
            style={{ width: 85, height: 25, top: 12, right: 10, borderRadius: 7 }}
          >
            Retirer
          </button>
        </div>
      </div>

      {/* 3 cartes stats qui chevauchent le bas de l'en-tête — même technique
          que l'accueil (EcranAccueil.tsx). Calculées sur la période affichée
          (contrairement à SOLDES, toujours total) à partir des transactions
          déjà chargées — pas d'appel réseau supplémentaire. */}
      <div className="relative mx-4 rounded-[21px] bg-white px-3 pb-3" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
        <div className="relative" style={{ height: "44px" }}>
          <div className="absolute inset-x-0 flex gap-3" style={{ transform: "translateY(-52px)" }}>
            <CarteStatistique type="montant" couleur="green" valeur={formaterMontant(totalGagne)} label="Total gagné" />
            <CarteStatistique type="montant" couleur="rose" valeur={formaterMontant(totalRepris)} label="Total repris" />
            <CarteStatistique type="compte" couleur="blue" valeur={nombreTransactions} label="Transactions" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-4">
        <div className="h-px w-full bg-brand-line" />

        {donnees === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : donnees.transactions.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune transaction pour l&apos;instant.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3 pb-6">
            {donnees.transactions.map((transaction) => (
              <LigneTransaction key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </div>

      {feuilleRetraitOuverte && donnees && token ? (
        <FeuilleDemandeRetrait
          token={token}
          disponible={donnees.disponible}
          retraitMinimum={donnees.retrait_minimum}
          onFermer={() => setFeuilleRetraitOuverte(false)}
          onApplique={() => {
            setFeuilleRetraitOuverte(false);
            chargerPortefeuille();
          }}
        />
      ) : null}
    </div>
  );
}
