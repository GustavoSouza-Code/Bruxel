import { Container } from "../Container/Container";
import "./StoreHero.css";

interface StoreHeroProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function StoreHero({ searchTerm, onSearchChange }: StoreHeroProps) {
  return (
    <section className="store-hero">
      <Container className="store-hero__inner">
        <h1 className="store-hero__title">
          Bruxel <strong>Piscinas</strong>
        </h1>

        <label className="store-hero__search">
          <input
            type="search"
            placeholder="Pesquisar produtos"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
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

export default StoreHero;
