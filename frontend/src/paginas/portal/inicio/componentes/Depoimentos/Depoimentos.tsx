import { Container } from "../../../../../componentes/layout/Container/Container";
import "./Depoimentos.css";

/** Depoimento de cliente exibido na Home. */
interface Testimonial {
  id: string;
  name: string;
  comment: string;
  timeAgo: string;
  /** nota de 0 a 5 (ainda não usada: veja o TODO das estrelas, mais abaixo) */
  rating: number;
}

// depoimentos escritos direto no código, não vêm de API
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
    rating: 0,
  },
];

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
                <strong>{testimonial.name}</strong>
                {/* TODO: mostrar só `rating` estrelas; por enquanto as 5 aparecem fixas, sem ler a nota */}
                <span className="depoimentos__estrelas">★★★★★</span>
              </div>
              <p className="depoimentos__comentario">{testimonial.comment}</p>
              <span className="depoimentos__tempo">
                {testimonial.timeAgo}
              </span>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Depoimentos;
