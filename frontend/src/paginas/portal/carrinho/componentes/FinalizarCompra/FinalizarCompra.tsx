import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { mensagemDeErro } from "../../../../../api/cliente";
import { criarPedido, paraCorpoPedido } from "../../../../../api/pedidos";
import { buscarUsuario } from "../../../../../api/usuarios";
import { useAutenticacao } from "../../../../../contexto/useAutenticacao";
import { useCarrinho } from "../../../../../contexto/useCarrinho";
import { enderecoDeEntrega } from "../../../../../crud/pedidos/enderecoEntrega";
import { formatarReais } from "../../../../../crud/atendimentos/valorOs";
import type { FormaPagamento } from "../../../../../tipos/pedido";
import "./FinalizarCompra.css";

// opções na ordem em que aparecem; o valor é o enum do banco
const FORMAS_PAGAMENTO: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: "PIX", rotulo: "Pix" },
  { valor: "CARTAO_CREDITO", rotulo: "Cartão de crédito" },
  { valor: "BOLETO", rotulo: "Boleto" },
];

// limite do backend pro endereço de entrega
const ENDERECO_MAX = 500;

/**
 * Resumo do carrinho com o fechamento da compra: forma de pagamento, endereço
 * de entrega (vem preenchido com o do perfil) e o POST /orders. Sem login,
 * mostra o atalho pro /entrar, que volta pro carrinho depois.
 */
export function FinalizarCompra() {
  const { itens, total, limparCarrinho } = useCarrinho();
  const { usuario, token } = useAutenticacao();
  const navigate = useNavigate();

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");
  const [endereco, setEndereco] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const idUsuario = usuario?.id;

  // preenche o endereço com o do perfil; se a pessoa já digitou algo, não sobrescreve.
  // Se a busca falhar, o campo só fica vazio pra digitar
  useEffect(() => {
    if (!token || !idUsuario) return;
    let cancelado = false;
    buscarUsuario(token, idUsuario)
      .then((dados) => {
        if (!cancelado) setEndereco((atual) => atual || enderecoDeEntrega(dados));
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [token, idUsuario]);

  async function finalizar(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (!endereco.trim()) {
      setErro("Informe o endereço de entrega.");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const pedido = await criarPedido(token, paraCorpoPedido(itens, formaPagamento, endereco));
      limparCarrinho();
      // a confirmação recebe o pedido pronto; se a página for recarregada, ela busca de novo na API
      navigate(`/pedido/${pedido.id}`, { state: { pedido } });
    } catch (falha) {
      // estoque insuficiente (409) e afins: a mensagem do back diz qual produto
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  return (
    <aside className="pagina-carrinho__resumo">
      <h2>Finalizar compra</h2>
      {/* o backend ainda grava frete 0, então Produtos e Total são iguais */}
      <div className="pagina-carrinho__linha-resumo">
        <span>Produtos</span>
        <span>{formatarReais(total)}</span>
      </div>
      <div className="pagina-carrinho__linha-resumo pagina-carrinho__linha-resumo--total">
        <span>Total</span>
        <span>{formatarReais(total)}</span>
      </div>

      {!usuario ? (
        <>
          <p className="finalizar-compra__aviso">Entre na sua conta para fechar a compra.</p>
          <Link to="/entrar" state={{ de: "/carrinho" }} className="pagina-carrinho__continuar finalizar-compra__entrar">
            Entrar e continuar
          </Link>
        </>
      ) : (
        <form className="finalizar-compra" onSubmit={finalizar}>
          <fieldset className="finalizar-compra__pagamento">
            <legend>Pagamento</legend>
            {FORMAS_PAGAMENTO.map((forma) => (
              <label key={forma.valor} className="finalizar-compra__opcao">
                <input
                  type="radio"
                  name="forma-pagamento"
                  value={forma.valor}
                  checked={formaPagamento === forma.valor}
                  onChange={() => setFormaPagamento(forma.valor)}
                />
                {forma.rotulo}
              </label>
            ))}
          </fieldset>

          <label className="finalizar-compra__campo">
            <span>Entregar em</span>
            <textarea
              rows={3}
              maxLength={ENDERECO_MAX}
              value={endereco}
              placeholder="Rua, número - bairro - cidade - UF - CEP"
              onChange={(event) => setEndereco(event.target.value)}
            />
          </label>

          {erro && (
            <p className="finalizar-compra__erro" role="alert">
              {erro}
            </p>
          )}

          <button type="submit" className="pagina-carrinho__continuar" disabled={enviando}>
            {enviando ? "Finalizando…" : "Finalizar compra"}
          </button>
        </form>
      )}
    </aside>
  );
}

export default FinalizarCompra;
