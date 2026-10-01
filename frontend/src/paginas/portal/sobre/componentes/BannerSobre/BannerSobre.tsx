import { Container } from "../../../../../componentes/layout/Container/Container";
import "./BannerSobre.css";

/** Faixa de abertura da página Sobre: fundo em degradê (no lugar da foto) e o texto institucional. */
export function BannerSobre() {
  return (
    <section className="banner-sobre">
      {/* TODO: substituir por foto real da fachada/loja quando o time de marketing enviar o asset */}
      <div className="banner-sobre__imagem" aria-hidden="true" />
      {/* película escura por cima da imagem, pra o texto branco ficar legível */}
      <div className="banner-sobre__sobreposicao" />

      <Container className="banner-sobre__conteudo">
        <span className="banner-sobre__selo">Sobre nós</span>
        <p className="banner-sobre__texto">
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

export default BannerSobre;
