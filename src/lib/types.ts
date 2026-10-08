/**
 * GET /moi/profil (MoiController::profil()) — `nom_entreprise`/`localisation`
 * viennent de la branche ROLE_COMMERCIAL (saisis par le coordinateur, voir
 * migration add_nom_entreprise_et_localisation_to_commerciaux_table),
 * absents (null) tant qu'il ne les a pas encore renseignés.
 */
export type ProfilUtilisateur = {
  id: number;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string | null;
  photo: string | null;
  type_utilisateur: string;
  created_at: string;
  nom_entreprise?: string | null;
  localisation?: string | null;
};

export type PeriodeEspace = "aujourd_hui" | "semaine" | "semaine_derniere" | "mois" | "tout";

/** GET /commercial/espace/statistiques (Api\Commercial\EspaceController::statistiques()) — accueil. */
export type StatistiquesCommercial = {
  periode: { debut: string | null; fin: string | null };
  commandes_total: number;
  commandes_en_attente: number;
  commandes_validees: number;
  commandes_en_cours: number;
  commandes_livrees: number;
  commandes_annulees: number;
  commission_totale: number;
};

export type ProduitPlusVendu = {
  produit_id: number;
  nom_produit: string | null;
  photo: string | null;
  quantite_vendue: number;
  montant: number;
};

/**
 * GET /commercial/espace/statistiques-detail — écran "Statistiques" (Compte
 * > Statistique), même structure que StatistiquesFournisseur
 * (Ordi'Space_Fournisseur_App) adaptée : "commission_totale" au lieu de
 * "chiffre_affaires".
 */
export type StatistiquesDetailCommercial = {
  commission_totale: number;
  croissance_pourcentage: number | null;
  commandes_total: number;
  commandes_validees: number;
  commandes_livrees: number;
  commandes_annulees: number;
  produits_vendus: number;
  produits_distincts_vendus: number;
  produits_plus_vendus: ProduitPlusVendu[];
};

export type StatistiquesProduitActif = {
  recues: number;
  livrees: number;
  annulees: number;
  en_cours: number;
};

/**
 * Carte "Commandes" de l'accueil — GET /commercial/espace/produits-actifs
 * (Api\Commercial\EspaceController::produitsActifs()), produits vendus par
 * CE commercial regroupés avec un compteur par statut. Pas de fil de
 * discussion produit dans cette app (contrairement à Fournisseur/
 * Coordinateur) : pas de `nouvelles_activites`/`epingle` ici.
 */
export type ProduitActifCommercial = {
  produit_id: number;
  nom_produit: string;
  photo: string | null;
  statistiques: StatistiquesProduitActif;
  derniere_activite: string | null;
};

export type ImageProduit = {
  id: number;
  url_image: string;
  ordre_affichage: number;
};

export type Categorie = {
  id: number;
  nom_categorie: string;
  description: string | null;
};

/**
 * Onglet Catalogue — GET /produits (ProduitController::index()), même écran
 * que le Market'Space du client (Ordi’Space_App_Mobile), reproduit ici tel
 * quel. Pas de branche dédiée ROLE_COMMERCIAL côté backend : il tombe dans
 * le même "else" que le client, donc déjà filtré à statut_produit=valide
 * (produits publiés visibles) — aucun changement backend nécessaire.
 */
export type Produit = {
  id: number;
  nom_produit: string;
  description: string | null;
  prix: string;
  quantite_stock: number;
  categorie: Categorie;
  images: ImageProduit[];
};

/** "12 357" — même formatage que le Market'Space du client. */
export function formaterPrix(prix: string | number): string {
  const nombre = typeof prix === "string" ? parseFloat(prix) : prix;
  return new Intl.NumberFormat("fr-FR").format(nombre);
}

export type Localite = {
  id: number;
  nom: string;
  type: "commune_abidjan" | "ville";
};

/** POST /clients/extraction (ExtractionClientService) — paste-parse du texte collé. */
export type ExtractionTexte = {
  nom: string | null;
  telephone: string | null;
  ville: string | null;
};

/** Carte du sélecteur de produit (étape 1 de "Nouvelle commande") — GET /produits (déjà filtré aux produits publiés pour ce rôle). */
export type ProduitChoix = {
  id: number;
  nom_produit: string;
  prix: number;
  prix_vente: number | null;
  quantite_stock: number;
  images: { url_image: string }[];
};

export type Pagination<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

/**
 * GET /tutoriels (TutorielController) — contenus "Academy Space", même
 * source de données que le client (Ordi’Space_App_Mobile), reproduite à
 * l'identique côté Commercial ("Formation" du Compte) : lecture publique à
 * tout rôle connecté, aucune branche dédiée ROLE_COMMERCIAL ni nouveau champ.
 */
