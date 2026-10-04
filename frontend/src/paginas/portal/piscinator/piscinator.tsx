import { useState } from "react";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { PiscinatorIntroducao } from "./componentes/PiscinatorIntroducao/PiscinatorIntroducao";
import { PiscinatorQuestionario } from "./componentes/PiscinatorQuestionario/PiscinatorQuestionario";
import { PiscinatorResultado } from "./componentes/PiscinatorResultado/PiscinatorResultado";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { TODOS_PRODUTOS } from "../../../dados/produtos";

/** Etapa atual do fluxo: apresentação → perguntas → diagnóstico. */
type Step = "intro" | "quiz" | "result";

/**
 * Página do Piscinator (rota "/piscinator"): um diagnóstico rápido da piscina
 * em 3 etapas. Esta página controla qual etapa aparece (`step`) e guarda as
 * respostas do quiz pra entregá-las ao resultado.
 */
export function PaginaPiscinator() {
  const [step, setStep] = useState<Step>("intro");
  // uma resposta por pergunta, na ordem (true = "Sim"); só é preenchida quando o quiz termina
  const [answers, setAnswers] = useState<boolean[]>([]);

  // TODO: recomendar produtos conforme o diagnóstico; hoje a lista é fixa (os 4 primeiros de "tratamento-agua")
  const recommendedProducts = TODOS_PRODUTOS.filter(
    (product) => product.categoria_id === "tratamento-agua"
  ).slice(0, 4);

  return (
    <>
      <Cabecalho />

      {/* só uma etapa é renderizada por vez */}
      {step === "intro" && (
        <PiscinatorIntroducao onComecar={() => setStep("quiz")} />
      )}

      {step === "quiz" && (
        <PiscinatorQuestionario
          onConcluir={(finalAnswers) => {
            // guarda as respostas e passa pra tela de resultado
            setAnswers(finalAnswers);
            setStep("result");
          }}
        />
      )}

      {step === "result" && (
        <PiscinatorResultado
          respostas={answers}
          produtos={recommendedProducts}
          onRecomecar={() => {
            // refazer: apaga as respostas e volta pro começo
            setAnswers([]);
            setStep("intro");
          }}
        />
      )}

      <Rodape />
    </>
  );
}

export default PaginaPiscinator;
