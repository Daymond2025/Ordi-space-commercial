"use client";

import Image from "next/image";
import { useState } from "react";
import { apiFetch, messageErreurApi } from "@/lib/api";
import { formaterMontant, type DemandeRetrait, type OperateurRetrait } from "@/lib/types";

const OPERATEURS: OperateurRetrait[] = ["Orange", "Wave", "Mtn", "Moov"];

/** Logos fournis (public/images) — le nom de l'opérateur est déjà dans chaque image, pas besoin d'un libellé texte à côté. */
const LOGO_OPERATEUR: Record<OperateurRetrait, string> = {
  Orange: "/images/logo-oange.png",
  Wave: "/images/logo-wave.jpg",
  Mtn: "/images/mtn-mobile-money-logo.jpg",
  Moov: "/images/logo-moov.jpg",
};

/**
 * "Demander un retrait" — même mécanique que la Boutique du Livreur
 * (PortefeuilleController::demander(), réutilisée ici via /commercial/
 * espace/retraits) : l'Admin paie hors de l'app (Mobile Money) puis valide
 * avec la référence du transfert — voir Admin\RetraitController.
 */
export function FeuilleDemandeRetrait({
  token,
  disponible,
  retraitMinimum,
  onFermer,
  onApplique,
}: {
  token: string;
  disponible: number;
  retraitMinimum: number;
  onFermer: () => void;
  onApplique: () => void;
}) {
  const [montant, setMontant] = useState(String(Math.min(disponible, Math.max(disponible, retraitMinimum))));
  const [operateur, setOperateur] = useState<OperateurRetrait>("Orange");
  const [telephone, setTelephone] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre() {
    if (enCours) return;
    setErreur(null);

    const montantNombre = Number(montant);
    if (!montantNombre || montantNombre < retraitMinimum) {
      setErreur(`Le retrait minimum est de ${formaterMontant(retraitMinimum)}.`);
      return;
    }
    if (montantNombre > disponible) {
      setErreur(`Montant supérieur à ta commission disponible (${formaterMontant(disponible)}).`);
      return;
    }
    if (!telephone.trim()) {
      setErreur("Le numéro de téléphone est obligatoire.");
      return;
    }

    setEnCours(true);
    try {
      await apiFetch<DemandeRetrait>("/commercial/espace/retraits", {
        method: "POST",
        token,
        body: { montant: Math.round(montantNombre), operateur, telephone: telephone.trim() },
      });
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

        <div className="space-y-4 px-5">
          <p className="text-center text-base font-extrabold text-brand-ink">Demander un retrait</p>
          <p className="text-center text-xs text-brand-muted">
            Disponible : <span className="font-bold text-brand-ink">{formaterMontant(disponible)}</span>
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-muted">Montant à retirer (FCFA)</label>
            <input
              type="number"
              inputMode="numeric"
              min={retraitMinimum}
              max={disponible}
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="h-12 rounded-full border border-brand-line px-4 text-sm text-brand-ink outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-muted">Opérateur Mobile Money</label>
            <div className="flex gap-2.5">
              {OPERATEURS.map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setOperateur(op)}
                  aria-label={op}
                  aria-pressed={operateur === op}
                  className={`relative flex-1 overflow-hidden rounded-2xl transition-all ${
                    operateur === op ? "ring-2 ring-[color:var(--brand-blue-end)] ring-offset-2" : "opacity-60"
                  }`}
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <Image src={LOGO_OPERATEUR[op]} alt={op} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-muted">Numéro Mobile Money</label>
            <input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Ex. 07 00 00 00 00"
              className="h-12 rounded-full border border-brand-line px-4 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
            />
          </div>

          {erreur ? <p className="text-center text-xs text-rose-500">{erreur}</p> : null}

          <button
            type="button"
            disabled={enCours}
            onClick={soumettre}
            className="bg-gradient-espace h-12 w-full rounded-full text-sm font-bold text-white disabled:opacity-50"
          >
            {enCours ? "Envoi…" : "Envoyer la demande"}
          </button>
        </div>
      </div>
    </div>
  );
}
