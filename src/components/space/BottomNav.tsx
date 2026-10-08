"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS = [
  { href: "/", label: "Space", icone: "/images/space.png" },
  { href: "/catalogue", label: "Catalogue", icone: "/images/catalogue.png" },
  { href: "/paiement", label: "Paiement", icone: "/images/paiement.png" },
  { href: "/compte", label: "Compte", icone: "/images/compte.png" },
] as const;

function Onglet({ href, label, icone, actif }: { href: string; label: string; icone: string; actif: boolean }) {
  return (
    <Link href={href} className="relative flex flex-1 flex-col items-center gap-1 py-2">
      {/* `mask-image` (pas `filter: brightness(0)`) : recolore l'icône via
          `background-color` quelle que soit sa couleur source — même
          technique que Ordi'Space_Fournisseur_App/src/components/space/BottomNav.tsx. */}
      <span
        aria-hidden="true"
        className="h-[22px] w-[22px] shrink-0"
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
      <span className={`text-center text-[10px] font-medium leading-tight ${actif ? "text-[color:var(--brand-blue-end)]" : "text-brand-muted"}`}>
        {label}
      </span>
    </Link>
  );
}

/**
 * Nav du bas — 4 icônes PNG fournies (public/images/{space,catalogue,
 * paiement,compte}.png), dimensions mockup 402×64 pleine largeur. Pas de
 * bouton central surélevé (absent du mockup, contrairement à l'app
 * Fournisseur) — 4 onglets à poids égal.
 */
export function BottomNav() {
  const pathname = usePathname();

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
