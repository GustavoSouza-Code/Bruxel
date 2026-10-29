import { useState } from "react";
import { Container } from "../../../../../componentes/layout/Container/Container";
import { Recolhivel } from "../../../../../componentes/ui/Recolhivel/Recolhivel";
import { IconeSeta } from "../../../../../componentes/ui/Icones/Icones";
import "./Faq.css";

/** Uma pergunta do FAQ; o id identifica qual item está aberto. */
interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// perguntas frequentes da Bruxel; as respostas ainda são placeholders ("TODO: resposta.")
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

/**
 * Lista de perguntas frequentes em formato de acordeão: clicar numa pergunta
 * abre a resposta, e abrir outra fecha a anterior (só uma fica aberta).
 */
export function Faq() {
  // id do item aberto; null = todos fechados
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    // clicar no item aberto fecha; clicar em outro troca o aberto
    setOpenId((current) => (current === id ? null : id));
  }

  return (
    <section className="faq">
      <Container>
        <h2>Faq</h2>

        <ul className="faq__lista">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            const idResposta = `faq-${item.id}`;
            return (
              <li key={item.id} className="faq__item">
                <button
                  className="faq__pergunta"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={idResposta}
                >
                  {item.question}
                  <span className={`faq__seta${isOpen ? " faq__seta--aberta" : ""}`}>
                    <IconeSeta />
                  </span>
                </button>
                {/* a resposta fica sempre no DOM; o Recolhivel abre e fecha com a altura suave */}
                <Recolhivel id={idResposta} aberto={isOpen}>
                  <p className="faq__resposta">{item.answer}</p>
                </Recolhivel>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

export default Faq;
