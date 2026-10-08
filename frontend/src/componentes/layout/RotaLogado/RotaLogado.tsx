import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAutenticacao } from "../../../contexto/useAutenticacao";

/**
 * Protege as páginas que exigem login (ex.: /perfil), de qualquer perfil. No
 * App.tsx ela é a rota "pai": logado, a página filha aparece no <Outlet />;
 * senão, vai pro /entrar.
 *
 * Igual ao RotaAdmin, só esconde as telas: quem protege os dados é o backend.
 */
export function RotaLogado() {
  const { estaLogado } = useAutenticacao();
  const { pathname } = useLocation();

  // lembra de onde veio, pra voltar pra cá depois de logar
  if (!estaLogado) {
    return <Navigate to="/entrar" replace state={{ de: pathname }} />;
  }
  return <Outlet />;
}

export default RotaLogado;
