import { useEffect, useRef } from "react";
import type { MouseEvent, ReactNode } from "react";
import "./Modal.css";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Janela modal sobre a página, feita com o <dialog> nativo: o navegador já
 * escurece o fundo, prende o foco dentro dela e fecha com Esc. Quem usa
 * decide se ela existe renderizando condicionalmente ({aberto && <Modal />}).
 */
export function Modal({ title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="modal-title"
      onClick={handleClick}
      // Esc dispara "cancel"; o preventDefault deixa o React desmontar o modal em vez do navegador fechá-lo
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal__content">
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export default Modal;
