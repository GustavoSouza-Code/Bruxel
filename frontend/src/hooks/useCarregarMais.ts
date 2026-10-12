import { useState } from "react";

/**
 * Mostra a lista aos poucos: começa com `porVez` itens e o botão "Carregar
 * mais" soma outros `porVez`. Quando a `chave` muda (ex.: trocou um filtro),
 * volta pro começo. Isso é calculado na renderização, sem useEffect: o
 * estado lembra pra qual chave a quantidade vale.
 */
export function useCarregarMais<T>(lista: T[], chave: string, porVez: number) {
  const [estado, setEstado] = useState({ chave, quantidade: porVez });
  const quantidade = estado.chave === chave ? estado.quantidade : porVez;

  return {
    visiveis: lista.slice(0, quantidade),
    temMais: lista.length > quantidade,
    carregarMais: () => setEstado({ chave, quantidade: quantidade + porVez }),
  };
}
