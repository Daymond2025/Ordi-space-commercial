"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

/**
 * Historique de navigation DANS l'app (onglet courant, sessionStorage).
 * router.back() seul ne suffit pas : quand une page est ouverte directement
 * (lien partagé, rechargement, appli rouverte), il n'y a pas de page
 * précédente dans l'app — le navigateur sort alors de l'app (page vide) ou
 * ne fait rien. useRetour() s'appuie sur cette pile pour savoir s'il peut
 * revenir en arrière, sinon il ouvre la page parente logique.
 */
const CLE = "ordispace.commercial.historique";
const TAILLE_MAX = 50;

function lirePile(): string[] {
  try {
    const brut = sessionStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    return [];
  }
}

function ecrirePile(pile: string[]) {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(pile.slice(-TAILLE_MAX)));
  } catch {
    // Stockage indisponible (navigation privée…) : useRetour retombe sur la page parente.
  }
}

/** Monté une fois dans le layout racine : note chaque changement de page. */
export function SuiviNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    const pile = lirePile();
    if (pile[pile.length - 1] === pathname) return;
    // Retour arrière (bouton retour, geste du téléphone) : on dépile.
    if (pile[pile.length - 2] === pathname) {
      pile.pop();
    } else {
      pile.push(pathname);
    }
    ecrirePile(pile);
  }, [pathname]);

  return null;
}

/**
 * Bouton retour fiable : page précédente si elle existe dans l'app, sinon
 * `repli` (la page parente de l'écran, ex. "/compte" pour Statistiques).
 */
export function useRetour(repli: string): () => void {
  const router = useRouter();

  return useCallback(() => {
    if (lirePile().length >= 2) {
      router.back();
    } else {
      router.replace(repli);
    }
  }, [router, repli]);
}
