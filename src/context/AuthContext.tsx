"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, ApiRequestError, EVENEMENT_SESSION_EXPIREE } from "@/lib/api";

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

type DemandeOtpResultat = { compteExistant: boolean; userId?: number; codeDebug?: string };

type AuthContextValue = {
  user: Utilisateur | null;
  token: string | null;
  pret: boolean;
  /** @deprecated Conservé pour les comptes déjà créés par e-mail/mot de passe — voir /connexion/email. */
  login: (email: string, password: string) => Promise<void>;
  demanderOtp: (telephone: string) => Promise<DemandeOtpResultat>;
  verifierOtpInscription: (userId: number, code: string) => Promise<void>;
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

  // Session fermée côté serveur (déconnexion par l'Admin, compte suspendu…) :
  // on oublie la session locale, RouteGuard renvoie vers /connexion.
  useEffect(() => {
    function oublierSession() {
      setUser(null);
      setToken(null);
      localStorage.removeItem(STOCKAGE_CLE);
    }

    window.addEventListener(EVENEMENT_SESSION_EXPIREE, oublierSession);
    return () => window.removeEventListener(EVENEMENT_SESSION_EXPIREE, oublierSession);
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
   * Étape 1 de la connexion par téléphone — voir Api\Auth\TelephoneAuthController::demanderOtp().
   * Pas d'inscription : le compte du Commercial est créé par l'Admin avec son
   * numéro (entité interne d'Ordi'Space).
   */
  async function demanderOtp(telephone: string): Promise<DemandeOtpResultat> {
    const reponse = await apiFetch<{ compte_existant: boolean; user_id?: number; code_debug?: string }>(
      "/auth/telephone/otp",
      { method: "POST", body: { telephone, type_utilisateur: "commercial" } }
    );

    return { compteExistant: reponse.compte_existant, userId: reponse.user_id, codeDebug: reponse.code_debug };
  }

  /** Dernière étape — code reçu par WhatsApp. */
  async function verifierOtpInscription(userId: number, code: string) {
    const reponse = await apiFetch<SessionResult>("/auth/verify-otp", {
      method: "POST",
      body: { user_id: userId, code, device_name: NOM_APPAREIL },
    });

    accesRefuseSiRoleInvalide(reponse.user);
    memoriser(reponse);
  }

  return (
    <AuthContext.Provider value={{ user, token, pret, login, demanderOtp, verifierOtpInscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé sous <AuthProvider>.");
  return context;
}
