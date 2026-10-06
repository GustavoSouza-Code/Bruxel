/**
 * Endereço base do backend. server.ts registra as rotas sob /api e sobe em
 * http://localhost:3000 (ver README.md).
 */
export const API_BASE_URL = "http://localhost:3000/api";

/**
 * Erro lançado quando o backend responde com status de erro (4xx/5xx) ou
 * quando o fetch nem chega a completar (backend fora do ar, CORS, etc.).
 * `errors` carrega a lista de validação quando o backend manda
 * `{ erros: [...] }` (ver userController.ts / productsController.ts).
 */
export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** token JWT, quando a rota exige login (ver middleware/verificaToken.ts) */
  token?: string;
}

/**
 * Wrapper fino sobre fetch: monta a URL completa, serializa o body em
 * JSON, anexa o header Authorization quando há token, e converte
 * respostas de erro do backend em ApiError — assim quem chama não
 * precisa checar `response.ok` toda vez.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch falhou antes de chegar no servidor: backend fora do ar, porta
    // errada, ou bloqueio de CORS
    throw new ApiError(
      "Não foi possível conectar ao servidor. Verifique se o backend está rodando.",
      0
    );
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const mensagem = data?.mensagem ?? "Erro ao comunicar com o servidor.";
    throw new ApiError(mensagem, response.status, data?.erros);
  }

  return data as T;
}
