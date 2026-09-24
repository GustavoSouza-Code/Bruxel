import { useState } from "react";
import { Header } from "../../components/Header/Header";
import { PiscinatorIntro } from "../../components/PiscinatorIntro/PiscinatorIntro";
import { PiscinatorQuiz } from "../../components/PiscinatorQuiz/PiscinatorQuiz";
import { PiscinatorResult } from "../../components/PiscinatorResult/PiscinatorResult";
import { Footer } from "../../components/Footer/Footer";
import { ALL_PRODUCTS } from "./Home";

type Step = "intro" | "quiz" | "result";

export function PiscinatorPage() {
  const [step, setStep] = useState<Step>("intro");
  const [answers, setAnswers] = useState<boolean[]>([]);

  const recommendedProducts = ALL_PRODUCTS.filter(
    (product) => product.category === "tratamento-agua"
  ).slice(0, 4);

  return (
    <>
      <Header />

      {step === "intro" && (
        <PiscinatorIntro onStart={() => setStep("quiz")} />
      )}

      {step === "quiz" && (
        <PiscinatorQuiz
          onFinish={(finalAnswers) => {
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
