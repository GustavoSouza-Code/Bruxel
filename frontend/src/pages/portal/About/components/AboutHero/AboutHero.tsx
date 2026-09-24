import { Container } from "../../../../../components/layout/Container/Container";
import "./AboutHero.css";

export function AboutHero() {
  return (
    <section className="about-hero">
      {/* TODO: substituir por foto real da fachada/loja quando o time de marketing enviar o asset */}
      <div className="about-hero__image" aria-hidden="true" />
      <div className="about-hero__overlay" />

      <Container className="about-hero__content">
        <span className="about-hero__badge">Sobre nós</span>
        <p className="about-hero__text">
          Com uma trajetória construída na prática e no contato direto com
          os clientes, a Bruxel Piscinas nasceu da paixão pelo cuidado e
          pela manutenção de piscinas. Desde 2015, atuamos diariamente no
          setor, adquirindo experiência real na resolução de problemas, no
          tratamento da água e na conservação de piscinas dos mais
          variados portes. Essa vivência nos permitiu desenvolver um
          conhecimento técnico sólido, baseado não apenas em teoria, mas
          principalmente na prática e nos desafios enfrentados ao longo
          dos anos.
        </p>
      </Container>
    </section>
  );
}

export default AboutHero;
