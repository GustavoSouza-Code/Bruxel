import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { IconeFechar } from "../Icones/Icones";
import "./Modal.css";

// duração da animação de saída (igual à do Modal.css)
const DURACAO_SAIDA_MS = 160;

interface ModalProps {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  /** true pra formulários maiores (ex.: produto), que ficam apertados na largura padrão */
  largo?: boolean;
}

/**
 * Janela modal sobre a página, feita com o <dialog> nativo: o navegador já
 * escurece o fundo, prende o foco dentro dela e fecha com Esc. Quem usa
 * decide se ela existe renderizando condicionalmente ({aberto && <Modal />}).
 *
 * Fechar pelo ✕, pelo fundo ou pelo Esc anima a saída e só depois chama
 * onFechar. Se a página desmontar o modal sozinha (ex.: depois de salvar),
 * ele some na hora.
 */
export function Modal({ titulo, onFechar, children, largo = false }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // id único por modal, pra dois modais não disputarem o mesmo aria-labelledby
  const idTitulo = useId();
  // true durante a animação de saída
  const [fechando, setFechando] = useState(false);
  const timerFechar = useRef<number | undefined>(undefined);

  // se a página desmontar o modal no meio da saída, o timer não chama onFechar depois
  useEffect(() => () => window.clearTimeout(timerFechar.current), []);

  function fechar() {
    if (fechando) return;
    setFechando(true);
    const menosMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    timerFechar.current = window.setTimeout(onFechar, menosMovimento ? 0 : DURACAO_SAIDA_MS);
  }

  // showModal() só existe no elemento real do DOM, por isso roda depois de montar.
  // Depois de abrir, foca o primeiro campo (senão o navegador foca o botão ✕)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, []);

  // o clique no fundo escurecido chega no próprio <dialog>; cliques no conteúdo chegam nos filhos
  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) fechar();
  }

  const classes = ["modal", largo && "modal--largo", fechando && "modal--fechando"].filter(Boolean).join(" ");

  return (
    <dialog
      ref={dialogRef}
      className={classes}
      aria-labelledby={idTitulo}
      onClick={handleClick}
      // Esc dispara "cancel"; o preventDefault deixa o React desmontar o modal em vez do navegador fechá-lo
      onCancel={(event) => {
        event.preventDefault();
        fechar();
      }}
    >
      <div className="modal__conteudo">
        <div className="modal__cabecalho">
          <h2 id={idTitulo} className="modal__titulo">
            {titulo}
          </h2>
          <button
            type="button"
            className="modal__fechar"
            onClick={fechar}
            aria-label="Fechar"
          >
            <IconeFechar />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export default Modal;
