/**
 * Cliente HTTP do front: o único lugar que chama o fetch. As funções de
 * api/autenticacao.ts e api/usuarios.ts usam a requisicao() daqui, então
 * endereço da API, JSON, token e tratamento de erro ficam todos num lugar só.
 */

// endereço base da API; vem do frontend/.env (ver .env.example)
const URL_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

/** Erro de validação de um campo, no formato do validaObrigatorios do backend. */
export interface ErroCampo {
  campo: string;
  mensagem: string;
}

/**
 * Erro de uma chamada à API. `status` 0 = a requisição nem chegou no servidor
 * (backend desligado, sem rede); os outros valores são o status HTTP da resposta.
 */
export class ErroApi extends Error {
  status: number;
  /** texto pronto pra mostrar na tela */
  mensagem: string;
  /** erros por campo, quando o backend recusa os dados (status 400) */
  erros?: ErroCampo[];

  constructor(status: number, mensagem: string, erros?: ErroCampo[]) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.mensagem = mensagem;
    this.erros = erros;
  }
}

interface OpcoesRequisicao {
  metodo?: "GET" | "POST" | "PUT" | "DELETE";
  /** objeto enviado como JSON no corpo */
  corpo?: unknown;
  /** JWT do usuário logado; vai no header Authorization */
  token?: string | null;
}

/**
 * Chama a API e devolve o JSON da resposta já com o tipo T. Qualquer falha
 * (sem conexão, status fora de 2xx) vira um ErroApi, então quem chama só
 * precisa de um try/catch.
 */
export async function requisicao<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const { metodo = "GET", corpo, token } = opcoes;

  const headers: Record<string, string> = {};
  if (corpo !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${URL_BASE}${caminho}`, {
      method: metodo,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    // o fetch só lança quando não existe resposta nenhuma (servidor fora do ar, sem rede)
    throw new ErroApi(0, "Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
  }

  // corpo vazio ou que não é JSON (ex.: página HTML de erro do Express) vira null
  const dados: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) throw paraErroApi(resposta.status, dados);
  return dados as T;
}

// monta o ErroApi a partir do corpo de erro do backend: { mensagem, erros? }
function paraErroApi(status: number, dados: unknown): ErroApi {
  if (dados && typeof dados === "object" && "mensagem" in dados) {
    const { mensagem, erros } = dados as { mensagem: string; erros?: unknown };
    const errosCampos = Array.isArray(erros) ? (erros as ErroCampo[]) : undefined;
    // em erro de validação a mensagem é genérica ("Dados inválidos."); as dos campos dizem o que falta
    const texto = errosCampos?.length
      ? errosCampos.map((erro) => erro.mensagem.trim()).join(" ")
      : mensagem;
    return new ErroApi(status, texto, errosCampos);
  }
  return new ErroApi(status, `Erro inesperado (status ${status}).`);
}

/** Texto pra mostrar na tela a partir de qualquer erro pego num catch. */
export function mensagemDeErro(falha: unknown): string {
  return falha instanceof ErroApi ? falha.mensagem : "Algo deu errado. Tente novamente.";
}
