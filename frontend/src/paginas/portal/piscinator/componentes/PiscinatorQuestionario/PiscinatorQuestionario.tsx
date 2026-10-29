import { useState } from "react";
import { Container } from "../../../../../componentes/layout/Container/Container";
import "./PiscinatorQuestionario.css";

// perguntas do diagnóstico; "Sim" em qualquer uma indica um sinal de problema na piscina
const QUESTIONS = [
  "A água da piscina está verde?",
  "A água está turva?",
  "A piscina ficou vários dias sem manutenção?",
];

interface PiscinatorQuestionarioProps {
  /** chamada ao responder a última pergunta, com todas as respostas (true = "Sim") */
  onConcluir: (answers: boolean[]) => void;
}

/**
 * Etapa 2 do Piscinator: mostra uma pergunta por vez (com barra de
 * progresso) e coleta as respostas Sim/Não.
 */
export function PiscinatorQuestionario({ onConcluir }: PiscinatorQuestionarioProps) {
  // índice da pergunta atual (0 = primeira)
  const [step, setStep] = useState(0);
  // respostas já dadas, na ordem das perguntas
  const [answers, setAnswers] = useState<boolean[]>([]);

  function handleAnswer(value: boolean) {
    // o estado só atualiza na próxima renderização, então a lista com a resposta atual é montada aqui
    const nextAnswers = [...answers, value];
    if (step + 1 < QUESTIONS.length) {
      setAnswers(nextAnswers);
      setStep(step + 1);
    } else {
      // última pergunta: entrega tudo pra página em vez de guardar no estado local
      onConcluir(nextAnswers);
    }
  }

  return (
    <section className="piscinator-questionario">
      <Container className="piscinator-questionario__interno">
        <div className="piscinator-questionario__card">
          <div className="piscinator-questionario__progresso">
            <span>
              Pergunta {step + 1} de {QUESTIONS.length}
            </span>
            <div className="piscinator-questionario__barra-progresso">
              <div
                className="piscinator-questionario__preenchimento-progresso"
                style={{
                  // a barra tem a largura toda e encolhe na horizontal: pergunta atual ÷ total
                  // (ex.: 2 de 3 = 0.66). Animar transform é mais leve que animar width
                  transform: `scaleX(${(step + 1) / QUESTIONS.length})`,
                }}
              />
            </div>
          </div>

          {/* a key nova a cada pergunta faz o título nascer de novo e rodar a animação de entrada */}
          <h2 key={step} className="piscinator-questionario__pergunta">
            {QUESTIONS[step]}
          </h2>

          <div className="piscinator-questionario__acoes">
            <button
              className="piscinator-questionario__resposta piscinator-questionario__resposta--nao"
              onClick={() => handleAnswer(false)}
            >
              Não
            </button>
            <button
              className="piscinator-questionario__resposta piscinator-questionario__resposta--sim"
              onClick={() => handleAnswer(true)}
            >
              Sim
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default PiscinatorQuestionario;