export type TypeTutoriel = "tutoriel_rapide" | "formation";

export type Tutoriel = {
  id: number;
  titre: string;
  type: TypeTutoriel;
  url_video: string | null;
  id_video_youtube: string | null;
  contenu: string | null;
  image_couverture: string | null;
  date_publication: string | null;
};

/** Aperçu vivant d'une commande (meta.apercu, Commande::versApercu()) — même forme sur toutes les apps. */
export type DonneesCommandeCreee = {
  nom_produit: string;
  photo: string | null;
  prix_produit: number;
  nom_client: string;
  telephone: string | null;
  zone_livraison: string | null;
  date_livraison_prevue: string | null;
  frais_livraison: number;
  remise: number;
  total: number;
  bonus_offerts: string | null;
  notes?: string | null;
};

export type DernierSuivi = {
  texte: string;
  acteur: string;
  date: string;
};

/**
 * Carte-commande du fil "Discussion produit" — produite par
 * MessageController::formaterCommandeCarte() (même forme sur toutes les
 * apps). `nouvelles_activites` compte les messages non lus de CETTE
 * commande précise (ConsultationCommande), distinct du badge produit de
 * l'accueil (StatistiquesProduitActif).
 */
export type CommandeCarte = {
  commande_id: number;
  photo: string | null;
  nom_produit: string;
  description: string | null;
  nom_client: string;
  zone_localite: string | null;
  telephone: string | null;
  derniere_action: string;
  statut: string;
  nouvelles_activites: number;
  dernier_suivi: DernierSuivi | null;
};

export type ItemFil =
  | { type: "message"; date: string; donnee: MessageConversation }
  | { type: "commande"; date: string; donnee: CommandeCarte };

/** = Produit::statistiquesCommandes() — en-tête de la discussion produit (toute la plateforme, pas juste moi). */
export type EnTeteConversation = {
  recues: number;
  livrees: number;
  annulees: number;
  en_cours: number;
};

/** GET /produits/{id}/conversation — fil fusionné messages + commandes (scopé commercial_id pour ce rôle, voir MessageController::conversationProduit()). */
export type ConversationProduit = {
  items: ItemFil[];
  en_tete: EnTeteConversation;
};

/**
 * GET /produits/{id} — forme complète, utilisée par la fiche produit
 * (EcranDetailProduit.tsx, "même écran que le Coordinateur" porté ici) ET
 * par l'en-tête de la discussion produit (qui ne consomme qu'un sous-
 * ensemble). `fournisseur.user.telephone` n'est de toute façon jamais
 * exposé à ce rôle côté backend (réservé Coordinateur/Admin, voir
 * ProduitController::show()), le bouton "Appeler" reste donc toujours
 * désactivé sans logique supplémentaire à écrire. Pas de
 * `negociation_a_lire`/`commission_apporteur`/`commission_ordispace` ici :
 * la rangée "Négociation de prix" et les cartes commissions de la version
 * Coordinateur sont volontairement retirées côté Commercial (décision
 * explicite — restent réservées Coordinateur/Fournisseur).
 */
export type ProduitDetail = {
  id: number;
  nom_produit: string;
  description: string | null;
  prix: number;
  prix_vente: number | null;
  etat_produit: string | null;
  prix_barre: number | null;
  pourcentage_reduction: number | null;
  quantite_stock: number;
  statut_produit: string;
  est_booste: boolean;
  date_ajout: string;
  categorie: Categorie | null;
  processeur: string | null;
  memoire_ram: string | null;
  stockage: string | null;
  taille: string | null;
  systeme_exploitation: string | null;
  carte_graphique: string | null;
  duree_garantie_mois: number | null;
  cadeaux: string[] | null;
  images_cadeaux: Record<string, string | null> | null;
  contenu_pack: string[] | null;
  images: { id: number; url_image: string }[];
  frais_livraison: { id: number; montant: string; localite: { id: number; nom: string } | null }[];
  fournisseur: { user?: { telephone: string | null } } | null;
};

/**
 * Carte de la liste "Mes commandes" — GET /commandes (CommandeController::
 * index(), déjà scopé commercial_id = moi côté backend). Forme brute du
 * modèle Commande (pas une sérialisation dédiée comme chez le Fournisseur) :
 * une seule ligne consommée ici (premier produit), une commande pouvant en
 * compter plusieurs en théorie.
 */
export type CommandeListe = {
  id: number;
  statut_commande: string;
  montant_total: string | number;
  date_commande: string;
  client: { user: { nom: string; prenom: string | null; telephone: string | null } } | null;
  lignes: { produit: { nom_produit: string; images: { url_image: string }[] } | null }[];
};

