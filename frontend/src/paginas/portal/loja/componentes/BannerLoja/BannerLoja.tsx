import { Container } from "../../../../../componentes/layout/Container/Container";
import "./BannerLoja.css";

interface BannerLojaProps {
  /** texto atual da busca (o estado mora na PaginaLoja) */
  termoBusca: string;
  /** chamada a cada tecla digitada, com o novo texto */
  onMudarBusca: (value: string) => void;
}

/**
 * Faixa azul do topo da Loja: título e campo de busca. É um componente
 * controlado — o valor do input vem da PaginaLoja, que também filtra os produtos.
 */
export function BannerLoja({ termoBusca, onMudarBusca }: BannerLojaProps) {
  return (
    <section className="banner-loja">
      <Container className="banner-loja__interno">
        <h1 className="banner-loja__titulo">
          Bruxel <strong>Piscinas</strong>
        </h1>

        <label className="banner-loja__busca">
          <input
            type="search"
            placeholder="Pesquisar produtos"
            value={termoBusca}
            onChange={(event) => onMudarBusca(event.target.value)}
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </label>
      </Container>
    </section>
  );
}

export default BannerLoja;
