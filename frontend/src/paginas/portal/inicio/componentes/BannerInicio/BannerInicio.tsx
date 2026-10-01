import { useNavigate } from "react-router-dom";
import mascoteImg from "../../../../../assets/images/mascote/mascote-bruxel.png";
import { Container } from "../../../../../componentes/layout/Container/Container";
import "./BannerInicio.css";

/**
 * Seção de abertura da Home: mascote, título e um chamado pro Piscinator.
 * O fundo azul tem a base curva e ondas SVG decorativas (ver BannerInicio.css).
 */
export function BannerInicio() {
  const navigate = useNavigate();

  return (
    <section className="banner-inicio">
      {/* ondas decorativas: aria-hidden porque não têm significado pra leitor de tela;
          preserveAspectRatio="none" deixa o desenho esticar pra caber na largura */}
      <svg
        className="banner-inicio__ondas"
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          className="banner-inicio__onda banner-inicio__onda--fundo"
          d="M0,70 C240,120 480,20 720,55 C960,90 1200,130 1440,80 L1440,160 L0,160 Z"
        />
        <path
          className="banner-inicio__onda banner-inicio__onda--frente"
          d="M0,105 C280,70 520,140 780,110 C1040,80 1240,120 1440,100 L1440,160 L0,160 Z"
        />
      </svg>

      <Container className="banner-inicio__interno">
        <div className="banner-inicio__mascote">
          <img src={mascoteImg} alt="Mascote Bruxel Piscinas" />
        </div>

        <div className="banner-inicio__conteudo">
          <h1 className="banner-inicio__titulo">
            Ter uma piscina em casa deve ser{" "}
            <strong>sinônimo de lazer</strong> e não de dúvidas.
          </h1>

          {/* balão de destaque com o botão que leva ao Piscinator */}
          <div className="banner-inicio__chamada">
            <p>
              Mas quem já passou por água verde, produtos errados ou
              dinheiro desperdiçado sabe que manter a piscina em equilíbrio
              nem sempre é simples.
            </p>
            <button
              className="banner-inicio__cta"
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

export default BannerInicio;
