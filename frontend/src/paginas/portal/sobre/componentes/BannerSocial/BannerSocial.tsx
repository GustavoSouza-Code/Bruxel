import { Container } from "../../../../../componentes/layout/Container/Container";
import fotoCheckup from "../../../../../assets/images/sobre/post-checkup.jpg";
import fotoCuidado from "../../../../../assets/images/sobre/post-cuidado.jpg";
import fotoPassoAPasso from "../../../../../assets/images/sobre/post-passo-a-passo.jpg";
import fotoEspaco from "../../../../../assets/images/sobre/post-espaco.jpg";
import "./BannerSocial.css";

/** Post do Instagram exibido como card: a arte do post e a legenda (esta só para leitores de tela). */
interface SocialPost {
  id: string;
  caption: string;
  imagem: string;
}

// legendas dos cards; todos levam ao perfil da Bruxel no Instagram (não a um post específico)
const SOCIAL_POSTS: SocialPost[] = [
  { id: "checkup", imagem: fotoCheckup, caption: "Sua piscina precisa de um check-up?" },
  { id: "cuidado", imagem: fotoCuidado, caption: "Sua piscina merece cuidado profissional!" },
  { id: "passo-a-passo", imagem: fotoPassoAPasso, caption: "Passo a passo para manter sua piscina segura" },
  { id: "espaco", imagem: fotoEspaco, caption: "Venha conhecer o nosso espaço!" },
];

/** Faixa azul "Acompanhe a gente nas redes sociais": 4 cards que levam ao Instagram da Bruxel. */
export function BannerSocial() {
  return (
    <section className="banner-social">
      <Container>
        <h2 className="banner-social__titulo">
          Acompanhe a gente nas redes sociais:
        </h2>

        <div className="banner-social__grade">
          {SOCIAL_POSTS.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com/bruxelpiscinas"
              target="_blank"
              rel="noreferrer"
              className="banner-social__card"
            >
              {/* a arte do post já traz o texto; a legenda fica só pra leitores de tela */}
              <img className="banner-social__imagem" src={post.imagem} alt="" width={720} height={900} loading="lazy" />
              <span className="banner-social__legenda">
                <span className="banner-social__legenda-texto">{post.caption}</span>
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default BannerSocial;
