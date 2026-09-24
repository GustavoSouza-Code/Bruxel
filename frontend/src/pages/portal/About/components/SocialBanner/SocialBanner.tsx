import { Container } from "../../../../../components/layout/Container/Container";
import "./SocialBanner.css";

interface SocialPost {
  id: string;
  caption: string;
}

const SOCIAL_POSTS: SocialPost[] = [
  { id: "checkup", caption: "Sua piscina precisa de um check-up?" },
  { id: "cuidado", caption: "Sua piscina merece cuidado profissional!" },
  { id: "passo-a-passo", caption: "Passo a passo para manter sua piscina segura" },
  { id: "espaco", caption: "Venha conhecer o nosso espaço!" },
];

export function SocialBanner() {
  return (
    <section className="social-banner">
      <Container>
        <h2 className="social-banner__title">
          Acompanhe a gente nas redes sociais:
        </h2>

        <div className="social-banner__grid">
          {SOCIAL_POSTS.map((post) => (
            <a
              key={post.id}
              href="https://instagram.com/bruxelpiscinas"
              target="_blank"
              rel="noreferrer"
              className="social-banner__card"
            >
              {/* TODO: substituir por foto real do post quando o time de marketing enviar o asset */}
              <div className="social-banner__image" aria-hidden="true" />
              <span className="social-banner__caption">
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

export default SocialBanner;
