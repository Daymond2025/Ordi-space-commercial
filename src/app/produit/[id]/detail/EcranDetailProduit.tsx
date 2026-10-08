"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, BASE_URL } from "@/lib/api";
import {
  CarteGraphiqueIcon,
  CheckIcon,
  ChevronLeftIcon,
  CopyIcon,
  DisqueIcon,
  DownloadIcon,
  EcranIcon,
  EngrenageIcon,
  FenetresIcon,
  ImageIcon,
  MemoireIcon,
  MonitorIcon,
  ProcesseurIcon,
  TruckIcon,
} from "@/components/icons";
import { VisionneuseImages } from "@/components/produit/VisionneuseImages";
import { ETATS_PRODUIT } from "@/lib/produitBoutique";
import type { ProduitDetail } from "@/lib/types";

const ONGLETS = [
  { id: "cadeaux", label: "Les cadeaux" },
  { id: "description", label: "Description" },
  { id: "pack", label: "Pack complet" },
] as const;

const LIBELLE_ETAT_PRODUIT: Record<string, string> = Object.fromEntries(ETATS_PRODUIT.map((e) => [e.valeur, e.label]));

function formaterPrix(valeur: number): string {
  return `${Math.round(valeur).toLocaleString("fr-FR").replace(/ |,/g, " ")} CFA`;
}

function formaterDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

/**
 * Texte prêt à coller dans une publication (statut WhatsApp, réseau social…)
 * — demande explicite "copier les infos d'un produit [...] pour faire des
 * publications avec toutes les infos". Reprend les mêmes champs que la
 * fiche (prix, specs, cadeaux, livraison, garantie), rien de plus.
 */
function composerTexteProduit(produit: ProduitDetail): string {
  const lignes: string[] = [`🖥️ ${produit.nom_produit}`];

  const specs = [produit.processeur, produit.memoire_ram, produit.stockage, produit.carte_graphique, produit.taille, produit.systeme_exploitation].filter(
    (v): v is string => Boolean(v)
  );
  if (specs.length > 0) lignes.push(specs.join(" • "));

  lignes.push("");
  const prix = produit.prix_vente ?? produit.prix;
  if (produit.prix_barre && produit.prix_vente) {
    const reduction = produit.pourcentage_reduction ? ` (-${produit.pourcentage_reduction}%)` : "";
    lignes.push(`💰 Prix : ${formaterPrix(prix)} au lieu de ${formaterPrix(produit.prix_barre)}${reduction}`);
  } else {
    lignes.push(`💰 Prix : ${formaterPrix(prix)}`);
  }

  if (produit.description) {
    lignes.push("", produit.description);
  }

  if (produit.cadeaux && produit.cadeaux.length > 0) {
    lignes.push("", "🎁 Cadeaux offerts :", ...produit.cadeaux.map((c) => `- ${c}`));
  }

  const fraisLivraisonMin = produit.frais_livraison.length > 0 ? Math.min(...produit.frais_livraison.map((f) => Number(f.montant))) : null;
  if (fraisLivraisonMin !== null) lignes.push("", `📦 Livraison à partir de ${formaterPrix(fraisLivraisonMin)}`);
  if (produit.duree_garantie_mois) lignes.push(`🛡️ Garantie : ${produit.duree_garantie_mois} mois`);

  return lignes.join("\n");
}

function Badge({ couleur, label }: { couleur: "bleu" | "vert" | "rose" | "gris"; label: string }) {
  const styles: Record<typeof couleur, string> = {
    bleu: "border-blue-200 text-[color:var(--brand-blue-end)]",
    vert: "border-green-200 text-green-600",
    rose: "border-rose-200 text-rose-500",
    gris: "border-brand-line text-brand-ink",
  };
  const dot: Record<typeof couleur, string> = {
    bleu: "bg-blue-500",
    vert: "bg-green-500",
    rose: "bg-rose-500",
    gris: "hidden",
  };

  return (
    <span className={`flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-semibold ${styles[couleur]}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[couleur]}`} />
      {label}
    </span>
  );
}

