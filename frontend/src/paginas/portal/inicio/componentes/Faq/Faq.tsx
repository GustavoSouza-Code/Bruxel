import { useState } from "react";
import { Container } from "../../../../../componentes/layout/Container/Container";
import "./Faq.css";

/** Uma pergunta do FAQ; o id identifica qual item está aberto. */
interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// perguntas frequentes da Bruxel, com as respostas escritas direto no código
const FAQ_ITEMS: FaqItem[] = [
  {
    id: "piscina-verde",
    question: "Minha piscina ficou verde logo após a instalação. É normal?",
    answer: "Pode acontecer, e na maioria das vezes é simples de resolver. Piscina nova ou recém-enchida ainda não tem tratamento: a água traz matéria orgânica e minerais, e sem cloro e pH ajustados as algas se multiplicam rápido, principalmente com calor e sol. O caminho é ligar o filtro, medir o pH (ideal entre 7,2 e 7,6), fazer o tratamento de choque com cloro, aplicar algicida se precisar, escovar paredes e fundo e filtrar por pelo menos 24 horas. Se a água continuar verde, nossa equipe pode ir até o local avaliar.",
  },
  {
    id: "cloro-evaporou",
    question: "Meu cloro evaporou rápido. O que pode ter acontecido?",
    answer: "Na verdade o cloro não evapora, ele é consumido. Os motivos mais comuns são o sol forte, que destrói o cloro sem estabilizante, o calor, o pH fora da faixa ideal (pH alto deixa o cloro menos eficiente), muita matéria orgânica na água (folhas, poeira, suor, protetor solar), muitos banhistas e a chuva. Para o cloro durar mais, aplique no fim da tarde, mantenha o pH entre 7,2 e 7,6, use estabilizante quando indicado e meça a água com frequência.",
  },
  {
    id: "causa-verde",
    question: "Qual a causa mais comum para a piscina ficar verde?",
    answer: "A causa mais comum são as algas. Elas surgem quando falta cloro livre na água, o pH está desequilibrado, a filtração é pouca ou a circulação é ruim. Calor, sol, chuva, folhas e o uso sem a manutenção semanal ajudam a piorar o quadro. Prevenir é mais fácil do que tratar: filtre o tempo recomendado, escove a piscina, mantenha cloro e pH em dia e retire a sujeira da superfície. Se quiser uma orientação para o seu caso, use o Piscinator aqui no site.",
  },
  {
    id: "produtos-servicos",
    question: "Vocês vendem apenas produtos ou também prestam serviços?",
    answer: "As duas coisas. Na loja virtual você encontra produtos para tratamento da água, limpeza da piscina, filtração e circulação, além de acessórios e itens de lazer. E também prestamos serviços técnicos: limpeza e manutenção, bomba e filtro, vazamentos, instalação e outros atendimentos. Para pedir uma visita, entre na sua conta e use \"Solicitar atendimento\", escolhendo o dia e o horário disponíveis.",
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
            return (
              <li key={item.id} className="faq__item">
                <button
                  className="faq__pergunta"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                >
                  {item.question}
                  <span className="faq__seta">{isOpen ? "︿" : "﹀"}</span>
                </button>
                {isOpen && <p className="faq__resposta">{item.answer}</p>}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

export default Faq;
