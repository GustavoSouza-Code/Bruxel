/**
 * Confere se o texto tem o formato de UUID usado pelas chaves do banco.
 * Serve para responder 400/404 antes de o Prisma lançar um erro de validação.
 */
export function ehUuid(valor: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}
