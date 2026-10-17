import { Container } from "../../../../../componentes/layout/Container/Container";
import fachadaLoja from "../../../../../assets/images/sobre/fachada-loja.jpg";
import "./BannerSobre.css";

/**
 * Abertura da página Sobre (igual ao Figma): foto da fachada da loja ocupando
 * a parte de cima, com o selo "Sobre nós" e o cartão de texto sobrepostos
 * no canto inferior direito da foto.
 */
export function BannerSobre() {
  return (
    <section className="banner-sobre">
      <Container className="banner-sobre__interno">
        <img
          className="banner-sobre__foto"
          src={fachadaLoja}
          alt="Fachada da loja Bruxel Piscinas"
          width={896}
          height={384}
        />

        <div className="banner-sobre__cartao">
          <h1 className="banner-sobre__selo">Sobre nós</h1>
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
        </div>
      </Container>
    </section>
  );
}

export default BannerSobre;
