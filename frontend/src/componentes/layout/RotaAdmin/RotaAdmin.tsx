import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAutenticacao } from "../../../contexto/useAutenticacao";

/**
 * Protege as páginas do painel (/admin/*). No App.tsx ela é a rota "pai" das
 * páginas admin: se a pessoa pode entrar, a página filha aparece no <Outlet />;
 * senão, redireciona.
 *
 * Isso só esconde as telas. Quem protege os dados de verdade é o backend, que
 * confere o token e o perfil em cada requisição.
 */
export function RotaAdmin() {
  const { estaLogado, ehAdmin } = useAutenticacao();
  const { pathname } = useLocation();

  // sem login: vai pro /entrar lembrando de onde veio, pra voltar pra cá depois de logar
  if (!estaLogado) {
    return <Navigate to="/entrar" replace state={{ de: pathname }} />;
  }
  // logado como cliente: o painel não é pra ele
  if (!ehAdmin) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default RotaAdmin;
