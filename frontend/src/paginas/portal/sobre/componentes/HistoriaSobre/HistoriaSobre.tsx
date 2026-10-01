import { Container } from "../../../../../componentes/layout/Container/Container";
import "./HistoriaSobre.css";

/** Segunda parte da página Sobre: imagem (ainda placeholder) ao lado do texto sobre o compromisso da empresa. */
export function HistoriaSobre() {
  return (
    <section className="historia-sobre">
      <Container className="historia-sobre__interno">
        {/* TODO: substituir por foto real (equipe limpando piscina) quando o time de marketing enviar o asset */}
        <div className="historia-sobre__imagem" aria-hidden="true" />

        <p className="historia-sobre__texto">
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

export default HistoriaSobre;
