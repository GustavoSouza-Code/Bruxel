import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ErroApi, mensagemDeErro } from "../../../api/cliente";
import { enviarImagemProduto } from "../../../api/produtos";
import { IconeGrade } from "../../../componentes/ui/Icones/Icones";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { TIPOS_IMAGEM_ACEITOS, prepararImagem, validarArquivoImagem } from "../reduzirImagem";

interface CampoImagemProdutoProps {
  /** url da imagem atual do produto; "" = sem imagem */
  url: string;
  /** chamado com a url nova depois do upload, ou com "" quando a imagem é removida */
  onMudar: (url: string) => void;
  /** avisa o formulário quando um envio começa e termina (ele trava o "Salvar" nesse meio tempo) */
  onEnviandoMudar: (enviando: boolean) => void;
}

// erro da API usa a mensagem tratada; erro local (ex.: foto que não abre) já vem com texto pronto
function textoDoErro(falha: unknown): string {
  if (falha instanceof ErroApi) return mensagemDeErro(falha);
  if (falha instanceof Error) return falha.message;
  return mensagemDeErro(falha);
}

/**
 * Campo de imagem do formulário de produto: só por upload (pensado pro celular
 * do dono). Ao escolher a foto, mostra o preview na hora, reduz e envia pra API;
 * se der certo, entrega a url nova em `onMudar`, e se der erro, mantém a url de antes.
 */
export function CampoImagemProduto({ url, onMudar, onEnviandoMudar }: CampoImagemProdutoProps) {
  const { token } = useAutenticacao();
  const entradaArquivo = useRef<HTMLInputElement>(null);
  const [previewLocal, setPreviewLocal] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // url cuja imagem falhou ao carregar; o preview some até a url mudar
  const [urlComErro, setUrlComErro] = useState<string | null>(null);
  // número do envio atual: a resposta de um envio antigo (foto trocada no meio) é descartada
  const envioAtual = useRef(0);
  // false depois que o modal fecha: a resposta que chegar não mexe em nada
  const montado = useRef(false);
  // object URL em uso, pra liberar na desmontagem
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
    // zera o input pra dar pra escolher o mesmo arquivo de novo
    event.target.value = "";
    if (!arquivo) return;

    const problema = validarArquivoImagem(arquivo);
    if (problema) {
      setErro(problema);
      return;
    }
    if (!token) {
      setErro("Sua sessão expirou. Entre novamente.");
      return;
    }

    const numero = ++envioAtual.current;
    if (previewAberto.current) URL.revokeObjectURL(previewAberto.current);
    const preview = URL.createObjectURL(arquivo);
    previewAberto.current = preview;
    setPreviewLocal(preview);
    setErro(null);
    setEnviando(true);
    onEnviandoMudar(true);

    try {
      const pronto = await prepararImagem(arquivo);
      const urlNova = await enviarImagemProduto(token, pronto, pronto.name);
      if (montado.current && numero === envioAtual.current) {
        setErro(null);
        onMudar(urlNova);
      }
    } catch (falha) {
      if (montado.current && numero === envioAtual.current) setErro(textoDoErro(falha));
    } finally {
      // só o envio mais recente mexe no estado; os antigos já foram trocados
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
    <div className="campo-imagem-produto">
      <div className="campo-imagem-produto__area">
        {mostrarImagem ? (
          <img
            className="campo-imagem-produto__preview"
            src={origem}
            alt="Pré-visualização da imagem"
            onError={() => setUrlComErro(origem)}
          />
        ) : (
          <span className="campo-imagem-produto__vazio">
            <IconeGrade />
            Nenhuma imagem
          </span>
        )}
        {/* a região fica sempre na tela: leitor de tela só anuncia texto que muda dentro de uma região já existente */}
        <div
          className={`campo-imagem-produto__enviando${enviando ? " campo-imagem-produto__enviando--ativo" : ""}`}
          aria-live="polite"
        >
          {enviando ? "Enviando imagem…" : ""}
        </div>
      </div>

      <div className="campo-imagem-produto__acoes">
        <button
          type="button"
          className="campo-imagem-produto__escolher"
          onClick={() => entradaArquivo.current?.click()}
        >
          {url ? "Trocar imagem" : "Escolher imagem"}
        </button>
        {url && !enviando && (
          <button
            type="button"
            className="campo-imagem-produto__remover"
            onClick={() => {
              setErro(null);
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

      {erro && (
        <p className="formulario-produto__erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}
