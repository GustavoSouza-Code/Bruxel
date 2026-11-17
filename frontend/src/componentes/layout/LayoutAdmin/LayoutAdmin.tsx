import { useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavAdmin } from "../NavAdmin/NavAdmin";
import { LateralAdmin } from "../LateralAdmin/LateralAdmin";
import "./LayoutAdmin.css";

/**
 * Esqueleto de todas as páginas /admin/*: a NavAdmin em cima, a lista lateral
 * à esquerda e a página atual no <Outlet />. Fica no App.tsx como rota "pai"
 * das páginas admin (dentro do RotaAdmin), então a barra e a lateral não são
 * recriadas a cada navegação; só o conteúdo troca.
 */
export function LayoutAdmin() {
  const { pathname } = useLocation();
  // guarda em qual página a gaveta do celular foi aberta: trocar de página já a fecha sozinho
  const [abertoEm, setAbertoEm] = useState<string | null>(null);
  const menuAberto = abertoEm === pathname;
  const fecharMenu = useCallback(() => setAbertoEm(null), []);

  return (
    <div className="layout-admin">
      <div className="layout-admin__topo">
        <NavAdmin menuAberto={menuAberto} aoAbrirMenu={() => setAbertoEm(pathname)} />
      </div>
      <div className="layout-admin__corpo">
        <LateralAdmin aberta={menuAberto} aoFechar={fecharMenu} />
        <div className="layout-admin__conteudo">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default LayoutAdmin;
