import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { MAX_FOTOS, validarFotos } from "../../../../../crud/atendimentos/validarSolicitacao";
import { IconeFechar, IconeMais } from "../../../../../componentes/ui/Icones/Icones";
import "./CampoFotos.css";

/** Uma foto escolhida: o arquivo e a URL temporária (blob:) da miniatura. */
export interface FotoSelecionada {
  id: string;
  arquivo: File;
  url: string;
}

interface CampoFotosProps {
  fotos: FotoSelecionada[];
  onChange: (fotos: FotoSelecionada[]) => void;
}

/**
 * Bloco "Fotos do problema": miniaturas das fotos escolhidas e um quadrado "+"
 * que abre o seletor de arquivos. As fotos ficam só no navegador
 * (URL.createObjectURL) até o backend ter onde guardar.
 */
export function CampoFotos({ fotos, onChange }: CampoFotosProps) {
  // por que alguma foto ficou de fora (não é imagem, grande demais, passou do limite)
  const [erro, setErro] = useState<string | null>(null);
  // número do id da próxima foto (crypto.randomUUID só existe em HTTPS ou localhost)
  const proximoIdRef = useRef(0);

  function adicionar(evento: ChangeEvent<HTMLInputElement>) {
    const escolhidos = Array.from(evento.target.files ?? []);
    // zera o input: sem isso, escolher de novo a mesma foto (depois de remover) não dispara o onChange
    evento.target.value = "";

    const { aceitas, erro: motivo } = validarFotos(fotos.length, escolhidos);
    setErro(motivo);
    if (aceitas.length === 0) return;

    const novas = aceitas.map((arquivo) => ({
      id: `foto-${++proximoIdRef.current}`,
      arquivo,
      url: URL.createObjectURL(arquivo),
    }));
    onChange([...fotos, ...novas]);
  }

  function remover(foto: FotoSelecionada) {
    // a miniatura sai da tela, então a URL temporária pode ser liberada da memória
    URL.revokeObjectURL(foto.url);
    setErro(null);
    onChange(fotos.filter((atual) => atual.id !== foto.id));
  }

  return (
    <div className="campo-fotos">
      <ul className="campo-fotos__lista">
        {fotos.map((foto, indice) => (
          <li key={foto.id} className="campo-fotos__item">
            <img src={foto.url} alt={`Foto ${indice + 1} do problema`} className="campo-fotos__miniatura" />
            <button
              type="button"
              className="campo-fotos__remover"
              onClick={() => remover(foto)}
              aria-label={`Remover foto ${indice + 1}`}
            >
              <IconeFechar />
            </button>
          </li>
        ))}
        {/* o "+" some quando chega no limite */}
        {fotos.length < MAX_FOTOS && (
          <li>
            <label className="campo-fotos__adicionar">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={adicionar}
                className="campo-fotos__input"
              />
              <IconeMais />
              <span>Adicionar</span>
            </label>
          </li>
        )}
      </ul>
      <p className="campo-fotos__dica">Até {MAX_FOTOS} fotos, de até 5 MB cada.</p>
      {erro && (
        <p className="campo-fotos__erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

export default CampoFotos;
