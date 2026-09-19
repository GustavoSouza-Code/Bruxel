import { useState } from "react";
import { Container } from "../Container/Container";
import "./Faq.css";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "piscina-verde",
    question: "Minha piscina ficou verde logo após a instalação. É normal?",
    answer: "TODO: resposta.",
  },
  {
    id: "cloro-evaporou",
    question: "Meu cloro evaporou rápido. O que pode ter acontecido?",
    answer: "TODO: resposta.",
  },
  {
    id: "causa-verde",
    question: "Qual a causa mais comum para a piscina ficar verde?",
    answer: "TODO: resposta.",
  },
  {
    id: "produtos-servicos",
    question: "Vocês vendem apenas produtos ou também prestam serviços?",
    answer: "TODO: resposta.",
  },
];

export function Faq() {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <section className="faq">
      <Container>
        <h2>Faq</h2>

        <ul className="faq__list">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <li key={item.id} className="faq__item">
                <button
                  className="faq__question"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                >
                  {item.question}
                  <span className="faq__chevron">{isOpen ? "︿" : "﹀"}</span>
                </button>
                {isOpen && <p className="faq__answer">{item.answer}</p>}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

export default Faq;
