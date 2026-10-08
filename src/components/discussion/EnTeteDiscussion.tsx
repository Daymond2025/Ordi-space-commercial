"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, MonitorIcon } from "@/components/icons";
import type { EnTeteConversation } from "@/lib/types";

const OPTIONS_FILTRE: { value: string; label: string }[] = [
  { value: "tous", label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "validee", label: "Validées" },
  { value: "en_preparation", label: "En attente de livraison" },
  { value: "en_livraison", label: "Livraison en cours" },
  { value: "livree", label: "Livrées" },
  { value: "annulee", label: "Annulées" },
];

type Props = {
  nomProduit: string;
  photo: string | null;
  stats: EnTeteConversation;
  filtre: string;
  onFiltrer: (statut: string) => void;
  /** Fournisseur du produit affiché — jamais exposé à ce rôle côté backend (voir lib/types.ts, ProduitDetail), bouton "Appeler" donc toujours désactivé. */
  telephoneFournisseur: string | null;
};

/**
 * En-tête de la discussion produit — copié de Cordinateur_App_Web/src/
 * components/discussion/EnTeteDiscussion.tsx (même écran d'origine, demande
 * explicite "mêmes écrans que chez le Coordinateur").
 */
export function EnTeteDiscussion({ nomProduit, photo, stats, filtre, onFiltrer, telephoneFournisseur }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", surClicExterieur);
    return () => document.removeEventListener("mousedown", surClicExterieur);
  }, [ouvert]);

  return (
    <div className="relative border-b border-brand-line bg-white px-3 py-3">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex h-8 w-8 shrink-0 items-center justify-center text-brand-ink">
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>

        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#EEF1F6]">
          {photo ? (
            <Image src={photo} alt={nomProduit} fill className="object-cover" sizes="40px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-muted">
              <MonitorIcon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-brand-ink">{nomProduit}</p>
          <p className="truncate text-xs text-brand-muted">
            <span className="font-semibold text-brand-ink">{stats.recues}</span> commandes reçu ·{" "}
            <span className="font-semibold text-green-600">{stats.livrees}</span> Livrée ·{" "}
            <span className="font-semibold text-[color:var(--brand-blue-end)]">{stats.en_cours}</span> En cours ·{" "}
            <span className="font-semibold text-rose-500">{stats.annulees}</span> Annulée
          </p>
        </div>

        <div ref={conteneurRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-line"
            aria-label="Filtrer les commandes"
          >
            <Image src="/images/tirer-vers-le-bas.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
          </button>

          {ouvert ? (
            <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-52 overflow-hidden rounded-2xl border border-brand-line bg-white p-1.5 shadow-xl">
              {OPTIONS_FILTRE.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onFiltrer(option.value);
                    setOuvert(false);
                  }}
                  className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                    option.value === filtre ? "bg-blue-50 font-semibold text-[color:var(--brand-blue-end)]" : "hover:bg-[#F5F7FA]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {telephoneFournisseur ? (
          <a
            href={`tel:${telephoneFournisseur}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-line"
            aria-label="Appeler le fournisseur"
          >
            <Image src="/images/telephone.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-line opacity-40"
            aria-label="Numéro du fournisseur indisponible"
          >
            <Image src="/images/telephone.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
          </button>
        )}
      </div>
    </div>
  );
}
