"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiRequestError, messageErreurApi } from "@/lib/api";
import { ChevronLeftIcon, MonitorIcon } from "@/components/icons";
import { CarteEnTeteNoir } from "@/components/commande/CarteEnTeteNoir";
import { DetailCommande } from "@/components/discussion/DetailCommande";
import { formaterMontant, type DonneesCommandeCreee, type ExtractionTexte, type Localite, type ProduitChoix } from "@/lib/types";
import { useRetour } from "@/lib/navigation";

const CHAMP = "w-full rounded-full bg-white px-4 py-2.5 text-sm text-brand-ink outline-none placeholder:text-brand-muted";
const CHAMP_RECAP = "w-full rounded-xl border border-brand-line bg-white px-3.5 py-2.5 text-sm text-brand-ink outline-none placeholder:text-brand-muted";

/** "AAAA-MM-JJ" / "HH:MM" locaux (inputs date/time), jamais en UTC. */
function aujourdhuiLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function libelleLocalite(l: Localite): string {
  return l.type === "commune_abidjan" ? `Abidjan, ${l.nom}` : l.nom;
}

function estPassee(date: Date): boolean {
  return date.getTime() <= Date.now();
}

function formaterDateHeure(date: Date): string {
  return date.toLocaleString("fr-FR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
}

/**
 * "Nouvelle commande" — atteint depuis le "+" de la discussion produit.
 * Le commercial saisit le client, le lieu (localité + précision libre) et
 * la date de livraison : immédiate, ou programmée à une date et une heure —
 * la commande n'est alors transmise à la coordination qu'une heure avant
 * (CommandeController::resoudreDateTransmission()). Au récapitulatif, il
 * peut encore corriger le lieu et les frais de livraison proposés par le
 * barème (frais_livraison accepté pour le rôle commercial côté backend).
 */
export function EcranNouvelleCommande({ produitId }: { produitId: number }) {
  const { token } = useAuth();
  const router = useRouter();
  const retour = useRetour(`/produit/${produitId}`);

  const [produit, setProduit] = useState<ProduitChoix | null>(null);
  const [localites, setLocalites] = useState<Localite[] | null>(null);
  const [etape, setEtape] = useState<"saisie" | "recapitulatif">("saisie");

  const [texteLivraison, setTexteLivraison] = useState("");
  const [notes, setNotes] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [localiteId, setLocaliteId] = useState<number | null>(null);
  const [precisionLieu, setPrecisionLieu] = useState("");

  const [modeLivraison, setModeLivraison] = useState<"immediate" | "programmee">("immediate");
  const [dateLivraison, setDateLivraison] = useState("");
  const [heureLivraison, setHeureLivraison] = useState("");

  const [collageEnCours, setCollageEnCours] = useState(false);
  const [erreurCollage, setErreurCollage] = useState<string | null>(null);
  /** Frais proposés par le barème pour la localité choisie (null = aucun tarif prévu). */
  const [fraisBareme, setFraisBareme] = useState<number | null>(null);
  /** Frais retenus — modifiables par le commercial au récapitulatif. */
  const [fraisSaisis, setFraisSaisis] = useState("");
  const [chargementFrais, setChargementFrais] = useState(false);
  const [erreurSaisie, setErreurSaisie] = useState<string | null>(null);
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
      if (resultat.nom) setNom(resultat.nom);
      if (resultat.telephone) setTelephone(resultat.telephone);

      if (resultat.ville && localites) {
        const suggestion = localites.find((l) => l.nom.toLowerCase().includes(resultat.ville!.toLowerCase()));
        if (suggestion) setLocaliteId(suggestion.id);
      }
    } catch {
      setErreurCollage("Impossible de lire le presse-papiers ou d'analyser le texte — remplis les champs manuellement.");
    } finally {
      setCollageEnCours(false);
    }
  }

  /** Tarif du barème pour une localité ; sans tarif prévu, le commercial saisit lui-même les frais. */
  async function chargerFrais(idLocalite: number) {
    if (!token) return;
    setChargementFrais(true);
    try {
      const resultat = await apiFetch<{ frais_livraison: number }>(`/produits/${produitId}/frais-livraison?localite_id=${idLocalite}`, { token });
      setFraisBareme(resultat.frais_livraison);
      setFraisSaisis(String(Math.round(resultat.frais_livraison)));
    } catch (e) {
      if (e instanceof ApiRequestError && e.status === 422) {
        setFraisBareme(null);
        setFraisSaisis("");
      } else {
        throw e;
      }
    } finally {
      setChargementFrais(false);
    }
  }

  const dateProgrammee = modeLivraison === "programmee" && dateLivraison && heureLivraison ? new Date(`${dateLivraison}T${heureLivraison}`) : null;
  // Date passée : vérifiée au clic (voirRecapitulatif), et de nouveau par le backend.
  const programmationInvalide = modeLivraison === "programmee" && (!dateProgrammee || Number.isNaN(dateProgrammee.getTime()));

  async function voirRecapitulatif() {
    if (!token || !produit || !localiteId) return;

    if (programmationInvalide || (dateProgrammee && estPassee(dateProgrammee))) {
      setErreurSaisie("Choisis une date et une heure de livraison à venir.");
      return;
    }

    setErreurSaisie(null);
    try {
      await chargerFrais(localiteId);
      setEtape("recapitulatif");
    } catch (e) {
      setErreurSaisie(messageErreurApi(e));
    }
  }

  async function changerLocaliteRecap(id: number | null) {
    setLocaliteId(id);
    if (id === null) return;
    try {
      await chargerFrais(id);
    } catch (e) {
      setErreurEnvoi(messageErreurApi(e));
    }
  }

  const fraisRetenus = fraisSaisis.trim() === "" ? null : Number(fraisSaisis);
  const fraisValides = fraisRetenus !== null && Number.isFinite(fraisRetenus) && fraisRetenus >= 0;

  async function envoyer() {
    if (!token || !produit || !localiteId || !fraisValides) return;

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
        body: { localite_id: localiteId, precision: precisionLieu.trim() || undefined },
      });

      await apiFetch("/commandes", {
        method: "POST",
        token,
        body: {
          client_id: client.id,
          adresse_id: adresse.id,
          lignes: [{ produit_id: produitId, quantite: 1 }],
          frais_livraison: fraisRetenus,
          // ISO (UTC) : le backend la convertit, et transmet la commande une heure avant.
          date_livraison_prevue: dateProgrammee ? dateProgrammee.toISOString() : undefined,
          notes: notes || undefined,
        },
      });

      // Retour à la discussion produit, où la nouvelle commande apparaît
      // tout de suite comme carte système.
      router.push(`/produit/${produitId}`);
    } catch (e) {
      setErreurEnvoi(messageErreurApi(e));
    } finally {
      setEnvoiEnCours(false);
    }
  }

  const localiteChoisie = localites?.find((l) => l.id === localiteId) ?? null;
  const zoneLivraison = localiteChoisie
    ? `${localiteChoisie.type === "commune_abidjan" ? "Abidjan" : localiteChoisie.nom}, ${localiteChoisie.nom}${precisionLieu.trim() ? ` — ${precisionLieu.trim()}` : ""}`
    : null;

  // Number(...) : le cast decimal:2 de Laravel sérialise les prix en chaîne ("350000.00").
  const prixProduit = produit ? Number(produit.prix_vente ?? produit.prix) : 0;
  const apercu: DonneesCommandeCreee | null = produit
    ? {
        nom_produit: produit.nom_produit,
        photo: produit.images[0]?.url_image ?? null,
        prix_produit: prixProduit,
        nom_client: nom,
        telephone,
        zone_livraison: zoneLivraison,
        date_livraison_prevue: dateProgrammee ? dateProgrammee.toISOString() : null,
        frais_livraison: fraisValides ? fraisRetenus : 0,
        remise: 0,
        total: prixProduit + (fraisValides ? fraisRetenus : 0),
        bonus_offerts: null,
      }
    : null;

  const degradeStyle = { background: "linear-gradient(90deg, #0077FF 0%, #00BFFF 100%)", boxShadow: "0px 12px 12px 12px rgba(0, 119, 255, 0.08)" };

  const selecteurLocalite = (classe: string, onChange: (id: number | null) => void) => (
    <select value={localiteId ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className={classe}>
      <option value="">Choisir la localité de livraison</option>
      {localites?.map((l) => (
        <option key={l.id} value={l.id}>
          {libelleLocalite(l)}
        </option>
      ))}
    </select>
  );

  if (etape === "saisie") {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="bg-gradient-espace shrink-0 rounded-b-[28px] px-4 pb-6 pt-4 text-white">
          <div className="flex items-center gap-3">
            <button type="button" onClick={retour} aria-label="Retour" className="flex h-8 w-8 shrink-0 items-center justify-center">
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
                placeholder="Coller ici les informations de livraison, le nom, le lieu de livraison et le numéro de téléphone"
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

            <div className="space-y-3 rounded-2xl bg-[#F5F7FA] p-3.5">
              <p className="text-xs font-bold text-brand-muted">Client et lieu de livraison</p>
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du client" className={CHAMP} />
              <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Numéro de téléphone" className={CHAMP} />
              {selecteurLocalite(CHAMP, setLocaliteId)}
              <input
                value={precisionLieu}
                onChange={(e) => setPrecisionLieu(e.target.value)}
                placeholder="Précision du lieu (quartier, repère…) — optionnel"
                maxLength={255}
                className={CHAMP}
              />
            </div>

            <div className="space-y-3 rounded-2xl bg-[#F5F7FA] p-3.5">
              <p className="text-xs font-bold text-brand-muted">Date de livraison</p>
              <div className="flex h-11 rounded-full bg-white p-1">
                {(
                  [
                    ["immediate", "Immédiate"],
                    ["programmee", "Choisir une date"],
                  ] as const
                ).map(([valeur, libelle]) => (
                  <button
                    key={valeur}
                    type="button"
                    onClick={() => setModeLivraison(valeur)}
                    aria-pressed={modeLivraison === valeur}
                    className={`flex-1 rounded-full text-sm font-semibold transition-colors ${
                      modeLivraison === valeur ? "bg-gradient-espace text-white" : "text-brand-muted"
                    }`}
                  >
                    {libelle}
                  </button>
                ))}
              </div>

              {modeLivraison === "programmee" ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateLivraison}
                      min={aujourdhuiLocal()}
                      onChange={(e) => setDateLivraison(e.target.value)}
                      aria-label="Date de livraison"
                      className={CHAMP}
                    />
                    <input
                      type="time"
                      value={heureLivraison}
                      onChange={(e) => setHeureLivraison(e.target.value)}
                      aria-label="Heure de livraison"
                      className={CHAMP}
                    />
                  </div>
                  <p className="text-xs text-brand-muted">
                    {dateProgrammee && !programmationInvalide
                      ? `La commande sera transmise à la coordination le ${formaterDateHeure(new Date(dateProgrammee.getTime() - 3600_000))}, une heure avant la livraison.`
                      : "La commande sera transmise à la coordination une heure avant la date choisie."}
                  </p>
                </>
              ) : (
                <p className="text-xs text-brand-muted">La commande est transmise tout de suite à la coordination.</p>
              )}
            </div>

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

            {erreurSaisie ? <p className="text-center text-xs text-rose-500">{erreurSaisie}</p> : null}

            <button
              type="button"
              onClick={voirRecapitulatif}
              disabled={!nom.trim() || !telephone.trim() || !localiteId || chargementFrais || programmationInvalide}
              style={degradeStyle}
              className="h-12 w-full rounded-[11px] text-sm font-bold text-white disabled:opacity-50"
            >
              {chargementFrais ? "Vérification…" : "Vois le récapitulatif"}
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

          <div className="mt-4 space-y-3 rounded-[24px] bg-white p-4 shadow-sm shadow-slate-900/10">
            <p className="text-sm font-bold text-brand-ink">Livraison</p>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-brand-muted">Lieu de livraison</span>
              {selecteurLocalite(CHAMP_RECAP, changerLocaliteRecap)}
            </label>
            <input
              value={precisionLieu}
              onChange={(e) => setPrecisionLieu(e.target.value)}
              placeholder="Précision du lieu (quartier, repère…)"
              maxLength={255}
              aria-label="Précision du lieu"
              className={CHAMP_RECAP}
            />

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-brand-muted">Frais de livraison (CFA)</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={fraisSaisis}
                onChange={(e) => setFraisSaisis(e.target.value)}
                placeholder="Saisir les frais"
                className={CHAMP_RECAP}
              />
            </label>
            <p className={`text-xs ${fraisBareme === null && !chargementFrais ? "text-orange-600" : "text-brand-muted"}`}>
              {chargementFrais
                ? "Calcul des frais…"
                : fraisBareme === null
                  ? "Aucun tarif prévu pour cette localité — saisis les frais de livraison."
                  : `Tarif prévu : ${formaterMontant(fraisBareme)}. Tu peux le modifier.`}
            </p>
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
              disabled={envoiEnCours || !localiteId || !fraisValides || chargementFrais}
              style={degradeStyle}
              className="h-12 flex-[216] rounded-[11px] text-sm font-bold text-white disabled:opacity-50"
            >
              {envoiEnCours ? "Envoi…" : dateProgrammee ? "Programmer" : "Envoyer"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
