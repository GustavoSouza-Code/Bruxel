/**
 * Confere se o texto tem o formato de UUID usado pelas chaves do banco.
 * Serve para responder 400/404 antes de o Prisma lançar um erro de validação.
 */
export function ehUuid(valor: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

// formato básico de e-mail; o cliente ainda pode fazer validações mais rígidas
export function ehEmail(valor: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}