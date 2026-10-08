"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  ChartIcon,
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DeconnexionIcon,
  GraduationCapIcon,
  HeadsetIcon,
  PhoneFilledIcon,
  PinIcon,
  ShieldIcon,
  StoreIcon,
  UserIcon,
} from "@/components/icons";
import {
  formaterMontant,
  type Pagination,
  type ProfilUtilisateur,
  type ReponseRapide,
  type StatistiquesCommercial,
  type Tutoriel,
} from "@/lib/types";

const CARTE_OMBRE = { boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" };

/** "17/10/2026 (2 Mois)" — date d'adhésion + ancienneté en mois, comme le mockup. */
function formaterAnciennete(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";

  const jour = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const maintenant = new Date();
  let mois = (maintenant.getFullYear() - date.getFullYear()) * 12 + (maintenant.getMonth() - date.getMonth());
  if (maintenant.getDate() < date.getDate()) mois -= 1;
  mois = Math.max(0, mois);

  return `${jour} (${mois} Mois)`;
}

function LigneInfo({ icone, iconeClasse, label, valeur }: { icone: ReactNode; iconeClasse: string; label: string; valeur: string | null }) {
  return (
    <div className="flex items-center gap-3 border-b border-brand-line px-4 py-3.5 last:border-b-0">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconeClasse}`}>{icone}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-brand-muted">{label}</p>
        <p className={`truncate text-sm font-bold ${valeur ? "text-brand-ink" : "text-brand-muted"}`}>{valeur ?? "Non renseigné"}</p>
      </div>
    </div>
  );
}

/** "Confidentialité et UGC"/"Contactez le service" — pas encore branchées (aucune page cible construite), même convention que les autres apps (Ordi'Space_Fournisseur_App/.../EcranProfil.tsx). */
function LigneMenu({ icone, iconeClasse, label }: { icone: ReactNode; iconeClasse: string; label: string }) {
  return (
    <button
      type="button"
      aria-label={`${label} (à venir)`}
      className="flex w-full items-center gap-3 border-b border-brand-line px-4 py-3.5 text-left last:border-b-0"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconeClasse}`}>{icone}</span>
      <span className="flex-1 text-sm font-bold text-brand-ink">{label}</span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
    </button>
  );
}

/**
 * "Mon Profil" (onglet Compte) — reproduit à l'identique le mockup fourni :
 * en-tête bleu + carte identité (avatar, nom, rôle, ancienneté) + 3 lignes
 * Contact/Entreprise/Localisation, puis "Réponse rapide", "Statistique" et
 * "Formation" (même gabarit carte unique qu'eux — icône/titre/sous-titre/
 * chevron) ; seule "Statistique" tire sa ligne de GET /commercial/espace/
 * statistiques (déjà utilisée par l'accueil), les autres sont "à venir"
 * (aucune fonctionnalité construite derrière, même convention que
 * "Confidentialité et UGC"/"Contactez le service" ci-dessous et que les
 * autres apps). nom_entreprise/localisation viennent de la nouvelle branche
 * ROLE_COMMERCIAL de MoiController::profil().
 */
