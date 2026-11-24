// Thème des écrans de connexion/inscription de cette app (kit
// d'authentification : CadreAuth, MascotteVivante, DecorAuth…). Chaque app a
// le sien : couleurs, décor animé, accessoire de la mascotte et répliques.

export type ThemeAuth = {
  espace: string;
  slogan: string;
  degrade: string;
  halos: [string, string, string];
  accent: string;
  accentFin: string;
  accentHalo: string;
  accentOmbre: string;
  decor: "constellation" | "etincelles" | "colis" | "route" | "etiquettes" | "engrenages" | "bulles" | "radar";
  posture: "flotte" | "roule";
  accessoire: "aucun" | "engrenage" | "logo" | "radar" | "etoile" | "coeur" | "colis" | "casque";
  logo?: string;
  confettis: string[];
  badge: string;
  repliques: {
    salut: string;
    repos: string;
    telephone: string;
    telephoneOk: string;
    email: string;
    emailOk: string;
    mdp: string;
    erreur: string;
    code: string;
    succes: string;
    nom: string;
  };
};

export const THEME_AUTH: ThemeAuth = {
  "espace": "Commercial",
  "slogan": "Vends, suis tes commandes et tes commissions en un clin d'œil.",
  "degrade": "linear-gradient(160deg,#3b1fd1 0%,#3b5bff 45%,#00a3ff 100%)",
  "halos": [
    "rgba(255,200,60,0.28)",
    "rgba(160,90,255,0.4)",
    "rgba(255,255,255,0.18)"
  ],
  "accent": "#3b5bff",
  "accentFin": "#00b4ff",
  "accentHalo": "rgba(59,91,255,0.16)",
  "accentOmbre": "rgba(59,91,255,0.4)",
  "decor": "etincelles",
  "posture": "flotte",
  "accessoire": "etoile",
  "confettis": [
    "#3b5bff",
    "#00b4ff",
    "#ffd23f",
    "#ffffff",
    "#a855f7"
  ],
  "badge": "Connexion sécurisée · code WhatsApp",
  "repliques": {
    "telephone": "Ton numéro WhatsApp 📱",
    "telephoneOk": "Parfait, je t'envoie le code 🚀",
    "email": "Ton adresse e-mail 📧",
    "emailOk": "Cet e-mail me va ✅",
    "mdp": "Je ne regarde pas 🙈",
    "code": "Regarde WhatsApp 💬",
    "salut": "Prêt à vendre ? 💼",
    "repos": "On fait du chiffre aujourd'hui ? 📈",
    "erreur": "Oups… on vérifie ça 😅",
    "succes": "Bonnes ventes ! 🎉",
    "nom": "Comment tu t'appelles ? ✍️"
  }
};
