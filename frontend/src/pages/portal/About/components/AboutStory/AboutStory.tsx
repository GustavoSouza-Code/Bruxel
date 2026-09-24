import { Container } from "../../../../../components/layout/Container/Container";
import "./AboutStory.css";

export function AboutStory() {
  return (
    <section className="about-story">
      <Container className="about-story__inner">
        {/* TODO: substituir por foto real (equipe limpando piscina) quando o time de marketing enviar o asset */}
        <div className="about-story__image" aria-hidden="true" />

        <p className="about-story__text">
          Mais do que cuidar de piscinas, nosso compromisso é garantir uma
          piscina sempre limpa, segura e pronta para os melhores momentos
          de lazer. Trabalhamos com responsabilidade, dedicação e cuidado,
          oferecendo produtos e soluções que proporcionam praticidade e
          qualidade para você e sua piscina — mais do que cuidar de
          piscinas, nossa missão é garantir sua experiência e o bem-estar
          de quem deseja aproveitar cada momento ao máximo.
        </p>
      </Container>
    </section>
  );
}

export default AboutStory;
