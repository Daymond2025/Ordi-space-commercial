"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, messageErreurApi } from "@/lib/api";
import { ChevronLeftIcon, MonitorIcon } from "@/components/icons";
import { CarteEnTeteNoir } from "@/components/commande/CarteEnTeteNoir";
import { DetailCommande } from "@/components/discussion/DetailCommande";
import type { DonneesCommandeCreee, ExtractionTexte, Localite, ProduitChoix } from "@/lib/types";

/**
 * "Nouvelle commande" — copié de Cordinateur_App_Web/src/app/produit/[id]/
 * nouvelle-commande/EcranNouvelleCommande.tsx (même écran d'origine, demande
 * explicite "même processus d'ajout d'une nouvelle commande"). Atteint
 * depuis le "+" de la discussion produit (EcranDiscussionProduit.tsx) : le
 * produit est déjà connu (id dans l'URL), plus besoin du sélecteur de
 * l'ancienne version générique de cette app (remplacée par cet écran).
 */
export function EcranNouvelleCommande({ produitId }: { produitId: number }) {
  const { token } = useAuth();
  const router = useRouter();

  const [produit, setProduit] = useState<ProduitChoix | null>(null);
  const [localites, setLocalites] = useState<Localite[] | null>(null);
  const [etape, setEtape] = useState<"saisie" | "recapitulatif">("saisie");

  const [texteLivraison, setTexteLivraison] = useState("");
  const [notes, setNotes] = useState("");
  const [extraction, setExtraction] = useState<ExtractionTexte | null>(null);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [localiteId, setLocaliteId] = useState<number | null>(null);

  const [collageEnCours, setCollageEnCours] = useState(false);
  const [erreurCollage, setErreurCollage] = useState<string | null>(null);
  const [fraisLivraison, setFraisLivraison] = useState<number | null>(null);
  const [chargementRecap, setChargementRecap] = useState(false);
  const [erreurRecap, setErreurRecap] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ProduitChoix>(`/produits/${produitId}`, { token })
      .then((data) => {
        if (!annule) setProduit(data);
      })
      .catch(() => {});

    apiFetch<Localite[]>("/localites", { token })
      .then((data) => {
        if (!annule) setLocalites(data);
      })
      .catch(() => {});

    return () => {
      annule = true;
    };
  }, [token, produitId]);

  async function coller() {
    if (!token || collageEnCours) return;

    setErreurCollage(null);
    setCollageEnCours(true);

    try {
      const texte = await navigator.clipboard.readText();
      setTexteLivraison(texte);

      const resultat = await apiFetch<ExtractionTexte>("/clients/extraction", { method: "POST", token, body: { texte } });
      setExtraction(resultat);
      setNom(resultat.nom ?? "");
      setTelephone(resultat.telephone ?? "");

      if (resultat.ville && localites) {
        const suggestion = localites.find((l) => l.nom.toLowerCase().includes(resultat.ville!.toLowerCase()));
        if (suggestion) setLocaliteId(suggestion.id);
      }
    } catch {
      setErreurCollage("Impossible de lire le presse-papiers ou d'analyser le texte — remplis les champs manuellement.");
      setExtraction({ nom: null, telephone: null, ville: null });
    } finally {
      setCollageEnCours(false);
    }
  }

  async function voirRecapitulatif() {
    if (!token || !produit || !localiteId) return;

    setErreurRecap(null);
    setChargementRecap(true);

    try {
      const resultat = await apiFetch<{ frais_livraison: number }>(
        `/produits/${produitId}/frais-livraison?localite_id=${localiteId}`,
        { token }
      );
      setFraisLivraison(resultat.frais_livraison);
      setEtape("recapitulatif");
    } catch (e) {
      setErreurRecap(messageErreurApi(e));
    } finally {
      setChargementRecap(false);
    }
  }

  async function envoyer() {
    if (!token || !produit || fraisLivraison === null || !localiteId) return;

    setErreurEnvoi(null);
    setEnvoiEnCours(true);

    try {
      const client = await apiFetch<{ id: number }>("/clients/creation-rapide", {
        method: "POST",
        token,
        body: { nom, telephone },
      });

      const adresse = await apiFetch<{ id: number }>(`/clients/${client.id}/adresses`, {
        method: "POST",
        token,
        body: { localite_id: localiteId },
      });

      await apiFetch("/commandes", {
        method: "POST",
        token,
        body: {
          client_id: client.id,
          adresse_id: adresse.id,
          lignes: [{ produit_id: produitId, quantite: 1 }],
          notes: notes || undefined,
        },
      });

      // Retour à la discussion produit, où la nouvelle commande apparaît
      // tout de suite comme carte système — même logique que Coordinateur.
      router.push(`/produit/${produitId}`);
    } catch (e) {
      setErreurEnvoi(messageErreurApi(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  const localiteChoisie = localites?.find((l) => l.id === localiteId) ?? null;
  const zoneLivraison = localiteChoisie
    ? `${localiteChoisie.type === "commune_abidjan" ? "Abidjan" : localiteChoisie.nom}, ${localiteChoisie.nom}`
    : null;

  const apercu: DonneesCommandeCreee | null =
    produit && fraisLivraison !== null
      ? {
          nom_produit: produit.nom_produit,
          photo: produit.images[0]?.url_image ?? null,
          // Number(...) : le cast decimal:2 de Laravel sérialise les prix en
          // chaîne ("350000.00"), sinon `+` ferait une concaténation.
          prix_produit: Number(produit.prix_vente ?? produit.prix),
          nom_client: nom,
          telephone,
          zone_livraison: zoneLivraison,
          date_livraison_prevue: null,
          frais_livraison: fraisLivraison,
          remise: 0,
          total: Number(produit.prix_vente ?? produit.prix) + fraisLivraison,
          bonus_offerts: null,
        }
      : null;

  const degradeStyle = { background: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)", boxShadow: "0px 12px 12px 12px rgba(0, 119, 255, 0.08)" };

  if (etape === "saisie") {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="bg-gradient-espace shrink-0 rounded-b-[28px] px-4 pb-6 pt-4 text-white">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} aria-label="Retour" className="flex h-8 w-8 shrink-0 items-center justify-center">
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <p className="flex-1 text-center text-lg font-extrabold">Nouvelle commande</p>
            <div className="h-8 w-8 shrink-0" />
          </div>

          {produit ? (
            <div className="mt-4 flex gap-3 rounded-[9px] bg-white p-2.5 text-brand-ink" style={{ boxShadow: "1px 1px 2px 0px rgba(0, 0, 0, 0.25)" }}>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[9px] bg-[#F6F8FE]">
                {produit.images[0]?.url_image ? (
                  <Image src={produit.images[0].url_image} alt={produit.nom_produit} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-brand-muted">
                    <MonitorIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{produit.nom_produit}</p>
                <span className="mt-1.5 inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                  {produit.quantite_stock} pièces disponible en stock
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex-1 rounded-t-[28px] bg-white px-4 py-5">
          <div className="mx-auto -mt-1.5 mb-3 h-1 w-10 shrink-0 rounded-full bg-brand-line" />

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-center text-sm font-bold text-brand-muted">Informations de livraison</p>
              <textarea
                value={texteLivraison}
                onChange={(e) => setTexteLivraison(e.target.value)}
                placeholder="Coller ici les informations de livraison, le nom, le lieu de livraison, le numéro de téléphone et la date de livraison"
                rows={4}
                className="w-full rounded-2xl border border-brand-line px-3.5 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
              />
              <button
                type="button"
                onClick={coller}
                disabled={collageEnCours}
                style={degradeStyle}
                className="mt-3 h-12 w-full rounded-[11px] text-sm font-bold text-white disabled:opacity-50"
              >
                {collageEnCours ? "Analyse en cours…" : "Coller"}
              </button>
              {erreurCollage ? <p className="mt-2 text-xs text-rose-500">{erreurCollage}</p> : null}
            </div>

            {extraction ? (
              <div className="space-y-3 rounded-2xl bg-[#F5F7FA] p-3.5">
                <p className="text-xs font-bold text-brand-muted">Informations extraites, corrige si besoin</p>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Nom du client"
                  className="w-full rounded-full bg-white px-4 py-2.5 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
                />
                <input
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Numéro de téléphone"
                  className="w-full rounded-full bg-white px-4 py-2.5 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
                />
                <select
                  value={localiteId ?? ""}
                  onChange={(e) => setLocaliteId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-full bg-white px-4 py-2.5 text-sm text-brand-ink outline-none"
                >
                  <option value="">Choisir la localité de livraison</option>
                  {localites?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.type === "commune_abidjan" ? `Abidjan, ${l.nom}` : l.nom}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-center text-sm font-bold text-brand-muted">Informations complémentaires</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajouter des volontés du client ou une précision"
                rows={3}
                className="w-full rounded-2xl border border-brand-line px-3.5 py-3 text-sm text-brand-ink outline-none placeholder:text-brand-muted"
              />
            </div>

            {erreurRecap ? <p className="text-center text-xs text-rose-500">{erreurRecap}</p> : null}

            <button
              type="button"
              onClick={voirRecapitulatif}
              disabled={!nom.trim() || !telephone.trim() || !localiteId || chargementRecap}
              style={degradeStyle}
              className="h-12 w-full rounded-[11px] text-sm font-bold text-white disabled:opacity-50"
            >
              {chargementRecap ? "Vérification…" : "Vois le récapitulatif"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="h-[200px] shrink-0 rounded-b-[30px] px-4 pt-4 text-white" style={degradeStyle}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setEtape("saisie")} aria-label="Retour" className="flex h-8 w-8 shrink-0 items-center justify-center">
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <p className="flex-1 text-center text-lg font-extrabold">Nouvelle commande</p>
          <div className="h-8 w-8 shrink-0" />
        </div>
      </div>

      {apercu ? (
        <div className="-mt-[111px] flex-1 px-[19px] pb-6">
          <div className="rounded-[24px] bg-white p-3 shadow-sm shadow-slate-900/10">
            <CarteEnTeteNoir titre="Récapitulatif">
              <DetailCommande donnees={apercu} />
            </CarteEnTeteNoir>
          </div>

          {erreurEnvoi ? <p className="mt-3 text-center text-xs text-rose-500">{erreurEnvoi}</p> : null}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setEtape("saisie")}
              style={{
                background: "linear-gradient(rgba(0,119,255,0.08), rgba(0,119,255,0.08)) padding-box, linear-gradient(90deg, #0077FF 0%, #00BFFF 100%) border-box",
                border: "1px solid transparent",
                boxShadow: "0px 12px 12px 12px rgba(0, 119, 255, 0.08)",
              }}
              className="h-12 flex-[139] rounded-[11px] text-sm font-bold text-[color:var(--brand-blue-end)]"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={envoyer}
              disabled={envoiEnCours}
              style={degradeStyle}
              className="h-12 flex-[216] rounded-[11px] text-sm font-bold text-white disabled:opacity-50"
            >
              {envoiEnCours ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
