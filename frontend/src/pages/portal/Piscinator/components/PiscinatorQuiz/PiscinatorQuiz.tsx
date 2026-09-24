import { useState } from "react";
import { Container } from "../../../../../components/layout/Container/Container";
import "./PiscinatorQuiz.css";

const QUESTIONS = [
  "A água da piscina está verde?",
  "A água está turva?",
  "A piscina ficou vários dias sem manutenção?",
];

interface PiscinatorQuizProps {
  onFinish: (answers: boolean[]) => void;
}

export function PiscinatorQuiz({ onFinish }: PiscinatorQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  function handleAnswer(value: boolean) {
    const nextAnswers = [...answers, value];
    if (step + 1 < QUESTIONS.length) {
      setAnswers(nextAnswers);
      setStep(step + 1);
    } else {
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
