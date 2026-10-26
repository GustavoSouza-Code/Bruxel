import { Link } from "react-router-dom";
import { NavAdmin } from "../../../componentes/layout/NavAdmin/NavAdmin";
import { Container } from "../../../componentes/layout/Container/Container";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { useAtendimentos } from "../../../crud/atendimentos/useAtendimentos";
import { contarPorStatus } from "../../../crud/atendimentos/filtrarAtendimentos";
import "./inicio.css";

// áreas do painel; pra uma funcionalidade nova aparecer aqui, é só adicionar um item
const AREAS_ADMIN = [
  {
    id: "produtos",
    titulo: "Gestão de produtos",
    descricao: "Cadastrar, editar e excluir produtos",
    rota: "/admin/produtos",
    icone: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
        <path d="m3 8 9 5 9-5" />
        <path d="M12 13v8" />
      </svg>
    ),
  },
  {
    id: "clientes",
    titulo: "Gestão de clientes",
    descricao: "Ver e editar as contas cadastradas",
    rota: "/admin/usuarios",
    icone: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21a7 7 0 0 1 14 0" />
        <path d="M16 3.5a4 4 0 0 1 0 9" />
        <path d="M22 21a7 7 0 0 0-4-6.3" />
      </svg>
    ),
  },
  {
    id: "atendimentos",
    titulo: "Atendimentos",
    descricao: "Pedidos e ordens de serviço",
    rota: "/admin/atendimentos",
    icone: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    ),
  },
  {
    id: "atendimento",
    titulo: "Abrir atendimento",
    descricao: "Para um cliente que está na loja",
    rota: "/solicitar-atendimento",
    icone: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5" />
      </svg>
    ),
  },
];

/**
 * Tela inicial do painel admin (rota "/admin"): saúda o admin e mostra as
 * áreas de gestão como atalhos. No desktop viram uma grade de cartões; no
 * celular, uma lista de linhas (o HTML é o mesmo, só o CSS muda).
 */
export function PaginaAdminInicio() {
  const { usuario } = useAutenticacao();
  // o card de atendimentos avisa quantos pedidos esperam confirmação; enquanto
  // carrega (ou se a busca falhar) a lista fica vazia e o card mostra a descrição
  const { atendimentos } = useAtendimentos();
  const aguardando = contarPorStatus(atendimentos).aguardando;

  return (
    <>
      <NavAdmin />

      <section className="pagina-admin-inicio">
        <Container>
          {/* só o primeiro nome, igual ao MenuUsuario */}
          <h1 className="pagina-admin-inicio__titulo">Olá, {usuario?.nome.split(" ")[0]}</h1>
          <p className="pagina-admin-inicio__subtitulo">O que você quer gerenciar hoje?</p>

          <div className="pagina-admin-inicio__areas">
            {AREAS_ADMIN.map((area) => (
              <Link key={area.id} to={area.rota} className="pagina-admin-inicio__area">
                <span className="pagina-admin-inicio__icone">{area.icone}</span>
                <span className="pagina-admin-inicio__texto">
                  <strong>{area.titulo}</strong>
                  <span>
                    {area.id === "atendimentos" && aguardando > 0
                      ? `${aguardando} aguardando confirmação`
                      : area.descricao}
                  </span>
                </span>
                {/* "Acessar →" aparece no desktop; a seta ">" no celular (ver inicio.css) */}
                <span className="pagina-admin-inicio__acessar">Acessar →</span>
                <svg className="pagina-admin-inicio__seta" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            ))}

            {/* lugar reservado pras próximas funcionalidades; não é link */}
            <div className="pagina-admin-inicio__area pagina-admin-inicio__area--em-breve">
              <span className="pagina-admin-inicio__icone">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </span>
              <span className="pagina-admin-inicio__texto">
                <strong>Em breve</strong>
                <span>Novas funcionalidades do painel</span>
              </span>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

export default PaginaAdminInicio;
