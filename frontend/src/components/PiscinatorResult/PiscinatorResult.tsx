import type { Product } from "../../types/product";
import { Container } from "../Container/Container";
import { ProductCard } from "../ProductCard/ProductCard";
import "./PiscinatorResult.css";

interface PiscinatorResultProps {
  answers: boolean[];
  products: Product[];
  onRestart: () => void;
}

function getDiagnosis(score: number) {
  if (score === 0) {
    return {
      title: "Sua piscina está em bom estado!",
      description:
        "Não identificamos sinais de alerta. Continue com a manutenção regular e o monitoramento do cloro e do pH para manter a água sempre equilibrada.",
    };
  }

  if (score <= 1) {
    return {
      title: "Sinais leves de desequilíbrio",
      description:
        "Sua piscina apresenta sinais leves de desequilíbrio na água. Um ajuste no tratamento e uma limpeza pontual já devem resolver o problema.",
    };
  }

  if (score === 2) {
    return {
      title: "Desequilíbrio moderado identificado",
      description:
        "Sua piscina apresenta desequilíbrio moderado, com possível presença de algas ou cloro insuficiente. Recomendamos um choque de cloro e reforço na filtração.",
    };
  }

  return {
    title: "Forte presença de algas e sujeira",
    description:
      "Sua piscina apresenta forte presença de algas e acúmulo de sujeira na água. Recomendamos um tratamento de choque completo, seguido de manutenção preventiva regular.",
  };
}

export function PiscinatorResult({
  answers,
  products,
  onRestart,
}: PiscinatorResultProps) {
  const score = answers.filter(Boolean).length;
  const diagnosis = getDiagnosis(score);

  return (
    <section className="piscinator-result">
      <Container>
        <span className="piscinator-result__label">Diagnóstico</span>
        <h1 className="piscinator-result__title">{diagnosis.title}</h1>
        <p className="piscinator-result__description">
          {diagnosis.description}
        </p>

        <button className="piscinator-result__restart" onClick={onRestart}>
          Refazer diagnóstico
        </button>

        {products.length > 0 && (
          <div className="piscinator-result__products">
            <h2>Produtos recomendados</h2>
            <div className="piscinator-result__grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

export default PiscinatorResult;
