import { useState } from "react";
import { CHAVE_COBRANCAS, lerCobrancas, registrarCobranca } from "../crud/pagamentos/cobrancasLocais";

// sem localStorage (navegação privada, bloqueado) as cobranças valem só até recarregar
function lerDoNavegador() {
  try {
    return lerCobrancas(localStorage.getItem(CHAVE_COBRANCAS));
  } catch {
    return {};
  }
}

/**
 * "Cobrado em ..." de cada OS, guardado só neste navegador. Serve de lembrete
 * pra quem cobrou não mandar a mesma cobrança duas vezes; outro computador não vê.
 */
export function useCobrancasLocais() {
  const [cobrancas, setCobrancas] = useState<Record<string, string>>(lerDoNavegador);

  function cobradoEm(id: string): string | null {
    return cobrancas[id] ?? null;
  }

  function registrar(id: string) {
    const novas = registrarCobranca(cobrancas, id, new Date());
    setCobrancas(novas);
    try {
      localStorage.setItem(CHAVE_COBRANCAS, JSON.stringify(novas));
    } catch {
      // sem localStorage não há onde salvar
    }
  }

  return { cobradoEm, registrar };
}
