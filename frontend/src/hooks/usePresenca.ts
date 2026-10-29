import { useEffect, useState } from "react";

// quem pede menos movimento no sistema não espera animação de saída
function querMenosMovimento() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Deixa um elemento (menu, aviso) animar a saída antes de sumir da tela.
 *
 * Renderização condicional (`{aberto && <Menu />}`) desmonta na hora e corta
 * a animação. Com este hook a tela usa `montado` pra decidir se renderiza e
 * `saindo` pra pôr a classe de saída: quando `aberto` vira false, o elemento
 * continua montado por `duracaoSaidaMs` (0 com "menos movimento") e só então
 * sai. Reabrir no meio da saída cancela a saída.
 */
export function usePresenca(aberto: boolean, duracaoSaidaMs: number) {
  const [montado, setMontado] = useState(aberto);
  // valor anterior de `aberto`, pra perceber a mudança durante a renderização
  // (mesmo jeito do useCarregarMais), sem setState direto dentro do efeito
  const [abertoAnterior, setAbertoAnterior] = useState(aberto);
  if (aberto !== abertoAnterior) {
    setAbertoAnterior(aberto);
    if (aberto) setMontado(true);
  }

  // fechou: espera a animação de saída e desmonta; reabrir antes limpa o timer
  useEffect(() => {
    if (aberto || !montado) return;
    const espera = querMenosMovimento() ? 0 : duracaoSaidaMs;
    const timer = window.setTimeout(() => setMontado(false), espera);
    return () => window.clearTimeout(timer);
  }, [aberto, montado, duracaoSaidaMs]);

  return { montado: aberto || montado, saindo: !aberto && montado };
}
