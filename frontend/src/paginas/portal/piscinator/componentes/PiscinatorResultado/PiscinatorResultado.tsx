import type { Recomendacao } from "../../../../../crud/produtos/recomendacaoPiscinator";
import { Container } from "../../../../../componentes/layout/Container/Container";
import { CardProduto } from "../../../../../componentes/produto/CardProduto/CardProduto";
import "./PiscinatorResultado.css";

interface PiscinatorResultadoProps {
  /** respostas do quiz (true = "Sim"); cada "Sim" vale 1 ponto no diagnóstico */
  respostas: boolean[];
  /** produtos recomendados (com os motivos), mostrados abaixo do diagnóstico */
  recomendacoes: Recomendacao[];
  /** chamada ao clicar em "Refazer diagnóstico" */
  onRecomecar: () => void;
}

/**
 * Converte a pontuação (nº de respostas "Sim", de 0 a 8) no texto do
 * diagnóstico: 0 = tudo certo, 1-2 = sinais leves, 3-4 = moderado, 5 ou mais = grave.
 */
function getDiagnosis(score: number) {
  if (score === 0) {
    return {
      title: "Sua piscina está em bom estado!",
      description:
        "Não identificamos sinais de alerta. Continue com a manutenção regular e o monitoramento do cloro e do pH para manter a água sempre equilibrada.",
    };
  }

  if (score <= 2) {
    return {
      title: "Sinais leves de desequilíbrio",
      description:
        "Sua piscina apresenta sinais leves de desequilíbrio na água. Um ajuste no tratamento e uma limpeza pontual já devem resolver o problema.",
    };
  }

  if (score <= 4) {
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
  recomendacoes,
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
        {recomendacoes.length > 0 && (
          <div className="piscinator-resultado__produtos">
            <h2>Recomendados para o seu diagnóstico</h2>
            <div className="piscinator-resultado__grade">
              {recomendacoes.map(({ produto, motivos }) => (
                <div key={produto.id} className="piscinator-resultado__item">
                  <CardProduto produto={produto} />
                  {/* só aparece quando o produto pontuou; o de preenchimento fica sem a linha */}
                  {motivos.length > 0 && (
                    <p className="piscinator-resultado__motivo">Indicado porque você respondeu Sim para: {motivos.join(", ")}.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}

export default PiscinatorResultado;
