"use client";

import { useState } from "react";
import { apiFetch, messageErreurApi } from "@/lib/api";
import { DEGRADE_STATUT } from "@/lib/statuts";

/**
 * Feuille de changement de statut — copiée de Cordinateur_App_Web/src/
 * components/commande/FeuilleChangementStatut.tsx (même écran d'origine),
 * mais périmètre réduit à 3 statuts (décision PDG, retour de test réel) :
 * le Commercial n'a ni "Livraison en cours" (pas de PERMISSION_LIVRAISONS_
 * ASSIGNER, c'est la main du Coordinateur), ni "Commande Terminée"/"Client
 * injoignable"/"Numéro incorrect" — seulement en_attente/reportee/annulee,
 * et seulement sur SES PROPRES commandes. Vérifié aussi côté backend
 * (CommandeController::changerStatut()), pas seulement caché ici.
 */
const BOUTONS: { statut: string; label: string }[] = [
  { statut: "en_attente", label: "Commande en attente" },
  { statut: "reportee", label: "Commande reportée" },
  { statut: "annulee", label: "Commande Annulée" },
];

export function FeuilleChangementStatut({
  commandeId,
  token,
  onFermer,
  onApplique,
}: {
  commandeId: number;
  token: string;
  onFermer: () => void;
  onApplique: () => void;
}) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changerStatut(statut: string) {
    if (enCours) return;
    setErreur(null);
    setEnCours(true);
    try {
      await apiFetch(`/commandes/${commandeId}/statut`, { method: "POST", token, body: { statut_commande: statut } });
      onApplique();
    } catch (e) {
      setErreur(messageErreurApi(e));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onFermer}>
      <div className="w-full max-w-md rounded-t-3xl bg-white pb-6 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-line" />

        <div className="space-y-3 px-4">
          {BOUTONS.map(({ statut, label }) => (
            <button
              key={statut}
              type="button"
              disabled={enCours}
              onClick={() => changerStatut(statut)}
              style={{ background: DEGRADE_STATUT[statut] }}
              className="w-full rounded-full py-3 text-xl font-medium leading-none text-white disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>

        {erreur ? <p className="mt-3 px-4 text-center text-xs text-rose-500">{erreur}</p> : null}
      </div>
    </div>
  );
}
