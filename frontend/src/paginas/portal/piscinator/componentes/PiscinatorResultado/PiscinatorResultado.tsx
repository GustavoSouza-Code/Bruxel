import type { Produto } from "../../../../../tipos/produto";
import { Container } from "../../../../../componentes/layout/Container/Container";
import { CardProduto } from "../../../../../componentes/produto/CardProduto/CardProduto";
import "./PiscinatorResultado.css";

interface PiscinatorResultadoProps {
  /** respostas do quiz (true = "Sim"); cada "Sim" vale 1 ponto no diagnóstico */
  respostas: boolean[];
  /** produtos recomendados, mostrados abaixo do diagnóstico */
  produtos: Produto[];
  /** chamada ao clicar em "Refazer diagnóstico" */
  onRecomecar: () => void;
}

/**
 * Converte a pontuação (nº de respostas "Sim", de 0 a 3) no texto do
 * diagnóstico: 0 = tudo certo, 1 = sinais leves, 2 = moderado, 3 = grave.
 */
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

/** Etapa 3 do Piscinator: mostra o diagnóstico, o botão de refazer e os produtos recomendados. */
export function PiscinatorResultado({
  respostas,
  produtos,
  onRecomecar,
}: PiscinatorResultadoProps) {
  // pontuação = quantas respostas foram "Sim" (true)
  const score = respostas.filter(Boolean).length;
  const diagnosis = getDiagnosis(score);

  return (
    <section className="piscinator-resultado">
      <Container>
        <span className="piscinator-resultado__rotulo">Diagnóstico</span>
        <h1 className="piscinator-resultado__titulo">{diagnosis.title}</h1>
        <p className="piscinator-resultado__descricao">
          {diagnosis.description}
        </p>

        <button className="piscinator-resultado__recomecar" onClick={onRecomecar}>
          Refazer diagnóstico
        </button>

        {/* sem produtos recomendados, a seção inteira some */}
        {produtos.length > 0 && (
          <div className="piscinator-resultado__produtos">
            <h2>Produtos recomendados</h2>
            <div className="piscinator-resultado__grade">
              {produtos.map((produto) => (
                <CardProduto key={produto.id} produto={produto} />
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

export default PiscinatorResultado;
