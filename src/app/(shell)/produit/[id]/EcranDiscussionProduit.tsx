"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { EnTeteDiscussion } from "@/components/discussion/EnTeteDiscussion";
import { CarteCommandeDiscussion } from "@/components/discussion/CarteCommandeDiscussion";
import { BulleMessage } from "@/components/discussion/BulleMessage";
import { BarreDeSaisie } from "@/components/discussion/BarreDeSaisie";
import type { ConversationProduit, ItemFil, ProduitDetail } from "@/lib/types";

/**
 * "Discussion produit" — copié de Cordinateur_App_Web/src/app/(shell)/
 * produit/[id]/EcranDiscussionProduit.tsx (même écran d'origine, demande
 * explicite "mêmes écrans que chez le Coordinateur"). GET /produits/{id}/
 * conversation est déjà scopé aux commandes DE ce commercial côté backend
 * (MessageController::conversationProduit(), branche ROLE_COMMERCIAL) —
 * jamais les commandes des autres commerciaux sur le même produit.
 */
export function EcranDiscussionProduit({ produitId }: { produitId: number }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [filtre, setFiltre] = useState("tous");
  const [conversation, setConversation] = useState<ConversationProduit | null>(null);
  const [produit, setProduit] = useState<ProduitDetail | null>(null);
  const [chargement, setChargement] = useState(true);

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

  async function recharger() {
    if (!token) return;
    const data = await apiFetch<ConversationProduit>(`/produits/${produitId}/conversation?statut=${filtre}`, { token });
    setConversation(data);
  }

  useEffect(() => {
    if (!token) return;
    let annule = false;

    apiFetch<ConversationProduit>(`/produits/${produitId}/conversation?statut=${filtre}`, { token })
      .then((data) => {
        if (!annule) setConversation(data);
      })
      .catch(() => {
        if (!annule) setConversation(null);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });

    return () => {
      annule = true;
    };
  }, [token, produitId, filtre]);

  async function envoyerMessage(texte: string) {
    if (!token) return;
    await apiFetch(`/produits/${produitId}/messages`, { method: "POST", token, body: { contenu: texte } });
    await recharger();
  }

  async function envoyerAudio(blob: Blob) {
    if (!token) return;
    const formData = new FormData();
    formData.append("fichier", blob, "message-vocal.webm");
    formData.append("type", "note_vocale");
    await apiFetch(`/produits/${produitId}/messages`, { method: "POST", token, body: formData });
    await recharger();
  }

  const items: ItemFil[] = conversation?.items ?? [];
  const nomProduit = produit?.nom_produit ?? `Produit #${produitId}`;
  const photo = produit?.images[0]?.url_image ?? null;

  return (
    <div className="flex h-full flex-col">
      <EnTeteDiscussion
        nomProduit={nomProduit}
        photo={photo}
        stats={conversation?.en_tete ?? { recues: 0, livrees: 0, annulees: 0, en_cours: 0 }}
        filtre={filtre}
        onFiltrer={setFiltre}
        telephoneFournisseur={produit?.fournisseur?.user?.telephone ?? null}
      />

      <div className="relative flex-1 overflow-y-auto bg-[#f6f2ed]">
        <div className="space-y-3 px-3 py-4 pb-20">
          {chargement ? (
            <p className="py-10 text-center text-sm text-brand-muted">Chargement…</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-brand-muted">Aucune activité pour l&apos;instant.</p>
          ) : (
            items.map((item) =>
              item.type === "commande" ? (
                <CarteCommandeDiscussion key={`commande-${item.donnee.commande_id}`} carte={item.donnee} />
              ) : (
                <BulleMessage key={`message-${item.donnee.id}`} message={item.donnee} estMoi={item.donnee.auteur_id === user?.id} />
              )
            )
          )}
        </div>

        <button
          type="button"
          aria-label="Ajouter une commande"
          onClick={() => router.push(`/produit/${produitId}/nouvelle-commande`)}
          className="bg-gradient-espace absolute bottom-4 right-4 flex h-[50px] w-[50px] items-center justify-center rounded-full border-[3px] border-white text-2xl font-light text-white"
          style={{ boxShadow: "0px 12px 12px 12px rgba(0, 119, 255, 0.08)" }}
        >
          +
        </button>
      </div>

      <BarreDeSaisie onEnvoyer={envoyerMessage} onEnvoyerAudio={envoyerAudio} />
    </div>
  );
}
