import { useNavigate } from "react-router-dom";
import mascoteImg from "../../../../../assets/images/mascote/mascote-bruxel.png";
import { Container } from "../../../../../components/layout/Container/Container";
import "./Hero.css";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <svg
        className="hero__waves"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="hero__wave hero__wave--back"
          d="M0,70 C240,120 480,20 720,55 C960,90 1200,130 1440,80 L1440,160 L0,160 Z"
        />
        <path
          className="hero__wave hero__wave--front"
          d="M0,105 C280,70 520,140 780,110 C1040,80 1240,120 1440,100 L1440,160 L0,160 Z"
        />
      </svg>

      <Container className="hero__inner">
        <div className="hero__mascot">
          <img src={mascoteImg} alt="Mascote Bruxel Piscinas" />
        </div>

        <div className="hero__content">
          <h1 className="hero__title">
            Ter uma piscina em casa deve ser{" "}
            <strong>sinônimo de lazer</strong> e não de dúvidas.
          </h1>

          <div className="hero__callout">
            <p>
              Mas quem já passou por água verde, produtos errados ou
              dinheiro desperdiçado sabe que manter a piscina em equilíbrio
              nem sempre é simples.
            </p>
            <button
              className="hero__cta"
              onClick={() => navigate("/piscinator")}
            >
              Nosso Piscinator pode te ajudar
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Hero;
