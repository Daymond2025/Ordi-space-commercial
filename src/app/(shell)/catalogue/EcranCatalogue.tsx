"use client";

import type { CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formaterPrix, type Pagination, type Produit } from "@/lib/types";
import { ImageProduitCard } from "@/components/ImageProduitCard";

const CATEGORIES = [
  { id: "tout", label: "Tout", categorieId: null },
  { id: "ordinateurs", label: "Ordinateurs", categorieId: 1 },
  { id: "accessoires", label: "Accessoires", categorieId: 2 },
  { id: "logiciels", label: "Logiciels", categorieId: 3 },
] as const;

/**
 * Bâche (public/images/bache-marketspace.png, 1536×1024, fond transparent) :
 * la bâche n'occupe que x 88→1464 et y 254→490 de l'image. On cadre l'image
 * sur cette zone, étirée sur toute la largeur de l'écran et collée en haut
 * (taille/position calculées depuis ces bornes), avec un léger espace
 * au-dessus ; ses festons reposent sur le rectangle Market'Space. Les vides
 * entre les dessus des bandes rouges sont comblés (voir STYLE_BACHE).
 */
// festons : hauteur (px image) du bas arrondi des bandes, sous laquelle le rectangle se glisse.
// hautPerspective : hauteur (px image) du dessus des bandes, vu en perspective.
const BACHE = { image: { l: 1536, h: 1024 }, x: 88, y: 254, l: 1377, h: 237, hautPerspective: 106, festons: 30 };
const STYLE_BACHE: CSSProperties = {
  aspectRatio: `${BACHE.l} / ${BACHE.h}`,
  // 2e couche : dessus des bandes blanches (transparents dans l'image, d'où
  // les triangles vides entre les bandes rouges), couleur des bandes blanches.
  backgroundImage: `url(/images/bache-marketspace.png), linear-gradient(to bottom, #D3E2E7 0%, #E7F3F5 ${
    (100 * BACHE.hautPerspective) / BACHE.h
  }%, transparent ${(100 * BACHE.hautPerspective) / BACHE.h}%)`,
  backgroundRepeat: "no-repeat, no-repeat",
  // Largeur de l'image telle que la bâche fasse 100 % de l'écran, puis
  // position (en %) qui place le coin haut-gauche de la bâche en (0, 0).
  backgroundSize: `${(100 * BACHE.image.l) / BACHE.l}% auto, 100% 100%`,
  backgroundPosition: `${(100 * BACHE.x) / (BACHE.image.l - BACHE.l)}% ${
    (100 * BACHE.y) / ((BACHE.image.h * BACHE.l) / BACHE.image.l - BACHE.h)
  }%, 0 0`,
};

/**
 * Onglet "Catalogue" — même écran que le Market'Space du client
 * (Ordi’Space_App_Mobile/src/app/(shell)/market-space/page.tsx), demande
 * explicite "c'est cette même page qu'on reproduit côté commercial avec des
 * produits ajoutés visible" : même bâche décorative, même en-tête, même
 * grille de cartes — tous les produits publiés (statut_produit=valide) sont
 * visibles, pas de filtre supplémentaire sur "mes ventes" ici (contrairement
 * à l'accueil). Pas de panier côté Commercial : chaque carte ouvre la fiche
 * produit (/produit/{id}/detail, même écran que le Coordinateur — voir
 * EcranDetailProduit.tsx) plutôt qu'une fiche d'achat.
 */
export function EcranCatalogue() {
  return (
    <Suspense>
      <CatalogueContenu />
    </Suspense>
  );
}

function CatalogueContenu() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorieInitiale = CATEGORIES.some((c) => c.id === searchParams.get("categorie"))
    ? (searchParams.get("categorie") as (typeof CATEGORIES)[number]["id"])
    : "tout";

  const [categorie, setCategorie] = useState<(typeof CATEGORIES)[number]["id"]>(categorieInitiale);
  const [produits, setProduits] = useState<Produit[] | null>(null);

  const categorieActive = useMemo(() => CATEGORIES.find((c) => c.id === categorie), [categorie]);

  useEffect(() => {
    if (!token) return;
    let annule = false;
    const params = categorieActive?.categorieId ? `?categorie_id=${categorieActive.categorieId}` : "";
    apiFetch<Pagination<Produit>>(`/produits${params}`, { token })
      .then((page) => {
        if (!annule) setProduits(page.data);
      })
      .catch(() => {
        if (!annule) setProduits([]);
      });
    return () => {
      annule = true;
    };
  }, [token, categorieActive]);

  return (
    <main className="min-h-full pb-8">
      {/* Léger espace sous le haut de l'écran, puis la bâche entière. */}
      <div aria-hidden="true" className="relative z-10 pt-2.5">
        <div className="w-full" style={STYLE_BACHE} />
      </div>

      {/* Remonte sous les festons : la bâche est posée sur le rectangle Market'Space. */}
      <section style={{ marginTop: `-${(100 * BACHE.festons) / BACHE.l}%` }} className="bg-gradient-espace relative mx-3 overflow-hidden rounded-[15px] px-5 pb-6 pt-5 text-white">
        <div className="relative flex h-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900">
          <h1 className="text-center text-lg font-bold">Market&apos;Space</h1>
        </div>

        <div className="mt-4 flex justify-between gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategorie(cat.id)}
              style={{ width: 83, height: 28, borderWidth: 3, borderRadius: 14 }}
              className={`flex shrink-0 items-center justify-center border text-[11px] font-semibold transition-colors ${
                categorie === cat.id ? "border-white bg-white text-[color:var(--brand-blue-end)]" : "border-white/30 bg-white/10 text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 px-4">
        {produits === null ? (
          <p className="col-span-2 text-center text-sm text-brand-muted">Chargement…</p>
        ) : produits.length === 0 ? (
          <p className="col-span-2 text-center text-sm text-brand-muted">Aucun produit dans cette catégorie.</p>
        ) : (
          produits.map((produit) => (
            <button
              key={produit.id}
              type="button"
              onClick={() => router.push(`/produit/${produit.id}/detail`)}
              className="overflow-hidden rounded-2xl bg-white p-2 text-left shadow-sm"
            >
              <div className="relative aspect-square overflow-hidden rounded-xl">
                <ImageProduitCard images={produit.images} nom={produit.nom_produit} />
              </div>
              <div className="px-1 pt-2.5 pb-1">
                <p className="text-sm font-bold text-brand-ink">{produit.nom_produit}</p>
                <p className="mt-0.5 truncate text-xs text-brand-muted">{produit.description ?? produit.categorie.nom_categorie}</p>
                <p className="mt-1.5 text-sm font-bold text-brand-ink">{formaterPrix(produit.prix)} CFA</p>
              </div>
            </button>
          ))
        )}
      </section>
    </main>
  );
}
