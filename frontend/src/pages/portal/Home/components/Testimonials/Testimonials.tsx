import { Container } from "../../../../../components/layout/Container/Container";
import "./Testimonials.css";

interface Testimonial {
  id: string;
  name: string;
  comment: string;
  timeAgo: string;
  rating: number;
}

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

export function Testimonials() {
  return (
    <section className="testimonials">
      <Container>
        <h2>O que nossos clientes estão falando:</h2>

        <div className="testimonials__grid">
          {TESTIMONIALS.map((testimonial) => (
            <article key={testimonial.id} className="testimonials__card">
              <div className="testimonials__card-header">
                <strong>{testimonial.name}</strong>
                <span className="testimonials__stars">★★★★★</span>
              </div>
              <p className="testimonials__comment">{testimonial.comment}</p>
              <span className="testimonials__time">
                {testimonial.timeAgo}
              </span>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Testimonials;