export function EcranCompte() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [profil, setProfil] = useState<ProfilUtilisateur | null>(null);
  const [stats, setStats] = useState<StatistiquesCommercial | null>(null);
  const [nombreContenus, setNombreContenus] = useState<number | null>(null);
  const [nombreReponses, setNombreReponses] = useState<number | null>(null);

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

  // Carte "Statistique" (sous "Réponse rapide") — même endpoint que
  // l'accueil, mais sur toute la période (profil = bilan global, pas un
  // tableau de bord filtrable).
  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<StatistiquesCommercial>("/commercial/espace/statistiques?periode=tout", { token })
      .then((data) => {
        if (!annule) setStats(data);
      })
      .catch(() => {
        if (!annule) setStats(null);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  // Carte "Formation" — juste le total réel (TutorielController::index()),
  // la liste elle-même n'est chargée que sur /formation.
  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<Pagination<Tutoriel>>("/tutoriels?per_page=1", { token })
      .then((page) => {
        if (!annule) setNombreContenus(page.total);
      })
      .catch(() => {
        if (!annule) setNombreContenus(null);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  // Carte "Réponse rapide" — juste le total réel (ReponseRapideController::index()).
  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ReponseRapide[]>("/reponses-rapides", { token })
      .then((data) => {
        if (!annule) setNombreReponses(data.length);
      })
      .catch(() => {
        if (!annule) setNombreReponses(null);
      });

    return () => {
      annule = true;
    };
  }, [token]);

  const nomComplet = profil ? `${profil.prenom ?? ""} ${profil.nom}`.trim() : "…";

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#f2f5fa]">
      <div className="bg-gradient-espace shrink-0 rounded-b-[30px] px-4 pb-10 pt-4 text-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-[31px] w-8 shrink-0 items-center justify-center rounded-[7px]"
            style={{ background: "rgba(255, 255, 255, 0.23)" }}
          >
            <ChevronLeftIcon className="h-[19px] w-[19px]" />
          </button>
          <p className="text-lg font-extrabold">Mon Profil</p>
        </div>
      </div>

      <div className="-mt-6 px-4">
        <div className="rounded-[22px] bg-white" style={CARTE_OMBRE}>
          <div className="flex items-center gap-3 p-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[color:var(--brand-blue-end)]/40 bg-[#F6F8FE]">
              {profil?.photo ? (
                <Image src={profil.photo} alt="" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[color:var(--brand-blue-end)]">
                  <UserIcon className="h-7 w-7" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-extrabold text-brand-ink">{nomComplet}</p>
              <p className="text-sm text-brand-muted">Commercial</p>
              {profil ? <p className="mt-0.5 text-xs text-brand-muted">Membre depuis: {formaterAnciennete(profil.created_at)}</p> : null}
            </div>
          </div>

          <div className="border-t border-brand-line">
            <LigneInfo
              icone={<PhoneFilledIcon className="h-4 w-4" />}
              iconeClasse="bg-blue-50 text-[color:var(--brand-blue-end)]"
              label="Contact"
              valeur={profil?.telephone ?? null}
            />
            <LigneInfo
              icone={<StoreIcon className="h-4 w-4" />}
              iconeClasse="bg-amber-50 text-amber-500"
              label="Entreprise"
              valeur={profil?.nom_entreprise ?? null}
            />
            <LigneInfo
              icone={<PinIcon className="h-4 w-4" />}
              iconeClasse="bg-amber-50 text-amber-500"
              label="Localisation"
              valeur={profil?.localisation ?? null}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/reponse-rapide")}
          aria-label="Réponse rapide"
          className="mt-4 flex w-full items-center gap-3 rounded-[22px] bg-white p-4"
          style={CARTE_OMBRE}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <ChatIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-bold text-brand-ink">Reponse rapide</p>
            <p className="text-xs font-semibold text-emerald-600">{nombreReponses ?? "…"} reponses disponible</p>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
        </button>

        <button
          type="button"
          onClick={() => router.push("/statistiques")}
          aria-label="Statistique"
          className="mt-4 flex w-full items-center gap-3 rounded-[22px] bg-white p-4"
          style={CARTE_OMBRE}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[color:var(--brand-blue-end)]">
            <ChartIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-bold text-brand-ink">Statistique</p>
            <p className="text-xs font-semibold text-[color:var(--brand-blue-end)]">
              {stats?.commandes_total ?? 0} commandes · {formaterMontant(stats?.commission_totale ?? 0)} gagné
            </p>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
        </button>

        <button
          type="button"
          onClick={() => router.push("/formation")}
          aria-label="Formation"
          className="mt-4 flex w-full items-center gap-3 rounded-[22px] bg-white p-4"
          style={CARTE_OMBRE}
        >
          <span className="bg-gradient-espace flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white">
            <GraduationCapIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-bold text-brand-ink">Formation</p>
            <p className="text-xs text-brand-muted">{nombreContenus ?? "…"} contenus</p>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-brand-muted" />
        </button>

        <div className="mt-4 rounded-[22px] bg-white" style={CARTE_OMBRE}>
          <LigneMenu icone={<ShieldIcon className="h-4.5 w-4.5" />} iconeClasse="bg-indigo-50 text-indigo-500" label="Confidentialité et UGC" />
          <LigneMenu icone={<HeadsetIcon className="h-4.5 w-4.5" />} iconeClasse="bg-amber-50 text-amber-500" label="Contactez le service" />
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="mb-6 mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-xs font-extrabold uppercase tracking-wide text-white"
        >
          <DeconnexionIcon className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
