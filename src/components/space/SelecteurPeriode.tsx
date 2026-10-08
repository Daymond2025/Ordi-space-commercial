"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";
import type { PeriodeEspace } from "@/lib/types";

const OPTIONS: { value: PeriodeEspace; label: string }[] = [
  { value: "aujourd_hui", label: "Aujourd'hui" },
  { value: "semaine", label: "Cette semaine" },
  { value: "semaine_derniere", label: "Semaine dernière" },
  { value: "mois", label: "Ce mois-ci" },
  { value: "tout", label: "Tout" },
];

type Props = {
  value: PeriodeEspace;
  onChange: (valeur: PeriodeEspace) => void;
};

/** Pill "TOUT ▾" du header Space — copié de Cordinateur_App_Web/Ordi'Space_Fournisseur_App (même origine). */
export function SelecteurPeriode({ value, onChange }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;

    function surClicExterieur(e: MouseEvent) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target as Node)) setOuvert(false);
    }
    function surTouche(e: KeyboardEvent) {
      if (e.key === "Escape") setOuvert(false);
    }

    document.addEventListener("mousedown", surClicExterieur);
    document.addEventListener("keydown", surTouche);
    return () => {
      document.removeEventListener("mousedown", surClicExterieur);
      document.removeEventListener("keydown", surTouche);
    };
  }, [ouvert]);

  const selectionne = OPTIONS.find((o) => o.value === value) ?? OPTIONS[4];

  return (
    <div ref={conteneurRef} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        className="flex h-8 items-center justify-between gap-1 whitespace-nowrap rounded-full bg-white/20 pl-3 pr-1.5 text-xs font-bold uppercase tracking-wide text-white"
      >
        {selectionne.label}
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
          <ChevronDownIcon className={`h-3 w-3 transition-transform duration-200 ${ouvert ? "rotate-180" : ""}`} />
        </span>
      </button>

      {ouvert ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-44 overflow-hidden rounded-2xl border border-brand-line bg-white p-1.5 text-brand-ink shadow-xl">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOuvert(false);
              }}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                option.value === value ? "bg-blue-50 font-semibold text-[color:var(--brand-blue-end)]" : "hover:bg-[#F5F7FA]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
