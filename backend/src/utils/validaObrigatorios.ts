export interface regraValidacao {
    campo: string;
    mensagem: string;
}

interface erroValidacao {
    campo: string;
    mensagem: string;
}

export function validarCamposObrigatorios(
    dados: Record<string, any>,
    regras: regraValidacao[]
): erroValidacao[] {
    const erros: erroValidacao[] = [];

    for (const regra of regras) {
        const valor = dados[regra.campo];

        const estaVazio =
            valor === undefined ||
            valor === null ||
            (typeof valor === 'string' && valor.trim() === '') ||
            (Array.isArray(valor) && valor.length === 0);

        if (estaVazio) {
            erros.push({
                campo: regra.campo,
                mensagem: regra.mensagem,
            });
        }
    }

    return erros;
}