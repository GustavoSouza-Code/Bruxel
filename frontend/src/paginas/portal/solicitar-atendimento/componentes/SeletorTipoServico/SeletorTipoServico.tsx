import type { ComponentType } from "react";
import type { TipoServico } from "../../../../../tipos/atendimento";
import { TIPOS_SERVICO, TIPO_SERVICO_LABELS } from "../../../../../crud/atendimentos/opcoesAtendimento";
import {
  IconeFerramenta,
  IconeFiltroPiscina,
  IconeGota,
  IconeLimpeza,
  IconeMaisOpcoes,
} from "../../../../../componentes/ui/Icones/Icones";
import "./SeletorTipoServico.css";

// ícone desenhado em cada card
const ICONES: Record<TipoServico, ComponentType> = {
  limpeza: IconeLimpeza,
  "bomba-filtro": IconeFiltroPiscina,
  vazamento: IconeGota,
  instalacao: IconeFerramenta,
  outro: IconeMaisOpcoes,
};

interface SeletorTipoServicoProps {
  valor: TipoServico | null;
  onChange: (tipo: TipoServico) => void;
}

/**
 * Bloco 1 do formulário: um card por tipo de serviço. Por baixo de cada card
 * há um radio, escondido só visualmente: dá pra escolher com Tab + setas e o
 * leitor de tela anuncia como um grupo de opções.
 */
export function SeletorTipoServico({ valor, onChange }: SeletorTipoServicoProps) {
  return (
    <div className="seletor-tipo">
      {TIPOS_SERVICO.map((tipo) => {
        const Icone = ICONES[tipo];
        const ativo = valor === tipo;
        return (
          <label key={tipo} className={`seletor-tipo__card${ativo ? " seletor-tipo__card--ativo" : ""}`}>
            <input
              type="radio"
              name="tipo-servico"
              value={tipo}
              checked={ativo}
              onChange={() => onChange(tipo)}
              className="seletor-tipo__radio"
            />
            <Icone />
            {TIPO_SERVICO_LABELS[tipo]}
          </label>
        );
      })}
    </div>
  );
}

export default SeletorTipoServico;
