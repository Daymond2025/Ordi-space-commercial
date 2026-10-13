"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api";

export type Utilisateur = {
  id: number;
  nom: string;
  prenom: string | null;
  email: string;
  type_utilisateur: string;
  roles: string[];
  permissions: string[];
};

type SessionResult = { user: Utilisateur; token: string };

/**
 * Auto-inscription du Commercial humain — aucun champ "métier" en plus des
 * champs d'identité habituels (contrairement au Fournisseur, qui doit
 * donner un nom d'entreprise, ou au Livreur, qui doit fournir des
 * documents) : voir RegisterRequest côté backend, aucune règle required_if
 * pour type_utilisateur=commercial.
 */
export type DonneesInscription = {
  nom: string;
  prenom?: string;
  email: string;
  telephone?: string;
  password: string;
  password_confirmation: string;
};

type AuthContextValue = {
  user: Utilisateur | null;
  token: string | null;
  pret: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (donnees: DonneesInscription) => Promise<void>;
  logout: () => Promise<void>;
};

const STOCKAGE_CLE = "ordispace.commercial.session";
const NOM_APPAREIL = "commercial-web";
const ROLES_AUTORISES = ["commercial"];

const AuthContext = createContext<AuthContextValue | null>(null);

function accesRefuseSiRoleInvalide(user: Utilisateur) {
  if (!ROLES_AUTORISES.includes(user.type_utilisateur)) {
    throw new ApiRequestError(
      { code: "ACCES_REFUSE", message: "Ce compte n'a pas accès à l'espace Commercial." },
      403
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pret, setPret] = useState(false);

  // Lecture localStorage nécessairement différée à after-mount (useEffect) :
  // le rendu serveur n'a pas accès à localStorage, donc le premier rendu
  // client doit rester identique à celui du serveur (session absente) pour
  // éviter une erreur d'hydratation — le flag `pret` distingue "pas encore
  // vérifié" de "vérifié, pas de session". Même pattern que les autres apps
  // (déjà présent, non corrigé, dans leur propre AuthContext.tsx) : exactement
  // le cas que react-hooks/set-state-in-effect signale à tort comme évitable
  // — il n'y a ici ni store externe à souscrire ni prop à synchroniser,
  // seulement une restauration ponctuelle au montage.
  useEffect(() => {
    const brut = localStorage.getItem(STOCKAGE_CLE);
    if (brut) {
      try {
        const session = JSON.parse(brut) as SessionResult;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration ponctuelle au montage, pas une synchronisation continue.
        setUser(session.user);
        setToken(session.token);
      } catch {
        localStorage.removeItem(STOCKAGE_CLE);
      }
    }
    setPret(true);
  }, []);

  function memoriser(session: SessionResult) {
    setUser(session.user);
    setToken(session.token);
    localStorage.setItem(STOCKAGE_CLE, JSON.stringify(session));
  }

  /**
   * Le Commercial n'a pas de 2FA (roles_2fa_obligatoire() ne liste que
   * Coordinateur/Admin côté backend) — /auth/login renvoie donc toujours
   * directement {user, token}, jamais {requires_2fa}.
   */
  async function login(email: string, password: string) {
    const reponse = await apiFetch<SessionResult>("/auth/login", {
      method: "POST",
      body: { email, password, device_name: NOM_APPAREIL, type_utilisateur: "commercial" },
    });

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  /**
   * Auto-inscription (POST /auth/register) — voir roles_auto_inscription()
   * côté backend : le Commercial (comme le Fournisseur et le Livreur,
   * contrairement au Coordinateur, provisionné par un Administrateur) crée
   * lui-même son compte. type_utilisateur est fixé côté client, pas un choix
   * laissé à l'utilisateur de cette app.
   */
  async function register(donnees: DonneesInscription) {
    const reponse = await apiFetch<SessionResult>("/auth/register", {
      method: "POST",
      body: {
        nom: donnees.nom,
        prenom: donnees.prenom || undefined,
        email: donnees.email,
        telephone: donnees.telephone || undefined,
        password: donnees.password,
        password_confirmation: donnees.password_confirmation,
        type_utilisateur: "commercial",
      },
    });

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  async function logout() {
    if (token) {
      await apiFetch("/auth/logout", { method: "POST", token }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(STOCKAGE_CLE);
  }

  return (
    <AuthContext.Provider value={{ user, token, pret, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé sous <AuthProvider>.");
  return context;
}
