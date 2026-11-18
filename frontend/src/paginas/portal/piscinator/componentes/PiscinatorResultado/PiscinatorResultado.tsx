import { Container } from "../../../../../componentes/layout/Container/Container";
import { CardProduto } from "../../../../../componentes/produto/CardProduto/CardProduto";
import { diagnosticoPorPontuacao } from "../../../../../crud/produtos/diagnosticoPiscinator";
import { PERGUNTAS } from "../../../../../crud/produtos/recomendacaoPiscinator";
import type { Recomendacao } from "../../../../../crud/produtos/recomendacaoPiscinator";
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
 * Etapa 3 do Piscinator: faixa azul com o diagnóstico (texto + medidor de 0 a 8 sinais,
 * com cor por gravidade) e, abaixo, os produtos recomendados com os motivos em etiquetas.
 */
export function PiscinatorResultado({
  respostas,
  recomendacoes,
  onRecomecar,
}: PiscinatorResultadoProps) {
  // pontuação = quantas respostas foram "Sim" (true)
  const score = respostas.filter(Boolean).length;
  const diagnosis = diagnosticoPorPontuacao(score);

  return (
    <>
      <section className="piscinator-resultado">
        <Container>
          <span className="piscinator-resultado__rotulo">Diagnóstico</span>
          <h1 className="piscinator-resultado__titulo">{diagnosis.titulo}</h1>
          <p className="piscinator-resultado__descricao">{diagnosis.descricao}</p>

          {/* medidor: um segmento por pergunta, os respondidos "Sim" acendem na cor do nível */}
          <div
            className={`piscinator-resultado__medidor piscinator-resultado__medidor--${diagnosis.nivel}`}
            role="img"
            aria-label={`${score} de ${PERGUNTAS.length} sinais de problema identificados`}
          >
            <div className="piscinator-resultado__segmentos">
              {PERGUNTAS.map((pergunta, indice) => (
                <span
                  key={pergunta.rotulo}
                  className={
                    "piscinator-resultado__segmento" +
                    (indice < score ? " piscinator-resultado__segmento--cheio" : "")
                  }
                />
              ))}
            </div>
            <span className="piscinator-resultado__legenda">
              {score} de {PERGUNTAS.length} sinais
            </span>
          </div>

          <button className="piscinator-resultado__recomecar" onClick={onRecomecar}>
            Refazer diagnóstico
          </button>
        </Container>
      </section>

      {/* sem produtos recomendados, a seção inteira some */}
      {recomendacoes.length > 0 && (
        <section className="piscinator-resultado__produtos">
          <Container>
            <h2>Recomendados para o seu diagnóstico</h2>
            <div className="piscinator-resultado__grade">
              {recomendacoes.map(({ produto, motivos }) => (
                <div key={produto.id} className="piscinator-resultado__item">
                  <CardProduto produto={produto} />
                  {/* só aparece quando o produto pontuou; o de preenchimento fica sem as etiquetas */}
                  {motivos.length > 0 && (
                    <div className="piscinator-resultado__motivos">
                      <span className="piscinator-resultado__motivos-rotulo">Indicado para</span>
                      <ul className="piscinator-resultado__etiquetas">
                        {motivos.map((motivo) => (
                          <li key={motivo} className="piscinator-resultado__etiqueta">
                            {motivo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

export default PiscinatorResultado;
