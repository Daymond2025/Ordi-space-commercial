"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS = [
  { href: "/", label: "Space", icone: "/images/space.png" },
  { href: "/catalogue", label: "Catalogue", icone: "/images/catalogue.png" },
  { href: "/paiement", label: "Paiement", icone: "/images/paiement.png" },
] as const;

function Onglet({ href, label, icone, actif }: { href: string; label: string; icone: string; actif: boolean }) {
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className="group relative flex flex-1 items-center justify-center py-1.5 [-webkit-tap-highlight-color:transparent]"
    >
      {/* Onglet actif : pastille arrondie bleu très clair avec une ombre bleue
          douce, qui apparaît en fondu. Réactif : la pastille se resserre
          légèrement à l'appui (active:scale) et l'icône grossit en douceur. */}
      <span
        className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-1.5 transition-all duration-300 ease-out group-active:scale-90 ${
          actif ? "bg-[#C2DCFF]" : "bg-transparent"
        }`}
        style={{ boxShadow: actif ? "0px 6px 18px 0px rgba(0, 119, 255, 0.6), 0px 2px 6px 0px rgba(0, 119, 255, 0.4), 0px 0px 0px 1.5px rgba(0, 119, 255, 0.25)" : "0px 0px 0px 0px rgba(0, 119, 255, 0)" }}
      >
        {/* Halo bleu de l'icône : filtre posé sur ce conteneur (sur l'icône
            elle-même, le masque ci-dessous effacerait l'ombre). */}
        <span
          className={`flex shrink-0 transition-all duration-300 ease-out ${actif ? "-translate-y-0.5 scale-110" : ""}`}
          style={{
            filter: actif ? "drop-shadow(0px 4px 6px rgba(0, 119, 255, 0.85)) drop-shadow(0px 0px 9px rgba(0, 119, 255, 0.5))" : "none",
          }}
        >
          {/* `mask-image` (pas `filter: brightness(0)`) : recolore l'icône via
              `background-color` quelle que soit sa couleur source — même
              technique que Ordi'Space_Fournisseur_App/src/components/space/BottomNav.tsx. */}
          <span
            aria-hidden="true"
            className="h-[22px] w-[22px] shrink-0 transition-colors duration-300"
            style={{
              backgroundColor: actif ? "var(--brand-blue-end)" : "#9CA3AF",
              WebkitMaskImage: `url(${icone})`,
              maskImage: `url(${icone})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
        </span>
        <span
          className={`text-center text-[10px] leading-tight transition-colors duration-300 ${
            actif ? "font-bold text-[color:var(--brand-blue-end)]" : "font-medium text-brand-muted"
          }`}
        >
          {label}
        </span>
      </span>
    </Link>
  );
}

/**
 * Nav du bas — 3 onglets (Space, Catalogue, Paiement). L'onglet Compte a
 * été retiré : le profil s'ouvre depuis l'avatar de l'accueil. Icônes PNG
 * fournies (public/images/{space,catalogue,
 * paiement,compte}.png), dimensions mockup 402×64 pleine largeur. Pas de
 * bouton central surélevé (absent du mockup, contrairement à l'app
 * Fournisseur) — onglets à poids égal.
 */
// Discussion produit (/produit/{id}) et Nouvelle commande / récapitulatif
// (/produit/{id}/nouvelle-commande) : écrans plein écran, sans la nav.
const SANS_NAV = /^\/produit\/\d+(\/nouvelle-commande)?\/?$/;

export function BottomNav() {
  const pathname = usePathname();

  if (SANS_NAV.test(pathname)) return null;

  return (
    <nav
      className="sticky bottom-0 z-20 flex items-center bg-white px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1"
      style={{ height: "64px", boxShadow: "0px -2px 4px 0px rgba(0, 0, 0, 0.25)" }}
    >
      {ONGLETS.map((onglet) => (
        <Onglet key={onglet.href} {...onglet} actif={pathname === onglet.href} />
      ))}
    </nav>
  );
}
