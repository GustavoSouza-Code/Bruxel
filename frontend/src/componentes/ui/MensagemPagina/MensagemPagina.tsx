import type { ReactNode } from "react";
import { Container } from "../../layout/Container/Container";
import "./MensagemPagina.css";

interface MensagemPaginaProps {
  /** número grande no topo (ex.: "404"); opcional */
  codigo?: string;
  titulo: string;
  texto: string;
  /** botões ou links de ação, mostrados abaixo do texto */
  children?: ReactNode;
}

/**
 * Bloco centralizado de "página de aviso": o 404 (rota que não existe) e a
 * tela de falha inesperada (LimiteDeErro) usam o mesmo visual.
 */
export function MensagemPagina({ codigo, titulo, texto, children }: MensagemPaginaProps) {
  return (
    <main className="mensagem-pagina">
      <Container className="mensagem-pagina__interno">
        {codigo && <p className="mensagem-pagina__codigo">{codigo}</p>}
        <h1 className="mensagem-pagina__titulo">{titulo}</h1>
        <p className="mensagem-pagina__texto">{texto}</p>
        {children && <div className="mensagem-pagina__acoes">{children}</div>}
      </Container>
    </main>
  );
}

export default MensagemPagina;
