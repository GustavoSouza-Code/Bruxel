import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { mensagemDeErro } from "../../../api/cliente";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import "./entrar.css";

// vitrine do que a conta oferece, exibida abaixo do formulário (ainda não são links)
const ACCOUNT_FEATURES = [
  {
    id: "perfil",
    title: "Informações do perfil",
    description: "Dados pessoais e da conta",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
  {
    id: "enderecos",
    title: "Endereços",
    description: "Endereços cadastrados na sua conta",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    id: "compras",
    title: "Compras",
    description: "Suas compras antigas",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 2-1.55l1.65-7.45H5.12" />
      </svg>
    ),
  },
];

/**
 * Tela de login (rota "/entrar"): envia e-mail e senha pelo entrar() do
 * ContextoAutenticacao. Se der certo, leva pra Home (ou de volta pra página
 * que o RotaAdmin barrou); se der errado, mostra a mensagem da API acima do
 * botão.
 */
export function PaginaEntrar() {
  const { entrar } = useAutenticacao();
  const navigate = useNavigate();
  // recados que outras telas mandam pelo state do navigate: o aviso do /criar-conta
  // (mensagem) e a página que o RotaAdmin barrou (de)
  const recado = useLocation().state as { mensagem?: string; de?: string } | null;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  // mensagem de erro mostrada acima do botão; null = sem erro
  const [erro, setErro] = useState<string | null>(null);
  // true enquanto espera a API: desabilita o botão pra não enviar duas vezes
  const [enviando, setEnviando] = useState(false);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await entrar(email, senha);
      // admin e cliente vão pra Home; o admin chega no painel pelo menu do usuário
      const destino = recado?.de ?? "/";
      // replace: o "voltar" do navegador não traz de novo pra tela de login
      navigate(destino, { replace: true });
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-entrar">
        <Container className="pagina-entrar__interno">
          <h1 className="pagina-entrar__mensagem">
            Olá! Você precisa realizar o login para entrar no seu perfil
          </h1>

          <form className="pagina-entrar__formulario" onSubmit={enviar}>
            {/* aviso de "conta criada" vindo do /criar-conta; some se aparecer um erro */}
            {recado?.mensagem && !erro && (
              <p className="pagina-entrar__sucesso" role="status">
                {recado.mensagem}
              </p>
            )}
            <label>
              E-mail
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>
            <label>
              Senha
              <input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {erro && (
              <p className="pagina-entrar__erro" role="alert">
                {erro}
              </p>
            )}
            <button type="submit" className="pagina-entrar__enviar" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <Link to="/criar-conta" className="pagina-entrar__link-cadastro">
            Criar conta
          </Link>
        </Container>

        <Container>
          <div className="pagina-entrar__recursos">
            {ACCOUNT_FEATURES.map((feature) => (
              <div key={feature.id} className="pagina-entrar__recurso">
                <span className="pagina-entrar__icone-recurso">
                  {feature.icon}
                </span>
                <div className="pagina-entrar__texto-recurso">
                  <strong>{feature.title}</strong>
                  <span>{feature.description}</span>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <Rodape />
    </>
  );
}

export default PaginaEntrar;
