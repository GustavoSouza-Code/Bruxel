import { useNavigate } from "react-router-dom";
import mascoteImg from "../../../../../assets/images/mascote/mascote-bruxel.png";
import { Container } from "../../../../../components/layout/Container/Container";
import "./Hero.css";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
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
