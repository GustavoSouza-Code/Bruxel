import { useState } from "react";
import { Container } from "../../../../../components/layout/Container/Container";
import "./PiscinatorQuiz.css";

// perguntas do diagnóstico; "Sim" em qualquer uma indica um sinal de problema na piscina
const QUESTIONS = [
  "A água da piscina está verde?",
  "A água está turva?",
  "A piscina ficou vários dias sem manutenção?",
];

interface PiscinatorQuizProps {
  /** chamada ao responder a última pergunta, com todas as respostas (true = "Sim") */
  onFinish: (answers: boolean[]) => void;
}

/**
 * Etapa 2 do Piscinator: mostra uma pergunta por vez (com barra de
 * progresso) e coleta as respostas Sim/Não.
 */
export function PiscinatorQuiz({ onFinish }: PiscinatorQuizProps) {
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
      onFinish(nextAnswers);
    }
  }

  return (
    <section className="piscinator-quiz">
      <Container className="piscinator-quiz__inner">
        <div className="piscinator-quiz__card">
          <div className="piscinator-quiz__progress">
            <span>
              Pergunta {step + 1} de {QUESTIONS.length}
            </span>
            <div className="piscinator-quiz__progress-bar">
              <div
                className="piscinator-quiz__progress-fill"
                style={{
                  // largura da barra = pergunta atual ÷ total de perguntas (ex.: 2 de 3 = 66%)
                  width: `${((step + 1) / QUESTIONS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <h2 className="piscinator-quiz__question">{QUESTIONS[step]}</h2>

          <div className="piscinator-quiz__actions">
            <button
              className="piscinator-quiz__answer piscinator-quiz__answer--no"
              onClick={() => handleAnswer(false)}
            >
              Não
            </button>
            <button
              className="piscinator-quiz__answer piscinator-quiz__answer--yes"
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

export default PiscinatorQuiz;