/**
 * Écran détail commande (Information/Suivi) — GET /commandes/{id}. On ne
 * consomme que le statut/la date ici, le reste vient de `meta.apercu`
 * (DonneesCommandeCreee), même convention que Fournisseur/Coordinateur.
 */
export type CommandeDetail = {
  id: number;
  statut_commande: string;
  date_commande: string;
};

export type MessageAuteur = {
  id: number;
  nom: string;
  prenom: string | null;
  type_utilisateur: string;
};

/**
 * "rapport"/"commande_creee" sont des types enrichis propres au fil PRODUIT
 * (MessageController::conversationProduit()) ; "proposition_prix" n'y
 * apparaît jamais (fil distinct, est_negociation_prix=true, explicitement
 * exclu côté backend) — jamais besoin de le gérer dans cette app. Dans le
 * fil d'une COMMANDE (EcranCommande.tsx), "commande_creee" est filtré avant
 * affichage (déjà couvert par l'aperçu + la timeline) et "rapport" n'y
 * apparaît jamais (généré uniquement sur le fil produit).
 */
export type TypeMessage = "texte" | "image" | "video" | "audio" | "note_vocale" | "document" | "commande_creee" | "rapport";

/** Rapport quotidien auto-généré (MessageController::genererRapportQuotidienSiNecessaire()) — toute la plateforme pour ce produit, pas scopé par commercial. */
export type DonneesRapport = {
  date: string;
  envoyees: number;
  validees: number;
  reportees: number;
  non_livre: number;
  annulees: number;
};

export type MessageConversation = {
  id: number;
  commande_id: number | null;
  auteur_id: number;
  auteur: MessageAuteur;
  type: TypeMessage;
  contenu: string | null;
  fichier: string | null;
  donnees: DonneesCommandeCreee | DonneesRapport | null;
  date_envoi: string;
};

export type SuiviDonnees = {
  statut_apres?: string;
};

/** GET /commandes/{id}/suivi — journal d'audit, timeline verticale. */
export type SuiviEntree = {
  id: number;
  action: string;
  details: string | null;
  date_heure: string;
  acteur: MessageAuteur | null;
  donnees: SuiviDonnees | null;
};

/** "12.357 F" — même formatage que les autres apps (regroupement en-US, séparateur remplacé par un point). */
export function formaterMontant(valeur: number): string {
  return `${Math.round(valeur).toLocaleString("en-US").replace(/,/g, ".")} F`;
}

/**
 * GET /reponses-rapides (ReponseRapideController) — bibliothèque "Réponse
 * rapide", contenu entièrement géré par l'Admin (`est_favori` mis en avant
 * par lui, pas un favori personnel) ; `nombre_copies` alimente l'onglet
 * "Plus utilisés" et s'incrémente via POST /reponses-rapides/{id}/copie
 * (appelé quand le commercial tape "Copier").
 */
export type ReponseRapide = {
  id: number;
  titre: string;
  contenu: string;
  est_favori: boolean;
  nombre_copies: number;
  created_at: string;
};

/**
 * GET /commercial/espace/portefeuille (Api\Commercial\EspaceController::
 * portefeuille()) — "Mes paiements". `solde` est toujours total (pas filtré
 * par période), `transactions` l'est. `type` "credit" = commande validée
 * (gain) ; "debit" = soit "Commande annulée" (reprise d'un gain déjà
 * crédité), soit "Retrait effectué" (vrai retrait Mobile Money validé par
 * l'Admin) — distingués par `libelle`, pas par `type`.
 */
export type TransactionPortefeuille = {
  id: number;
  type: "credit" | "debit";
  libelle: string;
  /** decimal:2 Laravel → sérialisé en chaîne malgré ce typage : toujours Number(...) avant toute arithmétique (ex. somme sur plusieurs transactions). */
  montant: number;
  client_nom: string | null;
  client_localite: string | null;
  date_transaction: string;
};

export type DonneesPortefeuille = {
  solde: number;
  /** Ce qui reste réellement demandable — solde moins les demandes de retrait déjà en attente. */
  disponible: number;
  retrait_minimum: number;
  transactions: TransactionPortefeuille[];
};

export type OperateurRetrait = "Orange" | "Wave" | "Mtn" | "Moov";
export type StatutRetrait = "en_attente" | "valide" | "refuse" | "annule";

/** POST/GET /commercial/espace/retraits — "Demander un retrait". */
export type DemandeRetrait = {
  id: number;
  montant: number;
  operateur: OperateurRetrait;
  telephone: string;
  statut: StatutRetrait;
  reference: string | null;
  remarque: string | null;
  created_at: string;
  traite_le: string | null;
};
