import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService } from "../services/authService";

const STORAGE_KEY = "bruxel:auth";

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  /**
   * O backend não devolve o perfil no corpo do login (só id/email/nome) —
   * mas ele vai dentro do próprio token JWT, então decodificamos o token
   * pra saber se é ADMINISTRADOR (ver decodeTokenPerfil abaixo).
   */
  perfil: "CLIENTE" | "ADMINISTRADOR";
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Lê o campo "perfil" de dentro do payload do JWT, sem precisar de
 * biblioteca extra — um token é só três partes em base64url separadas por
 * ponto; a do meio é o payload (ver authService.ts no backend, que assina
 * { id, email, perfil }).
 */
function decodeTokenPerfil(token: string): "CLIENTE" | "ADMINISTRADOR" {
  try {
    const payloadBase64Url = token.split(".")[1];
    const payloadBase64 = payloadBase64Url
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadBase64));
    return payload.perfil === "ADMINISTRADOR" ? "ADMINISTRADOR" : "CLIENTE";
  } catch {
    return "CLIENTE";
  }
}

interface StoredAuth {
  token: string;
  user: AuthUser;
}

/**
 * Guarda a sessão (token + usuário logado) e expõe login/logout pro app
 * inteiro. Persiste em localStorage pra sobreviver a um F5; qualquer tela
 * que precise saber "quem está logado" ou "é admin?" usa o useAuth().
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // na primeira carga, recupera a sessão salva (se tiver)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed: StoredAuth = JSON.parse(saved);
      setToken(parsed.token);
      setUser(parsed.user);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  async function login(email: string, senha: string) {
    const response = await authService.login({ email, senha });
    const authUser: AuthUser = {
      ...response.user,
      perfil: decodeTokenPerfil(response.token),
    };

    setToken(response.token);
    setUser(authUser);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ token: response.token, user: authUser })
    );
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value: AuthContextValue = {
    token,
    user,
    isAuthenticated: token !== null,
    isAdmin: user?.perfil === "ADMINISTRADOR",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider");
  }
  return context;
}
