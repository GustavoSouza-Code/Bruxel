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

// Quem trata a sessão vencida. O ProvedorAutenticacao registra aqui o sair() ao
// montar, assim qualquer 401 de uma rota protegida desloga em um lugar só, sem
// cada hook repetir essa checagem.
let aoSessaoExpirar: (() => void) | null = null;

/**
 * Registra a função chamada quando uma requisição COM token volta 401 (token
 * vencido ou usuário apagado). Devolve a função que desfaz o registro.
 */
export function registrarSessaoExpirada(funcao: () => void): () => void {
  aoSessaoExpirar = funcao;
  return () => {
    if (aoSessaoExpirar === funcao) aoSessaoExpirar = null;
  };
}

interface OpcoesRequisicao {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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

  if (!resposta.ok) {
    // só conta como sessão vencida se mandamos token; 401 do login (sem token) é credencial errada
    if (resposta.status === 401 && token) aoSessaoExpirar?.();
    throw paraErroApi(resposta.status, dados);
  }
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
  return new ErroApi(status, mensagemPadrao(status));
}

// texto pra quando o servidor não mandou um corpo { mensagem } (ex.: página HTML de erro, proxy fora do ar)
function mensagemPadrao(status: number): string {
  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 403) return "Você não tem permissão para fazer isso.";
  if (status === 404) return "Não encontramos o que você procurava.";
  if (status === 409) return "Essa informação conflita com um registro que já existe.";
  if (status >= 500) return "O servidor está com problemas. Tente novamente em instantes.";
  return `Erro inesperado (status ${status}).`;
}

/** Texto pra mostrar na tela a partir de qualquer erro pego num catch. */
export function mensagemDeErro(falha: unknown): string {
  return falha instanceof ErroApi ? falha.mensagem : "Algo deu errado. Tente novamente.";
}

/**
 * Mensagens por campo de um erro de validação (400), pra destacar cada input.
 * Ex.: { email: "O E-mail é obrigatório." }. Qualquer outro erro devolve {}.
 */
export function errosPorCampo(falha: unknown): Record<string, string> {
  const resultado: Record<string, string> = {};
  if (!(falha instanceof ErroApi) || !falha.erros) return resultado;
  for (const { campo, mensagem } of falha.erros) {
    // se o mesmo campo falhar duas vezes, vale a primeira mensagem
    if (campo && !(campo in resultado)) resultado[campo] = mensagem.trim();
  }
  return resultado;
}
