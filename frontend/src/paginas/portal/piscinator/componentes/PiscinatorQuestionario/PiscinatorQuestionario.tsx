import { useCallback, useEffect, useState } from "react";
import { Container } from "../../../../../componentes/layout/Container/Container";
import mascoteImg from "../../../../../assets/images/mascote/mascote-bruxel.png";
import { PERGUNTAS } from "../../../../../crud/produtos/recomendacaoPiscinator";
import { IconePergunta } from "./iconesPergunta";
import "./PiscinatorQuestionario.css";

// perguntas do diagnóstico (em crud/produtos/recomendacaoPiscinator); "Sim" em qualquer uma indica um sinal de problema na piscina
const QUESTIONS = PERGUNTAS.map((pergunta) => pergunta.texto);

interface PiscinatorQuestionarioProps {
  /** chamada ao responder a última pergunta, com todas as respostas (true = "Sim") */
  onConcluir: (answers: boolean[]) => void;
}

/**
 * Etapa 2 do Piscinator: mostra uma pergunta por vez (progresso em segmentos,
 * ícone, botão de voltar e atalhos N/S) e coleta as respostas Sim/Não.
 * O mascote "fala" a pergunta: o cartão tem uma setinha apontando pra ele.
 */
export function PiscinatorQuestionario({ onConcluir }: PiscinatorQuestionarioProps) {
  // índice da pergunta atual (0 = primeira)
  const [step, setStep] = useState(0);
  // respostas já dadas, na ordem das perguntas
  const [answers, setAnswers] = useState<boolean[]>([]);

  const handleAnswer = useCallback(
    (value: boolean) => {
      // o estado só atualiza na próxima renderização, então a lista com a resposta atual é montada aqui
      const nextAnswers = [...answers, value];
      if (step + 1 < QUESTIONS.length) {
        setAnswers(nextAnswers);
        setStep(step + 1);
      } else {
        // última pergunta: entrega tudo pra página em vez de guardar no estado local
        onConcluir(nextAnswers);
      }
    },
    [answers, step, onConcluir]
  );

  // volta uma pergunta e apaga a resposta dela (o cliente responde de novo)
  function handleVoltar() {
    if (step === 0) return;
    setStep(step - 1);
    setAnswers(answers.slice(0, -1));
  }

  // atalhos de teclado: S = Sim, N = Não (sem Ctrl/Alt/Cmd, e sem repetir quando a tecla fica pressionada)
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.repeat || evento.ctrlKey || evento.metaKey || evento.altKey) return;
      const tecla = evento.key.toLowerCase();
      if (tecla === "s") handleAnswer(true);
      else if (tecla === "n") handleAnswer(false);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [handleAnswer]);

  return (
    <section className="piscinator-questionario">
      <Container className="piscinator-questionario__interno">
        {/* decorativo: a pergunta já está escrita no cartão */}
        <img
          className="piscinator-questionario__mascote"
          src={mascoteImg}
          alt=""
          aria-hidden="true"
          width={648}
          height={620}
        />

        <div className="piscinator-questionario__card">
          <div className="piscinator-questionario__progresso">
            <div className="piscinator-questionario__topo">
              <span>
                Pergunta {step + 1} de {QUESTIONS.length}
              </span>
              <button
                type="button"
                className={`piscinator-questionario__voltar${step === 0 ? " piscinator-questionario__voltar--oculto" : ""}`}
                onClick={handleVoltar}
                disabled={step === 0}
                tabIndex={step === 0 ? -1 : 0}
              >
                ‹ Voltar
              </button>
            </div>
            <div
              className="piscinator-questionario__segmentos"
              role="progressbar"
              aria-label="Progresso do diagnóstico"
              aria-valuemin={1}
              aria-valuemax={QUESTIONS.length}
              aria-valuenow={step + 1}
            >
              {QUESTIONS.map((_, indice) => (
                <span
                  key={indice}
                  className={
                    "piscinator-questionario__segmento" +
                    (indice < step ? " piscinator-questionario__segmento--feito" : "") +
                    (indice === step ? " piscinator-questionario__segmento--atual" : "")
                  }
                />
              ))}
            </div>
          </div>

          {/* a key nova a cada pergunta faz o ícone e o título nascerem de novo e rodarem a animação de entrada */}
          <div key={step} className="piscinator-questionario__bloco">
            <span className="piscinator-questionario__icone"><IconePergunta indice={step} /></span>
            <h2 className="piscinator-questionario__pergunta">{QUESTIONS[step]}</h2>
          </div>

          <div className="piscinator-questionario__acoes">
            <button
              className="piscinator-questionario__resposta piscinator-questionario__resposta--nao"
              onClick={() => handleAnswer(false)}
            >
              <span aria-hidden="true">✕</span> Não
            </button>
            <button
              className="piscinator-questionario__resposta piscinator-questionario__resposta--sim"
              onClick={() => handleAnswer(true)}
            >
              <span aria-hidden="true">✓</span> Sim
            </button>
          </div>

          <p className="piscinator-questionario__atalhos">
            Atalhos: <kbd>N</kbd> não · <kbd>S</kbd> sim
          </p>
        </div>
      </Container>
    </section>
  );
}

export default PiscinatorQuestionario;
