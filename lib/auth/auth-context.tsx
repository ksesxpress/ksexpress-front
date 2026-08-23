"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiLogin, apiLogout, apiLogoutAll, apiRefresh } from "@/lib/api/auth";
import { ApiError, type JwtPayload } from "@/lib/api/types";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./tokens";
import { decodeJwt, isExpired } from "./jwt";

interface AuthContextValue {
  user: JwtPayload | null;
  isLoading: boolean;
  login: (identifiant: string, motDePasse: string) => Promise<{ user: JwtPayload, succursales?: any[] }>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Au montage : relit un jeton déjà en localStorage (rechargement de page,
  // nouvel onglet) pour restaurer la session sans repasser par /auth/login.
  // Access encore valide → décodage direct. Access expiré mais refresh
  // valide → un rafraîchissement actif avant d'afficher quoi que ce soit,
  // pour ne jamais montrer une page protégée avec un rôle obsolète/faux.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const accessToken = getAccessToken();
      if (accessToken) {
        const payload = decodeJwt(accessToken);
        if (payload && !isExpired(payload)) {
          if (!cancelled) setUser(payload);
          if (!cancelled) setIsLoading(false);
          return;
        }
      }

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const tokens = await apiRefresh(refreshToken);
          setTokens(tokens);
          const payload = decodeJwt(tokens.accessToken);
          if (!cancelled) setUser(payload);
        } catch {
          clearTokens();
          if (!cancelled) setUser(null);
        }
      } else {
        if (!cancelled) setUser(null);
      }
      if (!cancelled) setIsLoading(false);
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (identifiant: string, motDePasse: string) => {
    const tokens = await apiLogin(identifiant, motDePasse);
    setTokens(tokens);
    const payload = decodeJwt(tokens.accessToken);
    if (!payload) {
      throw new ApiError(500, null, "Jeton reçu invalide.");
    }
    setUser(payload);
    return { user: payload, succursales: tokens.succursales };
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await apiLogout(refreshToken);
    } catch {
      // La déconnexion locale doit réussir même si l'appel réseau échoue.
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await apiLogoutAll();
    } catch {
      // idem : nettoyage local garanti quoi qu'il arrive.
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, logoutAll }),
    [user, isLoading, login, logout, logoutAll],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>.");
  return ctx;
}

// Route de destination après connexion, selon le rôle — même login pour
// tout le monde, redirection RBAC (voir AGENTS.md / décision utilisateur).
// `activite` = celle de la succursale choisie (dialog LoginForm) ou de
// l'unique succursale de l'utilisateur : une succursale BOUTIQUE pure
// atterrit directement sur le POS ; MIXTE reste sur le dashboard shipping
// (le POS y reste accessible via la sidebar, "KS Steel Glow").
export function landingPathForRole(user: JwtPayload, activite?: string): string {
  if (user.isSuperAdmin) {
    return "/staff";
  }
  if (user.isStaff && activite === "BOUTIQUE") {
    return "/staff/pos";
  }
  return user.isStaff ? "/staff" : "/portal";
}
