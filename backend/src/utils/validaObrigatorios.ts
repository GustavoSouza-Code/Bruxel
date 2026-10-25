export interface RegraValidacao {
    campo: string;
    mensagem: string;
}

export interface ErroValidacao {
    campo: string;
    mensagem: string;
}

// devolve os campos ausentes ou vazios para o service montar o erro 400
export function validarCamposObrigatorios(
    dados: object,
    regras: RegraValidacao[]
): ErroValidacao[] {
    const valores = dados as Record<string, unknown>;
    const erros: ErroValidacao[] = [];

    for (const regra of regras) {
        const valor = valores[regra.campo];

        const estaVazio =
            valor === undefined ||
            valor === null ||
            (typeof valor === "string" && valor.trim() === "") ||
            (Array.isArray(valor) && valor.length === 0);

        if (estaVazio) {
            erros.push({ campo: regra.campo, mensagem: regra.mensagem });
        }
    }

    return erros;
}
