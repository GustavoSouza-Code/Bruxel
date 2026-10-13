import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
// a pílula usa a classe .cabecalho__botao-entrar; o NavAdmin não renderiza o Cabecalho, então importa aqui
import "../Cabecalho/Cabecalho.css";
import "./MenuUsuario.css";

/**
 * Botão do usuário logado no Cabecalho (no lugar do "Entrar") e no NavAdmin: mostra o
 * primeiro nome e, ao clicar, abre um menu com Minha conta, Painel de gestão
 * (só admin) e Sair.
 *
 * O menu fecha ao clicar fora, com Esc ou ao escolher um item. Trocar de
 * página também fecha, porque cada página renderiza o próprio Cabecalho e o
 * menu nasce fechado de novo.
 */
export function MenuUsuario() {
  const { usuario, ehAdmin, sair } = useAutenticacao();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  // envolve o botão e o menu: clique dentro dele não conta como "clique fora"
  const raizRef = useRef<HTMLDivElement>(null);

  // enquanto o menu está aberto, escuta cliques e teclas na página toda pra saber quando fechar
  useEffect(() => {
    if (!aberto) return;

    function aoClicar(evento: MouseEvent) {
      if (!raizRef.current?.contains(evento.target as Node)) setAberto(false);
    }
    function aoApertarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoApertarTecla);
    // limpeza: tira os listeners quando o menu fecha (ou o componente sai da tela)
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoApertarTecla);
    };
  }, [aberto]);

  if (!usuario) return null;

  function handleSair() {
    setAberto(false);
    sair();
    navigate("/");
  }

  return (
    <div className="menu-usuario" ref={raizRef}>
      {/* mesmo visual do botão "Entrar" (classe do Cabecalho.css) */}
      <button
        type="button"
        className="cabecalho__botao-entrar menu-usuario__botao"
        aria-expanded={aberto}
        aria-controls="menu-usuario-opcoes"
        onClick={() => setAberto((atual) => !atual)}
      >
        <svg className="cabecalho__icone-entrar" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
        {/* só o primeiro nome, pra caber no header */}
        {usuario.nome.split(" ")[0]}
        <svg
          className={`menu-usuario__seta${aberto ? " menu-usuario__seta--aberta" : ""}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {aberto && (
        <div id="menu-usuario-opcoes" className="menu-usuario__menu">
          <div className="menu-usuario__topo">
            <strong>{usuario.nome}</strong>
            <span>{usuario.email}</span>
          </div>
          <Link to="/perfil" className="menu-usuario__item" onClick={() => setAberto(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 0 0-16 0" />
            </svg>
            Minha conta
          </Link>
          {ehAdmin && (
            <Link to="/admin" className="menu-usuario__item" onClick={() => setAberto(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Painel de gestão
            </Link>
          )}
          <hr className="menu-usuario__divisor" />
          <button type="button" className="menu-usuario__item menu-usuario__item--sair" onClick={handleSair}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

export default MenuUsuario;
