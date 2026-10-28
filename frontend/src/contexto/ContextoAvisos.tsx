import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ContextoAvisos } from "./useAvisos";
import type { Aviso, NovoAviso } from "./useAvisos";
import { PilhaAvisos } from "../componentes/ui/Avisos/Avisos";
import { empilharAviso } from "../componentes/ui/Avisos/filaAvisos";

/**
 * Guarda a fila de avisos (toasts) e dá o avisar() pra qualquer tela, via
 * useAvisos(). Fica dentro do BrowserRouter, porque a ação do aviso é um Link.
 */
export function ProvedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  // contador de ids; useRef porque mudar o número não precisa redesenhar nada
  const proximoId = useRef(1);

  // useCallback: a função é sempre a mesma, então quem usa avisar() num efeito não roda à toa
  const avisar = useCallback((novo: NovoAviso) => {
    const id = proximoId.current++;
    setAvisos((fila) => empilharAviso(fila, { ...novo, id }));
  }, []);

  const remover = useCallback((id: number) => {
    setAvisos((fila) => fila.filter((aviso) => aviso.id !== id));
  }, []);

  const valor = useMemo(() => ({ avisar }), [avisar]);

  return (
    <ContextoAvisos.Provider value={valor}>
      {children}
      <PilhaAvisos avisos={avisos} onRemover={remover} />
    </ContextoAvisos.Provider>
  );
}
