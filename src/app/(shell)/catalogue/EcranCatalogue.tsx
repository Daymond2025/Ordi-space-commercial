"use client";

import Image from "next/image";
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
      <div className="relative h-[87px] w-full overflow-hidden">
        <div className="absolute left-1/2 h-full w-[420px] -translate-x-1/2">
          <Image
            src="/images/bache-marketspace.png"
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: "50% 35%" }}
            priority
          />
        </div>
      </div>

      <section className="bg-gradient-espace relative -mt-5 mx-3 overflow-hidden rounded-[15px] px-5 pb-6 pt-5 text-white">
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
