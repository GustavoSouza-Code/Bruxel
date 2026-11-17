import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ErroApi, mensagemDeErro } from "../../../../../api/cliente";
import { enviarImagemAtendimento } from "../../../../../api/atendimentos";
import { IconeGrade } from "../../../../../componentes/ui/Icones/Icones";
import { useAutenticacao } from "../../../../../contexto/useAutenticacao";
import { TIPOS_IMAGEM_ACEITOS, prepararImagem, validarArquivoImagem } from "../../../../../crud/produtos/reduzirImagem";
import "./CampoImagemAtendimento.css";

interface CampoImagemAtendimentoProps {
  /** url da foto atual da OS; "" = sem foto */
  url: string;
  /** chamado com a url nova depois do upload, ou com "" quando a foto é removida */
  onMudar: (url: string) => void;
  /** avisa o formulário quando um envio começa e termina */
  onEnviandoMudar: (enviando: boolean) => void;
  /** erro de validação do formulário para este campo */
  erro?: string;
}

function textoDoErro(falha: unknown): string {
  if (falha instanceof ErroApi) return mensagemDeErro(falha);
  if (falha instanceof Error) return falha.message;
  return mensagemDeErro(falha);
}

/**
 * Foto do problema da OS: só por upload. Mostra a prévia na hora, reduz a
 * imagem no navegador antes de enviar e entrega a URL gerada pelo backend.
 */
export function CampoImagemAtendimento({
  url,
  onMudar,
  onEnviandoMudar,
  erro,
}: CampoImagemAtendimentoProps) {
  const { token } = useAutenticacao();
  const entradaArquivo = useRef<HTMLInputElement>(null);
  const [previewLocal, setPreviewLocal] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  // url cuja imagem falhou ao carregar; a prévia some até a url mudar
  const [urlComErro, setUrlComErro] = useState<string | null>(null);
  // resposta de um envio antigo é descartada se a pessoa trocar a foto no meio
  const envioAtual = useRef(0);
  const montado = useRef(false);
  const previewAberto = useRef<string | null>(null);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      if (previewAberto.current) URL.revokeObjectURL(previewAberto.current);
    };
  }, []);

  async function escolherArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";
    if (!arquivo) return;

    const problema = validarArquivoImagem(arquivo);
    if (problema) {
      setErroLocal(problema);
      return;
    }
    if (!token) {
      setErroLocal("Sua sessão expirou. Entre novamente.");
      return;
    }

    const numero = ++envioAtual.current;
    if (previewAberto.current) URL.revokeObjectURL(previewAberto.current);
    const preview = URL.createObjectURL(arquivo);
    previewAberto.current = preview;
    setPreviewLocal(preview);
    setErroLocal(null);
    setEnviando(true);
    onEnviandoMudar(true);

    try {
      const pronto = await prepararImagem(arquivo);
      const urlNova = await enviarImagemAtendimento(token, pronto, pronto.name);
      if (montado.current && numero === envioAtual.current) {
        onMudar(urlNova);
      }
    } catch (falha) {
      if (montado.current && numero === envioAtual.current) setErroLocal(textoDoErro(falha));
    } finally {
      if (montado.current && numero === envioAtual.current) {
        onEnviandoMudar(false);
        setEnviando(false);
        URL.revokeObjectURL(preview);
        previewAberto.current = null;
        setPreviewLocal(null);
      }
    }
  }

  const origem = previewLocal ?? url;
  const mostrarImagem = origem !== "" && origem !== urlComErro;

  return (
    <div className="campo-imagem-atendimento">
      <div className="campo-imagem-atendimento__area">
        {mostrarImagem ? (
          <img
            className="campo-imagem-atendimento__preview"
            src={origem}
            alt="Pré-visualização da foto do problema"
            onError={() => setUrlComErro(origem)}
          />
        ) : (
          <span className="campo-imagem-atendimento__vazio">
            <IconeGrade />
            Nenhuma imagem
          </span>
        )}
        <div
          className={`campo-imagem-atendimento__enviando${
            enviando ? " campo-imagem-atendimento__enviando--ativo" : ""
          }`}
          aria-live="polite"
        >
          {enviando ? "Enviando imagem…" : ""}
        </div>
      </div>

      <div className="campo-imagem-atendimento__acoes">
        <button
          type="button"
          className="campo-imagem-atendimento__escolher"
          onClick={() => entradaArquivo.current?.click()}
        >
          {url ? "Trocar imagem" : "Escolher imagem"}
        </button>
        {url && !enviando && (
          <button
            type="button"
            className="campo-imagem-atendimento__remover"
            onClick={() => {
              setErroLocal(null);
              onMudar("");
            }}
          >
            Remover imagem
          </button>
        )}
      </div>

      <input
        ref={entradaArquivo}
        type="file"
        accept={TIPOS_IMAGEM_ACEITOS.join(",")}
        hidden
        onChange={escolherArquivo}
      />

      {erroLocal && (
        <p className="pagina-atendimento__erro" role="alert">
          {erroLocal}
        </p>
      )}
      {erro && (
        <p className="pagina-atendimento__erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

export default CampoImagemAtendimento;
