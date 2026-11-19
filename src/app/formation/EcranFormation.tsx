"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { ChevronLeftIcon, EyeIcon, PlayIcon } from "@/components/icons";
import type { Pagination, Tutoriel } from "@/lib/types";
import { useRetour } from "@/lib/navigation";

const COUVERTURE = "/images/couverture_tutoriel_astuce.png";

function couvertureTutoriel(tutoriel: Tutoriel): string {
  if (tutoriel.image_couverture) return tutoriel.image_couverture;
  if (tutoriel.id_video_youtube) return `https://i.ytimg.com/vi/${tutoriel.id_video_youtube}/hqdefault.jpg`;
  return COUVERTURE;
}

/**
 * "Formation" (bouton du Compte) — uniquement les formations spécifiques de
 * vente, créées par l'Admin pour les commerciaux (type "formation_vente").
 * GET /tutoriels ne renvoie que ce type à un commercial
 * (TutorielController::index()) ; les tutos et formations informatiques de
 * l'Academy Space des clients n'apparaissent jamais ici. Route autonome hors
 * (shell) — écran plein, pas de bottom nav.
 */
export function EcranFormation() {
  const { token, pret } = useAuth();
  const router = useRouter();
  const retour = useRetour("/compte");
  const [formations, setFormations] = useState<Tutoriel[] | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!pret || !token) return;
    apiFetch<Pagination<Tutoriel>>("/tutoriels?per_page=100", { token })
      .then((page) => setFormations(page.data))
      .catch(() => setErreur(true));
  }, [pret, token]);

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace shrink-0 rounded-b-[30px] px-4 pb-6 pt-4 text-white">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={retour}
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

      <div className="px-4 pt-5">
        <h2 className="text-base font-extrabold text-brand-ink">Formations spécifiques de vente</h2>
        <p className="mt-1 text-xs text-brand-muted">Techniques de vente et bonnes pratiques préparées par Ordi&apos;Space pour ses commerciaux.</p>

        {erreur ? (
          <p className="py-10 text-center text-sm text-rose-600">Impossible de charger les formations.</p>
        ) : formations === null ? (
          <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
        ) : formations.length === 0 ? (
          <p className="py-10 text-center text-sm text-brand-muted">Aucune formation de vente pour le moment.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4 pb-6">
            {formations.map((formation) => (
              <button
                key={formation.id}
                type="button"
                onClick={() => router.push(`/formation/${formation.id}`)}
                className="overflow-hidden rounded-2xl bg-white text-left shadow-sm"
              >
                <div className="relative aspect-[16/10]">
                  <Image src={couvertureTutoriel(formation)} alt="" fill className="object-cover" sizes="(max-width: 480px) 100vw, 402px" />
                  {formation.id_video_youtube ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-brand-ink">
                        <PlayIcon className="h-5 w-5" />
                      </span>
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="truncate text-sm font-medium text-brand-ink">{formation.titre}</p>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-line text-brand-muted">
                    <EyeIcon className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
