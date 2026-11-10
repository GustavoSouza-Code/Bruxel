import { Container } from "../../../../../componentes/layout/Container/Container";
import "./Depoimentos.css";

/** Depoimento de cliente exibido na Home. */
interface Testimonial {
  id: string;
  name: string;
  comment: string;
  timeAgo: string;
  /** nota de 1 a 5, mostrada em estrelas */
  rating: number;
}

// depoimentos escritos direto no código, não vêm de API (notas de 4 a 5)
const TESTIMONIALS: Testimonial[] = [
  {
    id: "luciana",
    name: "Luciana Hass",
    comment: "Super recomendo. Serviço de qualidade... 👏👏👏",
    timeAgo: "Há 6 anos",
    rating: 5,
  },
  {
    id: "ana-paula",
    name: "Ana Paula Martins",
    comment: "Site fácil de usar e entrega rápida. Muito satisfeita! ✨",
    timeAgo: "Há 2 semanas",
    rating: 5,
  },
  {
    id: "eduardo",
    name: "Eduardo Oliveira",
    comment: "Loja confiável e com produtos de qualidade.",
    timeAgo: "Há 1 dia",
    rating: 4,
  },
];

/** Primeira letra do primeiro e do último nome: "Ana Paula Martins" → "AM". */
function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

/**
 * Seção "O que nossos clientes estão falando" da Home: grade de cards com os
 * depoimentos.
 */
export function Depoimentos() {
  return (
    <section className="depoimentos">
      <Container>
        <h2>O que nossos clientes estão falando:</h2>

        <div className="depoimentos__grade">
          {TESTIMONIALS.map((testimonial) => (
            <article key={testimonial.id} className="depoimentos__card">
              <div className="depoimentos__cabecalho-card">
                <span className="depoimentos__avatar" aria-hidden="true">
                  {iniciais(testimonial.name)}
                </span>
                <div className="depoimentos__quem">
                  <strong>{testimonial.name}</strong>
                  <span className="depoimentos__tempo">{testimonial.timeAgo}</span>
                </div>
              </div>
              {/* as estrelas cheias seguem a nota; as vazias completam até 5 */}
              <p className="depoimentos__estrelas" role="img" aria-label={`Nota ${testimonial.rating} de 5`}>
                <span className="depoimentos__estrelas-cheias">{"★".repeat(testimonial.rating)}</span>
                <span className="depoimentos__estrelas-vazias">{"★".repeat(5 - testimonial.rating)}</span>
              </p>
              <p className="depoimentos__comentario">{testimonial.comment}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Depoimentos;
