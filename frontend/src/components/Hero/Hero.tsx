import mascoteImg from "../../assets/images/mascote/mascote-bruxel.png";
import { Container } from "../Container/Container";
import "./Hero.css";

export function Hero() {
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
            <button className="hero__cta">
              Nosso Piscinator pode te ajudar
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Hero;
