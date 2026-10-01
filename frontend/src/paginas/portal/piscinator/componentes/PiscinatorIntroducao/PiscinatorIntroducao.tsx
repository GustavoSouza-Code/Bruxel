import { Container } from "../../../../../componentes/layout/Container/Container";
import "./PiscinatorIntroducao.css";

interface PiscinatorIntroducaoProps {
  /** chamada ao clicar em "Acessar piscinator" (a página passa pra etapa do quiz) */
  onComecar: () => void;
}

/** Etapa 1 do Piscinator: explica o que é a ferramenta e tem o botão que inicia o diagnóstico. */
export function PiscinatorIntroducao({ onComecar }: PiscinatorIntroducaoProps) {
  return (
    <section className="piscinator-introducao">
      <Container className="piscinator-introducao__interno">
        <nav className="piscinator-introducao__trilha" aria-label="breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>Piscinator</span>
        </nav>

        <h1 className="piscinator-introducao__titulo">
          Sua piscina mudou de cor, ficou turva, com espuma ou o cloro
          parece não funcionar?
        </h1>

        <div className="piscinator-introducao__divisor" />

        <p className="piscinator-introducao__texto">
          Com algumas perguntas rápidas, o Piscinator identifica possíveis
          causas do problema e recomenda os cuidados e produtos ideais para
          sua piscina.
        </p>

        <button className="piscinator-introducao__cta" onClick={onComecar}>
          Acessar piscinator
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </Container>
    </section>
  );
}

export default PiscinatorIntroducao;
