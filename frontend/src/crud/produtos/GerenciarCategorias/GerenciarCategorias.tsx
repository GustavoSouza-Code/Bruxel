import { useState } from "react";
import type { FormEvent } from "react";
import type { Categoria } from "../../../tipos/produto";
import { mensagemDeErro } from "../../../api/cliente";
import { useAvisos } from "../../../contexto/useAvisos";
import { IconeEditar, IconeLixeira } from "../../../componentes/ui/Icones/Icones";
import { TAMANHO_MAXIMO_NOME_CATEGORIA, validarNomeCategoria } from "../nomeCategoria";
import "./GerenciarCategorias.css";

interface GerenciarCategoriasProps {
  categorias: Categoria[];
  onCriar: (nome: string) => Promise<void>;
  onRenomear: (id: string, nome: string) => Promise<void>;
  onExcluir: (id: string) => Promise<void>;
}

/**
 * Conteúdo do modal de categorias: lista com renomear e excluir, e um campo
 * pra criar. Erros da API (nome repetido, categoria com produtos) aparecem
 * acima da lista.
 */
export function GerenciarCategorias({ categorias, onCriar, onRenomear, onExcluir }: GerenciarCategoriasProps) {
  const [novoNome, setNovoNome] = useState("");
  // categoria em edição e o texto digitado; null = nenhuma
  const [editando, setEditando] = useState<{ id: string; nome: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const { avisar } = useAvisos();

  // roda uma ação, mostra o erro da API se houver (ou o aviso de sucesso) e devolve se deu certo
  async function executar(acao: () => Promise<void>, mensagemSucesso: string) {
    setErro(null);
    setOcupado(true);
    try {
      await acao();
      avisar({ tipo: "sucesso", mensagem: mensagemSucesso });
      return true;
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function criar(event: FormEvent) {
    event.preventDefault();
    const problema = validarNomeCategoria(novoNome);
    if (problema) return setErro(problema);
    if (await executar(() => onCriar(novoNome.trim()), "Categoria criada.")) setNovoNome("");
  }

  async function salvarEdicao(event: FormEvent) {
    event.preventDefault();
    if (!editando) return;
    const problema = validarNomeCategoria(editando.nome);
    if (problema) return setErro(problema);
    if (await executar(() => onRenomear(editando.id, editando.nome.trim()), "Categoria renomeada.")) {
      setEditando(null);
    }
  }

  async function excluir(categoria: Categoria) {
    if (!window.confirm(`Excluir a categoria "${categoria.nome}"?`)) return;
    await executar(() => onExcluir(categoria.id), "Categoria excluída.");
  }

  return (
    <div className="gerenciar-categorias">
      <form className="gerenciar-categorias__nova" onSubmit={criar}>
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          maxLength={TAMANHO_MAXIMO_NOME_CATEGORIA}
          placeholder="Nova categoria"
          aria-label="Nome da nova categoria"
        />
        <button type="submit" className="lista-admin__botao" disabled={ocupado}>
          Adicionar
        </button>
      </form>

      {erro && (
        <p className="lista-admin__aviso" role="alert">
          {erro}
        </p>
      )}

      {categorias.length === 0 && <p className="lista-admin__vazio">Nenhuma categoria cadastrada.</p>}

      <ul className="gerenciar-categorias__lista">
        {categorias.map((categoria) => (
          <li key={categoria.id} className="gerenciar-categorias__item">
            {editando?.id === categoria.id ? (
              <form className="gerenciar-categorias__edicao" onSubmit={salvarEdicao}>
                <input
                  value={editando.nome}
                  onChange={(e) => setEditando({ id: categoria.id, nome: e.target.value })}
                  maxLength={TAMANHO_MAXIMO_NOME_CATEGORIA}
                  aria-label={`Novo nome de ${categoria.nome}`}
                  autoFocus
                />
                <button type="submit" className="lista-admin__botao" disabled={ocupado}>
                  Salvar
                </button>
                <button
                  type="button"
                  className="lista-admin__botao lista-admin__botao--contorno"
                  onClick={() => setEditando(null)}
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <>
                <span className="gerenciar-categorias__nome">{categoria.nome}</span>
                <span className="lista-admin__linha-acoes">
                  <button
                    className="lista-admin__icone-botao"
                    onClick={() => {
                      setErro(null);
                      setEditando({ id: categoria.id, nome: categoria.nome });
                    }}
                    aria-label={`Renomear ${categoria.nome}`}
                    title="Renomear"
                  >
                    <IconeEditar />
                  </button>
                  <button
                    className="lista-admin__icone-botao lista-admin__icone-botao--perigo"
                    onClick={() => excluir(categoria)}
                    disabled={ocupado}
                    aria-label={`Excluir ${categoria.nome}`}
                    title="Excluir"
                  >
                    <IconeLixeira />
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GerenciarCategorias;
