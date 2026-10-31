import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Container } from "../../../../../componentes/layout/Container/Container";
import { IconeMenu } from "../../../../../componentes/ui/Icones/Icones";
import type { FiltrosProduto, OrdemProduto } from "../../../../../crud/produtos/filtrarProdutos";
import {
  ORDENS_LOJA,
  contarFiltrosLoja,
  filtrosAtivosLoja,
  limparFiltrosLoja,
  removerFiltroLoja,
} from "../../../../../crud/produtos/filtrosLoja";
import type { Categoria } from "../../../../../tipos/produto";
import { iconeDaCategoria } from "./iconesCategoria";
import "./FiltrosLoja.css";

interface FiltrosLojaProps {
  categorias: Categoria[];
  /** os filtros em uso; o estado mora na PaginaLoja */
  filtros: FiltrosProduto;
  onMudar: (filtros: FiltrosProduto) => void;
  /** quantos produtos aparecem com os filtros atuais (busca incluída) */
  totalResultados: number;
}

/**
 * Barra de filtros da Loja: um botão com os três risquinhos que abre o painel
 * (categoria, faixa de preço e ordenação). Os filtros valem na hora, e os que
 * estão em uso aparecem como etiquetas ao lado do botão, cada uma com um × pra
 * tirar. No computador o painel abre logo abaixo do botão; no celular ele sobe
 * do pé da tela (com fundo escurecido).
 */
export function FiltrosLoja({ categorias, filtros, onMudar, totalResultados }: FiltrosLojaProps) {
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  const quantidade = contarFiltrosLoja(filtros);
  const ativos = filtrosAtivosLoja(filtros, categorias);

  // fecha e devolve o foco pro botão, pra quem usa teclado não se perder
  const fechar = useCallback(() => {
    setAberto(false);
    botaoRef.current?.focus();
  }, []);

  // aberto: Esc fecha, o foco vai pro painel e o fundo da página para de rolar (só no celular, ver o CSS)
  useEffect(() => {
    if (!aberto) return;
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") fechar();
    }
    document.addEventListener("keydown", aoTeclar);
    document.body.classList.add("filtros-loja-aberto");
    painelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.classList.remove("filtros-loja-aberto");
    };
  }, [aberto, fechar]);

  function mudarCampo(campo: "precoMin" | "precoMax") {
    return (evento: ChangeEvent<HTMLInputElement>) => onMudar({ ...filtros, [campo]: evento.target.value });
  }

  return (
    <section className="filtros-loja" aria-label="Filtros da loja">
      <Container className="filtros-loja__interno">
        <div className="filtros-loja__ancora">
          <button
            ref={botaoRef}
            type="button"
            className={`filtros-loja__botao${aberto ? " filtros-loja__botao--aberto" : ""}`}
            onClick={() => (aberto ? fechar() : setAberto(true))}
            aria-expanded={aberto}
            aria-controls={idPainel}
          >
            <IconeMenu />
            Filtros
            {quantidade > 0 && <span className="filtros-loja__contador">{quantidade}</span>}
          </button>

          {aberto && (
            <>
              <div className="filtros-loja__fundo" onClick={fechar} aria-hidden="true" />
              <div
                id={idPainel}
                ref={painelRef}
                tabIndex={-1}
                role="dialog"
                aria-label="Filtros da loja"
                className="filtros-loja__painel"
              >
                <div className="filtros-loja__topo">
                  <h2>Filtros</h2>
                  <button type="button" className="filtros-loja__fechar" onClick={fechar} aria-label="Fechar filtros">
                    ×
                  </button>
                </div>

                {categorias.length > 0 && (
                  <fieldset className="filtros-loja__grupo">
                    <legend>Categoria</legend>
                    <div className="filtros-loja__categorias">
                      <button
                        type="button"
                        className={`filtros-loja__categoria${filtros.categoriaId === "" ? " filtros-loja__categoria--marcada" : ""}`}
                        aria-pressed={filtros.categoriaId === ""}
                        onClick={() => onMudar({ ...filtros, categoriaId: "" })}
                      >
                        Todas
                      </button>
                      {categorias.map((categoria) => (
                        <button
                          key={categoria.id}
                          type="button"
                          className={`filtros-loja__categoria${filtros.categoriaId === categoria.id ? " filtros-loja__categoria--marcada" : ""}`}
                          aria-pressed={filtros.categoriaId === categoria.id}
                          onClick={() => onMudar({ ...filtros, categoriaId: categoria.id })}
                        >
                          {iconeDaCategoria(categoria.nome)}
                          {categoria.nome}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                <fieldset className="filtros-loja__grupo">
                  <legend>Preço (R$)</legend>
                  <div className="filtros-loja__preco">
                    <label>
                      <span>Mínimo</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={filtros.precoMin}
                        onChange={mudarCampo("precoMin")}
                      />
                    </label>
                    <label>
                      <span>Máximo</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={filtros.precoMax}
                        onChange={mudarCampo("precoMax")}
                      />
                    </label>
                  </div>
                </fieldset>

                <label className="filtros-loja__grupo filtros-loja__ordem">
                  <span className="filtros-loja__legenda">Ordenar por</span>
                  <select
                    value={filtros.ordem}
                    onChange={(evento) => onMudar({ ...filtros, ordem: evento.target.value as OrdemProduto })}
                  >
                    {ORDENS_LOJA.map((ordem) => (
                      <option key={ordem.valor} value={ordem.valor}>
                        {ordem.rotulo}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="filtros-loja__rodape">
                  <button
                    type="button"
                    className="filtros-loja__limpar"
                    onClick={() => onMudar(limparFiltrosLoja(filtros))}
                    disabled={quantidade === 0}
                  >
                    Limpar filtros
                  </button>
                  <button type="button" className="filtros-loja__aplicar" onClick={fechar}>
                    {totalResultados === 1 ? "Ver 1 produto" : `Ver ${totalResultados} produtos`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {ativos.length > 0 && (
          <ul className="filtros-loja__ativos" aria-label="Filtros em uso">
            {ativos.map((ativo) => (
              <li key={ativo.chave}>
                <span className="filtros-loja__etiqueta">
                  {ativo.rotulo}
                  <button
                    type="button"
                    onClick={() => onMudar(removerFiltroLoja(filtros, ativo.chave))}
                    aria-label={`Remover filtro ${ativo.rotulo}`}
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="filtros-loja__total" aria-live="polite">
          {totalResultados === 1 ? "1 produto" : `${totalResultados} produtos`}
        </p>
      </Container>
    </section>
  );
}

export default FiltrosLoja;
