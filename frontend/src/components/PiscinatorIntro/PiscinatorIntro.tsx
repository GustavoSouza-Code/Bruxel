import { Container } from "../Container/Container";
import "./PiscinatorIntro.css";

interface PiscinatorIntroProps {
  onStart: () => void;
}

export function PiscinatorIntro({ onStart }: PiscinatorIntroProps) {
  return (
    <section className="piscinator-intro">
      <Container className="piscinator-intro__inner">
        <nav className="piscinator-intro__breadcrumb" aria-label="breadcrumb">
          <span>Home</span>
          <span>›</span>
          <span>Piscinator</span>
        </nav>

        <h1 className="piscinator-intro__title">
          Sua piscina mudou de cor, ficou turva, com espuma ou o cloro
          parece não funcionar?
        </h1>

        <div className="piscinator-intro__divider" />

        <p className="piscinator-intro__text">
          Com algumas perguntas rápidas, o Piscinator identifica possíveis
          causas do problema e recomenda os cuidados e produtos ideais para
          sua piscina.
        </p>

        <button className="piscinator-intro__cta" onClick={onStart}>
          Acessar piscinator
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </Container>
    </section>
  );
}

export default PiscinatorIntro;
