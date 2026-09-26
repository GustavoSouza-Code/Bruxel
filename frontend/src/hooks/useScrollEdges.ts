import { useEffect, useState, type RefObject } from "react";

type ScrollEdges = {
  canScrollLeft: boolean;
  canScrollRight: boolean;
};

/**
 * Observa um elemento com rolagem horizontal e informa se ainda há
 * conteúdo escondido à esquerda e/ou à direita.
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>): ScrollEdges {
  const [edges, setEdges] = useState<ScrollEdges>({
    canScrollLeft: false,
    canScrollRight: false,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      setEdges({
        canScrollLeft: el.scrollLeft > 1,
        canScrollRight: el.scrollLeft < maxScroll - 1,
      });
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [ref]);

  return edges;
}
