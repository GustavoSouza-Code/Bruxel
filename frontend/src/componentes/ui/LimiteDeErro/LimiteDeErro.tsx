import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { MensagemPagina } from "../MensagemPagina/MensagemPagina";

interface LimiteDeErroProps {
  children: ReactNode;
  /**
   * Quando este valor muda (ex.: a rota atual), o aviso some e o conteúdo é
   * montado de novo. Sem isso, depois de uma falha o site ficaria travado
   * mesmo ao navegar pra outra página.
   */
  chaveReinicio?: string;
}

interface EstadoLimiteDeErro {
  falhou: boolean;
}

/**
 * Rede de segurança do app: se algum componente lançar erro ao renderizar,
 * em vez da tela em branco mostra um aviso com saída (recarregar ou voltar
 * ao início). Erros de chamadas à API não passam por aqui: esses cada tela
 * já trata e mostra na própria interface.
 *
 * Precisa ser uma classe: o React só oferece essa captura em componentes de classe.
 */
export class LimiteDeErro extends Component<LimiteDeErroProps, EstadoLimiteDeErro> {
  state: EstadoLimiteDeErro = { falhou: false };

  static getDerivedStateFromError(): EstadoLimiteDeErro {
    return { falhou: true };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // fica no console pra quem está desenvolvendo achar a causa
    console.error("Erro ao renderizar a página:", erro, info.componentStack);
  }

  componentDidUpdate(anteriores: LimiteDeErroProps) {
    if (this.state.falhou && anteriores.chaveReinicio !== this.props.chaveReinicio) {
      this.setState({ falhou: false });
    }
  }

  render() {
    if (!this.state.falhou) return this.props.children;

    // <a> comum (e não Link) de propósito: recarrega tudo e limpa o estado que quebrou
    return (
      <MensagemPagina
        titulo="Algo deu errado"
        texto="Ocorreu um problema inesperado ao mostrar esta página. Tente recarregar ou volte para o início."
      >
        <button
          type="button"
          className="mensagem-pagina__botao"
          onClick={() => window.location.reload()}
        >
          Recarregar página
        </button>
        <a href="/" className="mensagem-pagina__botao mensagem-pagina__botao--contorno">
          Ir para o início
        </a>
      </MensagemPagina>
    );
  }
}

export default LimiteDeErro;
