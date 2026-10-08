"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronDownIcon, ChevronLeftIcon, SearchIcon } from "@/components/icons";
import type { ReponseRapide } from "@/lib/types";

const ONGLETS = [
  { id: "tout", label: "Tout" },
  { id: "favoris", label: "Favoris" },
  { id: "plus_utilises", label: "Plus utilisés" },
] as const;

type Onglet = (typeof ONGLETS)[number]["id"];
type Tri = "recent" | "alphabetique";

const LIBELLES_TRI: Record<Tri, string> = { recent: "Plus récent", alphabetique: "A-Z" };

/**
 * "Réponse rapide" (bouton du Compte) — reproduit à l'identique le mockup
 * fourni : en-tête + recherche, onglets Tout/Favoris/Plus utilisés + tri,
 * cartes avec bouton "Copier". Contenu entièrement géré par l'Admin
 * (demande explicite "les réponses rapides seront ajoutées par l'admin
 * dans l'espace commercial") — aucune création possible ici, lecture +
 * "Copier" seulement. GET /reponses-rapides déjà accessible à tout rôle
 * connecté ; POST .../copie incrémente le vrai compteur "Plus utilisés".
 */
export function EcranReponseRapide() {
  const { token } = useAuth();
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>("tout");
  const [tri, setTri] = useState<Tri>("recent");
  const [triOuvert, setTriOuvert] = useState(false);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [reponses, setReponses] = useState<ReponseRapide[] | null>(null);
  const [copieId, setCopieId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    const params = new URLSearchParams();
    if (onglet !== "tout") params.set("filtre", onglet);
    if (tri === "alphabetique") params.set("tri", "alphabetique");

    apiFetch<ReponseRapide[]>(`/reponses-rapides?${params.toString()}`, { token })
      .then((data) => {
        if (!annule) setReponses(data);
      })
      .catch(() => {
        if (!annule) setReponses([]);
      });

    return () => {
      annule = true;
    };
  }, [token, onglet, tri]);

  async function copier(reponse: ReponseRapide) {
    try {
      await navigator.clipboard.writeText(reponse.contenu);
      setCopieId(reponse.id);
      setTimeout(() => setCopieId(null), 2000);
    } catch {
      // Presse-papiers refusé — on incrémente quand même le compteur ci-dessous.
    }

    if (!token) return;
    apiFetch<{ nombre_copies: number }>(`/reponses-rapides/${reponse.id}/copie`, { method: "POST", token })
      .then(({ nombre_copies }) => {
        setReponses((liste) => liste?.map((r) => (r.id === reponse.id ? { ...r, nombre_copies } : r)) ?? liste);
      })
      .catch(() => {});
  }

  const liste = (reponses ?? []).filter((r) => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return true;
    return r.titre.toLowerCase().includes(terme) || r.contenu.toLowerCase().includes(terme);
  });

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace shrink-0 rounded-b-[30px] px-4 pb-6 pt-4 text-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/compte")}
            aria-label="Retour"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(255, 255, 255, 0.23)" }}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-base font-bold">Réponse rapide</h1>
          <button
            type="button"
            onClick={() => setRechercheOuverte((v) => !v)}
            aria-label="Rechercher"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(255, 255, 255, 0.23)" }}
          >
            <SearchIcon className="h-4 w-4" />
          </button>
        </div>

        {rechercheOuverte ? (
          <input
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une réponse…"
            className="mt-3 w-full rounded-full bg-white/20 px-4 py-2 text-sm text-white outline-none placeholder:text-white/70"
          />
        ) : null}
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 gap-2 overflow-x-auto">
            {ONGLETS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOnglet(o.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                  onglet === o.id ? "bg-gradient-espace text-white" : "bg-white text-brand-muted"
                }`}
                style={onglet === o.id ? undefined : { boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setTriOuvert((v) => !v)}
              className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-brand-ink"
              style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
            >
              Trier
              <ChevronDownIcon className="h-3.5 w-3.5 text-brand-muted" />
            </button>

            {triOuvert ? (
              <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-2xl bg-white p-1.5" style={{ boxShadow: "0px 4px 12px 0px rgba(0, 0, 0, 0.15)" }}>
                {(Object.keys(LIBELLES_TRI) as Tri[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTri(t);
                      setTriOuvert(false);
                    }}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${
                      tri === t ? "bg-blue-50 text-[color:var(--brand-blue-end)]" : "text-brand-ink"
                    }`}
                  >
                    {LIBELLES_TRI[t]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {reponses === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : liste.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune réponse rapide pour l&apos;instant.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-3 pb-6">
            {liste.map((reponse) => (
              <div key={reponse.id} className="relative overflow-hidden rounded-2xl bg-white p-3 pl-5" style={{ boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)" }}>
                <span aria-hidden="true" className="absolute left-2 top-3 bottom-3 w-1 rounded-full bg-[#AFAFAF]" />
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 text-sm font-bold text-brand-ink">{reponse.titre}</p>
                  <button
                    type="button"
                    onClick={() => copier(reponse)}
                    className="flex shrink-0 items-center justify-center rounded-full bg-gradient-espace px-4 py-1.5 text-xs font-bold text-white"
                  >
                    {copieId === reponse.id ? "Copié" : "Copier"}
                  </button>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-brand-muted">{reponse.contenu}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
