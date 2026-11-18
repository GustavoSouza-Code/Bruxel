export type NivelDiagnostico = "bom" | "leve" | "moderado" | "grave";

export interface Diagnostico {
  nivel: NivelDiagnostico;
  titulo: string;
  descricao: string;
}

/**
 * Converte a pontuação (nº de respostas "Sim", de 0 a 8) no diagnóstico:
 * 0 = tudo certo, 1-2 = sinais leves, 3-4 = moderado, 5 ou mais = grave.
 */
export function diagnosticoPorPontuacao(pontuacao: number): Diagnostico {
  if (pontuacao <= 0) {
    return {
      nivel: "bom",
      titulo: "Sua piscina está em bom estado!",
      descricao:
        "Não identificamos sinais de alerta. Continue com a manutenção regular e o monitoramento do cloro e do pH para manter a água sempre equilibrada.",
    };
  }

  if (pontuacao <= 2) {
    return {
      nivel: "leve",
      titulo: "Sinais leves de desequilíbrio",
      descricao:
        "Sua piscina apresenta sinais leves de desequilíbrio na água. Um ajuste no tratamento e uma limpeza pontual já devem resolver o problema.",
    };
  }

  if (pontuacao <= 4) {
    return {
      nivel: "moderado",
      titulo: "Desequilíbrio moderado identificado",
      descricao:
        "Sua piscina apresenta desequilíbrio moderado, com possível presença de algas ou cloro insuficiente. Recomendamos um choque de cloro e reforço na filtração.",
    };
  }

  return {
    nivel: "grave",
    titulo: "Forte presença de algas e sujeira",
    descricao:
      "Sua piscina apresenta forte presença de algas e acúmulo de sujeira na água. Recomendamos um tratamento de choque completo, seguido de manutenção preventiva regular.",
  };
}