type IconeSpec = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Fiche produit — reproduite de Cordinateur_App_Web/src/app/produit/[id]/
 * detail/EcranDetailProduit.tsx (demande explicite "on reproduit celle du
 * coordinateur au commercial") : photo plein écran + miniatures, carte prix
 * de vente/prix barré/économie, grille caractéristiques avec icônes, onglets
 * Cadeaux/Description/Pack complet, carte Livraison/Garantie. Retiré par
 * rapport à l'original (décision explicite, le Commercial n'a aucune de ces
 * permissions côté backend — voir RolesAndPermissionsSeeder::ROLE_COMMERCIAL) :
 * le menu ☰ (modifier/supprimer/stock), la rangée Refuser/Publier/Prix
 * (validation — de toute façon GET /produits ne lui expose jamais un produit
 * non publié), la rangée "Négociation de prix" et les cartes "Commission
 * apporteur"/"Commission Ordi'Space" (restent réservées Coordinateur/
 * Fournisseur).
 */
export function EcranDetailProduit({ produitId }: { produitId: number }) {
  const { token } = useAuth();
  const router = useRouter();
  const [produit, setProduit] = useState<ProduitDetail | null>(null);
  const [imageActive, setImageActive] = useState(0);
  const [visionneuseOuverte, setVisionneuseOuverte] = useState(false);
  const [ongletActif, setOngletActif] = useState<(typeof ONGLETS)[number]["id"]>("cadeaux");
  const [infosCopiees, setInfosCopiees] = useState(false);
  const [telechargementEnCours, setTelechargementEnCours] = useState(false);

  async function copierInfos() {
    if (!produit) return;
    const texte = composerTexteProduit(produit);
    try {
      await navigator.clipboard.writeText(texte);
      setInfosCopiees(true);
      setTimeout(() => setInfosCopiees(false), 2000);
    } catch {
      // Presse-papiers refusé (permission navigateur) : repli sur le partage natif.
      if (navigator.share) {
        try {
          await navigator.share({ title: produit.nom_produit, text: texte });
        } catch {
          // Partage annulé — pas une erreur à signaler.
        }
      }
    }
  }

  /**
   * Télécharge chaque photo du produit l'une après l'autre (voir
   * ProduitController::telechargerImage() — l'image est déjà publique, cette
   * route force juste le téléchargement au lieu de l'affichage inline, pour
   * que ça marche en cross-origin). Léger délai entre chaque déclenchement :
   * les navigateurs bloquent parfois une rafale de téléchargements simultanés.
   */
  async function telechargerImages() {
    if (!produit || telechargementEnCours) return;
    setTelechargementEnCours(true);
    try {
      for (const image of produit.images) {
        try {
          const reponse = await fetch(`${BASE_URL}/produits/${produit.id}/images/${image.id}/telecharger`);
          if (!reponse.ok) continue;
          // Le nom de fichier suggéré par le backend (Content-Disposition,
          // voir config/cors.php "exposed_headers") plutôt qu'un nom vide —
          // sinon le navigateur retombe sur un UUID généré pour le blob:.
          const entete = reponse.headers.get("content-disposition") ?? "";
          const nom = /filename="?([^";]+)"?/.exec(entete)?.[1] ?? `${produit.nom_produit}.jpg`;
          const blob = await reponse.blob();
          const url = URL.createObjectURL(blob);
          const lien = document.createElement("a");
          lien.href = url;
          lien.download = nom;
          document.body.appendChild(lien);
          lien.click();
          document.body.removeChild(lien);
          URL.revokeObjectURL(url);
        } catch {
          // Une photo en échec ne doit pas bloquer les suivantes.
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } finally {
      setTelechargementEnCours(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ProduitDetail>(`/produits/${produitId}`, { token })
      .then((data) => {
        if (!annule) setProduit(data);
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [token, produitId]);

  const enRupture = (produit?.quantite_stock ?? 0) <= 0;

  const specsResume = produit ? [produit.processeur, produit.memoire_ram, produit.stockage].filter((v): v is string => Boolean(v)) : [];
  const specsDetail = produit
    ? (
        [
          { label: "Processeur", valeur: produit.processeur, Icone: ProcesseurIcon },
          { label: "Disque dur", valeur: produit.stockage, Icone: DisqueIcon },
          { label: "Ram", valeur: produit.memoire_ram, Icone: MemoireIcon },
          { label: "Carte graphique", valeur: produit.carte_graphique, Icone: CarteGraphiqueIcon },
          { label: "Taille d'écran", valeur: produit.taille, Icone: EcranIcon },
          { label: "Système installé", valeur: produit.systeme_exploitation, Icone: FenetresIcon },
        ] as { label: string; valeur: string | null; Icone: IconeSpec }[]
      ).filter((s): s is { label: string; valeur: string; Icone: IconeSpec } => Boolean(s.valeur))
    : [];

  const imagesCadeaux = produit?.images_cadeaux ?? {};
  const packComplet = produit ? Array.from(new Set([...(produit.cadeaux ?? []), ...(produit.contenu_pack ?? [])])) : [];
  const fraisLivraisonMin =
    produit && produit.frais_livraison.length > 0 ? Math.min(...produit.frais_livraison.map((f) => Number(f.montant))) : null;

  return (
    <div className="flex h-full flex-col bg-[#f2f5fa]">
      <div className="flex h-[80px] shrink-0 items-center px-4 text-white" style={{ background: "rgba(0, 119, 255, 1)" }}>
        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Retour"
            className="flex h-[31px] w-8 shrink-0 items-center justify-center rounded-[7px]"
            style={{ background: "rgba(255, 255, 255, 0.23)" }}
          >
            <ChevronLeftIcon className="h-[19px] w-[19px]" />
          </button>
          <div className="flex-1">
            <p className="text-base font-extrabold leading-none">Détail produit</p>
            {produit ? <p className="mt-1 text-xs text-white/80">Enregistré le {formaterDate(produit.date_ajout)}</p> : null}
          </div>
          {/* "Copier les infos / télécharger les images" (demande explicite,
              pour préparer une publication) — voir composerTexteProduit()/
              telechargerImages() ci-dessus. */}
          {produit ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={copierInfos}
                aria-label="Copier les infos du produit"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px]"
                style={{ background: "rgba(255, 255, 255, 0.23)" }}
              >
                {infosCopiees ? <CheckIcon className="h-[17px] w-[17px]" /> : <CopyIcon className="h-[17px] w-[17px]" />}
              </button>
              <button
                type="button"
                onClick={telechargerImages}
                disabled={telechargementEnCours || produit.images.length === 0}
                aria-label="Télécharger les images du produit"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] disabled:opacity-50"
                style={{ background: "rgba(255, 255, 255, 0.23)" }}
              >
                <DownloadIcon className="h-[17px] w-[17px]" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
      {!produit ? (
        <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
      ) : (
        <div className="space-y-4 px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {produit.categorie ? <Badge couleur="bleu" label={produit.categorie.nom_categorie} /> : null}
            {produit.est_booste ? <Badge couleur="vert" label="Booster" /> : null}
            {enRupture ? <Badge couleur="rose" label="Indisponible" /> : <Badge couleur="vert" label="Disponible" />}
            <Badge couleur="gris" label={`QTE. ${produit.quantite_stock}`} />
          </div>

          <div className="relative -mx-4 h-[260px] w-[calc(100%+2rem)] shrink-0 bg-white">
            {produit.images[imageActive] ? (
              <button
                type="button"
                onClick={() => setVisionneuseOuverte(true)}
                aria-label="Voir la photo en grand"
                className="block h-full w-full cursor-zoom-in"
              >
                <Image src={produit.images[imageActive].url_image} alt={produit.nom_produit} fill className="object-cover" sizes="420px" />
              </button>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-brand-muted">
                <MonitorIcon className="h-10 w-10" />
              </div>
            )}
            {produit.etat_produit ? (
              <span
                className="absolute left-3 top-3 flex h-[22px] items-center rounded-lg px-2 text-xs font-bold leading-[14px] text-white"
                style={{ background: "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)", boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)" }}
              >
                {LIBELLE_ETAT_PRODUIT[produit.etat_produit] ?? produit.etat_produit}
              </span>
            ) : null}
            {produit.pourcentage_reduction ? (
              <span
                className="absolute right-3 top-3 flex h-[22px] items-center rounded px-2 text-xs font-bold leading-[14px] text-white"
                style={{ background: "linear-gradient(115.13deg, #FF9700 0%, #FFB800 100%)" }}
              >
                -{produit.pourcentage_reduction}%
              </span>
            ) : null}
          </div>

          {produit.images.length > 1 ? (
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {produit.images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setImageActive(index)}
                  className="relative h-[70px] w-[90px] shrink-0 overflow-hidden rounded-[5px] border-2 bg-white"
                  style={{ borderColor: index === imageActive ? "rgba(38, 128, 235, 1)" : "transparent" }}
                >
                  <Image src={image.url_image} alt="" fill className="object-cover" sizes="90px" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-black px-2 py-1 text-[10px] font-extrabold text-white">
                {produit.nom_produit.split(" ")[0].toUpperCase()}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {produit.quantite_stock} pièces disponible
              </span>
              <span className="rounded-full bg-[#F2F5FA] px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
                {produit.quantite_stock > 0 ? "En stock" : "Rupture"}
              </span>
            </div>

            <p className="mt-2 text-base font-bold text-brand-ink">{produit.nom_produit}</p>
            {specsResume.length > 0 ? <p className="text-xs text-brand-muted">{specsResume.join(" • ")}</p> : null}

            <div
              className="mt-2 flex min-h-[58px] flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg px-3 py-2"
              style={{ background: "rgba(242, 243, 255, 0.6)" }}
            >
              <div className="shrink-0">
                <p className="whitespace-nowrap text-[10px] text-brand-muted">
                  {produit.prix_vente ? "Prix de vente" : "Prix partenaire (prix public pas encore fixé)"}
                </p>
                <div className="mt-0.5 flex items-baseline gap-2 whitespace-nowrap">
                  <p className="text-[17px] font-extrabold text-orange-600">{formaterPrix(produit.prix_vente ?? produit.prix)}</p>
                  {produit.prix_barre ? <p className="text-[11px] text-brand-muted line-through">{formaterPrix(produit.prix_barre)}</p> : null}
                </div>
              </div>
              {produit.prix_barre && produit.prix_vente ? (
                <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Économie&nbsp;{formaterPrix(produit.prix_barre - produit.prix_vente)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-[13px] bg-white p-4" style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}>
            {specsDetail.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {specsDetail.map((spec) => (
                  <div key={spec.label} className="flex items-center gap-1.5 rounded-xl bg-[#F7F8FF] px-2 py-2.5">
                    <spec.Icone className="h-5 w-5 shrink-0 text-orange-500" />
                    <div className="min-w-0">
                      <p className="truncate text-[9px] text-brand-muted">{spec.label}</p>
                      <p className="text-[10px] font-extrabold leading-tight text-brand-ink">{spec.valeur}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div
              className={`flex gap-1 rounded-full bg-white p-1 ${specsDetail.length > 0 ? "mt-3" : ""}`}
              style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
            >
              {ONGLETS.map((onglet) => (
                <button
                  key={onglet.id}
                  type="button"
                  onClick={() => setOngletActif(onglet.id)}
                  className={`flex-1 rounded-full py-2 text-[11px] font-extrabold transition-colors ${
                    ongletActif === onglet.id ? "text-white shadow-[0px_3px_8px_0px_rgba(249,115,22,0.4)]" : "text-brand-muted"
                  }`}
                  style={ongletActif === onglet.id ? { background: "linear-gradient(90deg, #FBBF24 0%, #F97316 100%)" } : undefined}
                >
                  {onglet.label}
                </button>
              ))}
            </div>

            <div className="mt-3 min-h-[200px] rounded-[13px] p-4 text-xs text-brand-muted" style={{ background: "rgba(247, 248, 255, 1)" }}>
              {ongletActif === "cadeaux" ? (
                produit.cadeaux && produit.cadeaux.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {produit.cadeaux.map((nom) => (
                      <div key={nom} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F2F3FF]">
                          {imagesCadeaux[nom] ? (
                            // eslint-disable-next-line @next/next/no-img-element -- domaine backend dynamique, pas de config next/image nécessaire ici
                            <img src={imagesCadeaux[nom] as string} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-brand-muted" />
                          )}
                        </span>
                        <span className="text-sm font-semibold text-brand-ink">{nom}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  "Aucun cadeau pour ce produit."
                )
              ) : ongletActif === "description" ? (
                produit.description ? (
                  <p className="font-bold text-brand-ink">{produit.description}</p>
                ) : (
                  "Aucune description."
                )
              ) : packComplet.length > 0 ? (
                <ul className="list-disc space-y-1 pl-4">
                  {packComplet.map((item) => (
                    <li key={item} className="text-brand-ink">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                "Pack non renseigné."
              )}
            </div>
          </div>

          {fraisLivraisonMin !== null || produit.duree_garantie_mois ? (
            <div className="flex shrink-0 flex-col gap-3 rounded-xl bg-white p-4" style={{ boxShadow: "0px 1px 2px 0px rgba(0, 0, 0, 0.05)" }}>
              {fraisLivraisonMin !== null ? (
                <div className="flex min-h-[44px] items-center gap-3">
                  <TruckIcon viewBox="1 6 22 16" className="h-[14.67px] w-[20.17px] shrink-0" style={{ color: "rgba(255, 119, 0, 1)" }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-brand-ink">Livraison</p>
                    <p className="mt-0.5 text-xs text-brand-muted">À partir de {formaterPrix(fraisLivraisonMin)} — selon la localité</p>
                  </div>
                </div>
              ) : null}
              {produit.duree_garantie_mois ? (
                <div
                  className="flex min-h-[56px] items-center gap-3 rounded-xl px-4 py-1.5"
                  style={{ background: "linear-gradient(274.19deg, #23E755 3.13%, #008421 98.13%)" }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: "rgba(255, 255, 255, 0.54)" }}
                  >
                    <EngrenageIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1 text-white">
                    <p className="text-sm font-extrabold">Garantie</p>
                    <p className="text-xs">{produit.duree_garantie_mois} mois</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
      </div>

      {/* Barre d'action fixe — le Catalogue amène désormais ici (et non plus
          directement sur la discussion produit, voir EcranCatalogue.tsx) :
          sans ce bouton, le Commercial n'aurait plus aucun moyen de démarrer
          une vente depuis le catalogue, alors que vendre est tout son métier
          (retour explicite de l'utilisateur). Même écran "Nouvelle commande"
          que depuis le "+" de la discussion produit (EcranNouvelleCommande.tsx,
          déjà scopé à ce produit), qui renvoie ensuite vers la discussion où
          la commande créée apparaît comme carte système. */}
      {produit ? (
        <div className="shrink-0 border-t border-brand-line bg-white py-3">
          <button
            type="button"
            onClick={() => router.push(`/produit/${produit.id}/nouvelle-commande`)}
            disabled={enRupture}
            className="mx-auto flex items-center justify-center text-sm font-bold text-white disabled:opacity-50"
            style={{
              width: 326,
              height: 41,
              borderRadius: 27.5,
              background: "linear-gradient(273.52deg, #FFCC00 -3.09%, #FF7800 98.47%)",
              border: "2px solid rgba(158, 158, 158, 0.21)",
            }}
          >
            {enRupture ? "Produit indisponible" : "Créer une commande"}
          </button>
        </div>
      ) : null}

      {visionneuseOuverte && produit ? (
        <VisionneuseImages
          images={produit.images.map((image) => image.url_image)}
          indexInitial={imageActive}
          onFermer={() => setVisionneuseOuverte(false)}
        />
      ) : null}
    </div>
  );
}
