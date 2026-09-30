import { useState } from "react";
import { Header } from "../../../components/layout/Header/Header";
import { PiscinatorIntro } from "./components/PiscinatorIntro/PiscinatorIntro";
import { PiscinatorQuiz } from "./components/PiscinatorQuiz/PiscinatorQuiz";
import { PiscinatorResult } from "./components/PiscinatorResult/PiscinatorResult";
import { Footer } from "../../../components/layout/Footer/Footer";
import { ALL_PRODUCTS } from "../../../data/products";

/** Etapa atual do fluxo: apresentação → perguntas → diagnóstico. */
type Step = "intro" | "quiz" | "result";

/**
 * Página do Piscinator (rota "/piscinator"): um diagnóstico rápido da piscina
 * em 3 etapas. Esta página controla qual etapa aparece (`step`) e guarda as
 * respostas do quiz pra entregá-las ao resultado.
 */
export function PiscinatorPage() {
  const [step, setStep] = useState<Step>("intro");
  // uma resposta por pergunta, na ordem (true = "Sim"); só é preenchida quando o quiz termina
  const [answers, setAnswers] = useState<boolean[]>([]);

  // TODO: recomendar produtos conforme o diagnóstico; hoje a lista é fixa (os 4 primeiros de "tratamento-agua")
  const recommendedProducts = ALL_PRODUCTS.filter(
    (product) => product.categoria_id === "tratamento-agua"
  ).slice(0, 4);

  return (
    <>
      <Header />

      {/* só uma etapa é renderizada por vez */}
      {step === "intro" && (
        <PiscinatorIntro onStart={() => setStep("quiz")} />
      )}

      {step === "quiz" && (
        <PiscinatorQuiz
          onFinish={(finalAnswers) => {
            // guarda as respostas e passa pra tela de resultado
            setAnswers(finalAnswers);
            setStep("result");
          }}
        />
      )}

      {step === "result" && (
        <PiscinatorResult
          answers={answers}
          products={recommendedProducts}
          onRestart={() => {
            // refazer: apaga as respostas e volta pro começo
            setAnswers([]);
            setStep("intro");
          }}
        />
      )}

      <Footer />
    </>
  );
}

export default PiscinatorPage;
