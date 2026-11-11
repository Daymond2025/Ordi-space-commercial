# OrdiSpace — Espace Commercial

Application web mobile (Next.js) des commerciaux OrdiSpace : ils présentent le catalogue, enregistrent les ventes de leurs clients, suivent leurs commandes et leurs commissions.

Elle consomme l'API du dépôt [`Ordi-Space_backend`](https://github.com/Daymond2025/Ordi-Space_backend) (Laravel) via des jetons Bearer (Sanctum).

## Stack technique

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS 4
- Authentification : téléphone + code OTP reçu par WhatsApp (inscription possible depuis l'app) ; connexion e-mail + mot de passe conservée pour les anciens comptes (rôle `commercial`)
- Application installable (PWA, service worker)

## Fonctionnalités principales

- **Space** — accueil et statistiques du commercial.
- **Catalogue** — produits, fiche détaillée, partage.
- **Nouvelle commande** — enregistrement d'une vente pour un client (création rapide du client si besoin).
- **Commandes** — suivi, détail (Suivie / Information) et discussion de commande.
- **Paiement** — portefeuille et commissions.
- **Réponses rapides** et **Formation** — bibliothèque de réponses fournie par l'administration, tutoriels.

## Structure du projet

```text
src/
├── app/
│   ├── connexion/ (email/, verification/), inscription/, mot-de-passe-oublie/
│   ├── (shell)/               # Pages avec la barre de navigation : catalogue/, commandes/, paiement/, compte/, produit/[id]
│   ├── commande/[id]/         # Détail d'une commande
│   ├── produit/[id]/detail/
│   ├── formation/, reponse-rapide/, statistiques/
├── components/                # auth/, commande/, discussion/, paiement/, produit/, space/, icônes
├── context/                   # AuthContext
└── lib/                       # api.ts, types.ts, statuts.ts, partage.ts, temps.ts
```

## Démarrage

Prérequis : Node.js 20+, et l'API backend lancée.

```bash
npm install
cp .env.example .env.local   # renseigner NEXT_PUBLIC_API_URL
npm run dev                  # http://localhost:3000
```

Pour lancer plusieurs applications OrdiSpace en même temps, choisir un autre port (`npm run dev -- -p 3003`) et l'ajouter à `CORS_ALLOWED_ORIGINS` dans le `.env` du backend. En local, sans WhatsApp configuré, le code OTP est renvoyé par l'API (`code_debug`).

### Variables d'environnement

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL de base de l'API (ex. `http://127.0.0.1:8000/api/v1` en local, `https://ordisapce.daymondboutique.com/api/v1` en production) |

Aucune clé secrète ne doit se trouver dans cette app.

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | ESLint |

## Déploiement

Configurer `NEXT_PUBLIC_API_URL` sur l'hébergeur et ajouter le domaine de l'app à `CORS_ALLOWED_ORIGINS` côté backend.
