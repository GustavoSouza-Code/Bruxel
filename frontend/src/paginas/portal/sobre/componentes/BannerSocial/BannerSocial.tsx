import { Container } from "../../../../../componentes/layout/Container/Container";
import "./BannerSocial.css";

/** Post do Instagram exibido como card (por enquanto só a legenda). */
interface SocialPost {
  id: string;
  caption: string;
}

// legendas dos cards; todos levam ao perfil da Bruxel no Instagram (não a um post específico)
const SOCIAL_POSTS: SocialPost[] = [
  { id: "checkup", caption: "Sua piscina precisa de um check-up?" },
  { id: "cuidado", caption: "Sua piscina merece cuidado profissional!" },
  { id: "passo-a-passo", caption: "Passo a passo para manter sua piscina segura" },
  { id: "espaco", caption: "Venha conhecer o nosso espaço!" },
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
              {/* TODO: substituir por foto real do post quando o time de marketing enviar o asset */}
              <div className="banner-social__imagem" aria-hidden="true" />
              <span className="banner-social__legenda">
                {post.caption}
                <svg
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
