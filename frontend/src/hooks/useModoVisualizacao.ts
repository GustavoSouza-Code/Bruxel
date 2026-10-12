import { useState } from "react";

export type ModoVisualizacao = "cards" | "lista";

const PREFIXO = "bruxel:visualizacao:";

// o localStorage pode falhar (aba anônima, armazenamento bloqueado): aí fica em "cards"
function lerModoSalvo(chave: string): ModoVisualizacao {
  try {
    return localStorage.getItem(PREFIXO + chave) === "lista" ? "lista" : "cards";
  } catch {
    return "cards";
  }
}

/**
 * Modo de visualização de uma lista (cards ou lista compacta), lembrado no
 * navegador: quem prefere a lista não precisa trocar toda vez que abre a tela.
 * A `chave` separa as telas (ex.: "admin-produtos" e "admin-usuarios").
 */
export function useModoVisualizacao(chave: string) {
  const [modo, setModoEstado] = useState<ModoVisualizacao>(() => lerModoSalvo(chave));

  function setModo(novoModo: ModoVisualizacao) {
    setModoEstado(novoModo);
    try {
      localStorage.setItem(PREFIXO + chave, novoModo);
    } catch {
      // sem armazenamento, o modo vale só até sair da tela
    }
  }

  return [modo, setModo] as const;
}
