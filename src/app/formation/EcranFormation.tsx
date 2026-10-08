"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, EyeIcon, PlayIcon } from "@/components/icons";
import type { Pagination, Tutoriel } from "@/lib/types";

const COUVERTURE = "/images/couverture_tutoriel_astuce.png";

function couvertureTutoriel(tutoriel: Tutoriel): string {
  if (tutoriel.image_couverture) return tutoriel.image_couverture;
  if (tutoriel.id_video_youtube) return `https://i.ytimg.com/vi/${tutoriel.id_video_youtube}/hqdefault.jpg`;
  return COUVERTURE;
}

/**
 * "Formation" (bouton du Compte) — même écran et mêmes données que
 * l'Academy Space du client (Ordi’Space_App_Mobile/src/app/(shell)/academy/
 * AcademyTabs.tsx + page.tsx, fusionnés ici) : demande explicite "on
 * reproduit ces mêmes écrans [...] et c'est les mêmes données qui seront
 * récupérées". GET /tutoriels est déjà accessible à tout rôle connecté
 * (TutorielController::index(), lecture publique — pas de branche dédiée),
 * donc aucun changement backend. Route autonome hors (shell) — même
 * convention que /produit/[id]/detail (écran plein, pas de bottom nav).
 */
export function EcranFormation() {
  const { token, pret } = useAuth();
  const router = useRouter();
  const [onglet, setOnglet] = useState<"rapide" | "formation">("rapide");
  const [tutoriels, setTutoriels] = useState<Tutoriel[] | null>(null);

  useEffect(() => {
    if (!pret || !token) return;
    apiFetch<Pagination<Tutoriel>>("/tutoriels?per_page=100", { token }).then((page) => setTutoriels(page.data));
  }, [pret, token]);

  const tutosRapides = tutoriels?.filter((t) => t.type === "tutoriel_rapide") ?? null;
  const formations = tutoriels?.filter((t) => t.type === "formation") ?? null;

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace shrink-0 rounded-b-[30px] px-4 pb-6 pt-4 text-white">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/compte")}
            aria-label="Retour"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgba(255, 255, 255, 0.23)" }}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold">Formation</h1>
          <span className="h-9 w-9" aria-hidden />
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex h-11 rounded-full bg-white p-1" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
          <button
            type="button"
            onClick={() => setOnglet("rapide")}
            className={`flex-1 rounded-full text-sm font-semibold transition-colors ${
              onglet === "rapide" ? "bg-gradient-espace text-white" : "text-brand-muted"
            }`}
          >
            Tutos rapide
          </button>
          <button
            type="button"
            onClick={() => setOnglet("formation")}
            className={`flex-1 rounded-full text-sm font-semibold transition-colors ${
              onglet === "formation" ? "bg-gradient-espace text-white" : "text-brand-muted"
            }`}
          >
            Formation informatique
          </button>
        </div>

        {onglet === "rapide" ? (
          tutosRapides === null ? (
            <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
          ) : tutosRapides.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">Aucun tuto rapide pour le moment.</p>
          ) : (
            <div className="mt-5 flex flex-col gap-4 pb-6">
              {tutosRapides.map((tuto) => (
                <button
                  key={tuto.id}
                  type="button"
                  onClick={() => router.push(`/formation/${tuto.id}`)}
                  className="overflow-hidden rounded-2xl bg-white text-left shadow-sm"
                >
                  <div className="relative aspect-[16/10]">
                    <Image src={couvertureTutoriel(tuto)} alt="" fill className="object-cover" sizes="(max-width: 480px) 100vw, 402px" />
                    {tuto.id_video_youtube ? (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-brand-ink">
                          <PlayIcon className="h-5 w-5" />
                        </span>
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="truncate text-sm font-medium text-brand-ink">{tuto.titre}</p>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-line text-brand-muted">
                      <EyeIcon className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : formations === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : formations.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune formation pour le moment.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 pb-6">
            {formations.map((formation) => (
              <button
                key={formation.id}
                type="button"
                onClick={() => router.push(`/formation/${formation.id}`)}
                className="overflow-hidden rounded-2xl bg-white text-left shadow-sm"
              >
                <div className="relative aspect-[16/10]">
                  <Image src={couvertureTutoriel(formation)} alt="" fill className="object-cover" sizes="(max-width: 480px) 50vw, 200px" />
                  {formation.id_video_youtube ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-brand-ink">
                        <PlayIcon className="h-4 w-4" />
                      </span>
                    </span>
                  ) : null}
                </div>
                <p className="truncate px-2 py-2 text-xs text-brand-muted">{formation.titre}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
