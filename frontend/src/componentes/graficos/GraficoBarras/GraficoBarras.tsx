import { useEffect, useRef, useState } from "react";
import { formatarReais } from "../../../crud/atendimentos/valorOs";
import { escalaBarras, rotuloMes } from "../../../crud/dashboard/graficos";
import { reaisCurtos } from "../../../crud/dashboard/textos";
import type { ReceitaMensalLinha } from "../../../api/dashboard";
import "./GraficoBarras.css";

interface GraficoBarrasProps {
  linhas: ReceitaMensalLinha[];
  compacto?: boolean;
}

const LARGURA_INICIAL = 600;
const RAIO = 4;

/** Retângulo com os cantos de cima arredondados (e os de baixo retos). */
function caminhoTopoArredondado(x: number, y: number, largura: number, altura: number): string {
  const r = Math.min(RAIO, largura / 2, altura);
  return `M${x} ${y + altura}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + largura - r}Q${x + largura} ${y} ${x + largura} ${y + r}V${y + altura}Z`;
}

/**
 * Receita por mês em barras empilhadas: loja embaixo, serviços em cima. O mês
 * atual (o último) fica em negrito. Passar o mouse, focar ou tocar numa barra
 * abre o balão com os valores.
 */
export function GraficoBarras({ linhas, compacto = false }: GraficoBarrasProps) {
  const caixa = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(LARGURA_INICIAL);
  const [ativo, setAtivo] = useState<number | null>(null);
  const ultimoPonteiro = useRef<string>("mouse");
  // no toque o foco abre o balão antes do clique; só fecha se a barra já estava aberta no toque
  const estavaAtiva = useRef(false);

  // o SVG usa a largura real da caixa, pra o texto não encolher em telas estreitas
  useEffect(() => {
    const elemento = caixa.current;
    if (!elemento) return;
    const observador = new ResizeObserver(() => setLargura(elemento.clientWidth || LARGURA_INICIAL));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const { maximo, marcas } = escalaBarras(linhas);
  if (maximo === 0) {
    // a caixa fica no DOM também vazia, pra o observador de largura já estar ligado quando chegarem dados
    return (
      <div ref={caixa} className="grafico-barras">
        <p className="grafico-barras__vazio">Nenhuma receita no período</p>
      </div>
    );
  }

  const altura = compacto ? 120 : 240;
  const margem = { topo: 10, direita: 4, base: 24, esquerda: compacto ? 4 : 52 };
  const areaLargura = Math.max(largura - margem.esquerda - margem.direita, 1);
  const areaAltura = altura - margem.topo - margem.base;
  const faixa = areaLargura / linhas.length;
  const larguraBarra = Math.min(faixa * 0.6, 48);
  const yDe = (valor: number) => margem.topo + areaAltura - (valor / maximo) * areaAltura;

  const ultima = linhas[linhas.length - 1];
  const rotuloGeral =
    `Receita de ${rotuloMes(ultima.mes, true)}: loja ${formatarReais(ultima.loja)}, ` +
    `serviços ${formatarReais(ultima.servicos)}`;

  const atual = ativo === null ? null : linhas[ativo];
  const centroAtivo = ativo === null ? 0 : margem.esquerda + faixa * ativo + faixa / 2;

  function aoClicar(indice: number) {
    // com mouse o hover já abriu o balão; no toque, tocar de novo fecha
    setAtivo(ultimoPonteiro.current !== "mouse" && estavaAtiva.current ? null : indice);
  }

  return (
    <div ref={caixa} className={`grafico-barras${compacto ? " grafico-barras--compacto" : ""}`}>
      <svg width="100%" height={altura} viewBox={`0 0 ${largura} ${altura}`} role="group" aria-label={rotuloGeral}>
        <rect width={largura} height={altura} fill="transparent" onClick={() => setAtivo(null)} />

        {marcas.map((marca) => (
          <g key={marca}>
            <line
              className="grafico-barras__grade"
              x1={margem.esquerda}
              x2={largura - margem.direita}
              y1={yDe(marca)}
              y2={yDe(marca)}
            />
            {!compacto && (
              <text className="grafico-barras__eixo" x={margem.esquerda - 8} y={yDe(marca) + 4} textAnchor="end">
                {reaisCurtos(marca)}
              </text>
            )}
          </g>
        ))}

        {linhas.map((linha, i) => {
          const x = margem.esquerda + faixa * i + (faixa - larguraBarra) / 2;
          const alturaLoja = (linha.loja / maximo) * areaAltura;
          const alturaServicos = (linha.servicos / maximo) * areaAltura;
          const yLoja = yDe(linha.loja);
          const yServicos = yLoja - alturaServicos;
          const eAtual = i === linhas.length - 1;

          return (
            <g
              key={linha.mes}
              className={`grafico-barras__barra${ativo === i ? " grafico-barras__barra--ativa" : ""}`}
              tabIndex={0}
              role="img"
              aria-label={`${rotuloMes(linha.mes, true)}: loja ${formatarReais(linha.loja)}, serviços ${formatarReais(linha.servicos)}`}
              onPointerDown={(e) => {
                ultimoPonteiro.current = e.pointerType;
                estavaAtiva.current = ativo === i;
              }}
              onPointerEnter={(e) => {
                ultimoPonteiro.current = e.pointerType;
                if (e.pointerType === "mouse") setAtivo(i);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") setAtivo(null);
              }}
              onFocus={() => setAtivo(i)}
              onBlur={() => setAtivo(null)}
              onClick={(e) => {
                e.stopPropagation();
                aoClicar(i);
              }}
            >
              {/* área de toque cobrindo a faixa inteira do mês */}
              <rect
                x={margem.esquerda + faixa * i}
                y={margem.topo}
                width={faixa}
                height={areaAltura + margem.base}
                fill="transparent"
              />
              <g className="grafico-barras__pilha">
                {linha.loja > 0 &&
                  (linha.servicos > 0 ? (
                    <rect className="grafico-barras__loja" x={x} y={yLoja} width={larguraBarra} height={alturaLoja} />
                  ) : (
                    <path
                      className="grafico-barras__loja"
                      d={caminhoTopoArredondado(x, yLoja, larguraBarra, alturaLoja)}
                    />
                  ))}
                {linha.servicos > 0 && (
                  <path
                    className="grafico-barras__servicos"
                    d={caminhoTopoArredondado(x, yServicos, larguraBarra, alturaServicos)}
                  />
                )}
              </g>
              <text
                className={`grafico-barras__mes${eAtual ? " grafico-barras__mes--atual" : ""}`}
                x={x + larguraBarra / 2}
                y={altura - 6}
                textAnchor="middle"
              >
                {rotuloMes(linha.mes)}
              </text>
            </g>
          );
        })}
      </svg>

      {atual && (
        <div
          className="grafico-barras__balao"
          style={{
            left: Math.min(Math.max(centroAtivo, 70), Math.max(largura - 70, 70)),
            top: yDe(atual.loja + atual.servicos),
          }}
          aria-hidden="true"
        >
          <strong>{rotuloMes(atual.mes, true)}</strong>
          <span>
            <i className="grafico-barras__cor grafico-barras__cor--loja" />
            Loja {formatarReais(atual.loja)}
          </span>
          <span>
            <i className="grafico-barras__cor grafico-barras__cor--servicos" />
            Serviços {formatarReais(atual.servicos)}
          </span>
        </div>
      )}
    </div>
  );
}

export default GraficoBarras;
