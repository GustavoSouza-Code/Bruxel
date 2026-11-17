/** Uma área do painel na lista lateral (os ícones ficam no LateralAdmin.tsx, pelo id). */
export interface ItemLateral {
  id: string;
  titulo: string;
  rota: string;
}

// pra uma área nova aparecer na lateral, é só adicionar um item (e o ícone dele)
export const ITENS_LATERAL: ItemLateral[] = [
  { id: "inicio", titulo: "Início", rota: "/admin" },
  { id: "atendimentos", titulo: "Atendimentos", rota: "/admin/atendimentos" },
  { id: "pedidos", titulo: "Pedidos", rota: "/admin/pedidos" },
  { id: "pagamentos", titulo: "Pagamentos", rota: "/admin/pagamentos" },
  { id: "produtos", titulo: "Produtos", rota: "/admin/produtos" },
  { id: "clientes", titulo: "Clientes", rota: "/admin/usuarios" },
];

/**
 * Qual item da lateral fica aceso no endereço atual. O Início só no "/admin"
 * exato; as outras áreas também nas páginas de dentro delas
 * ("/admin/atendimentos/123" acende Atendimentos).
 */
export function itemAtivo(pathname: string): string | null {
  const caminho = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const item = ITENS_LATERAL.find((i) =>
    i.rota === "/admin" ? caminho === i.rota : caminho === i.rota || caminho.startsWith(`${i.rota}/`),
  );
  return item?.id ?? null;
}
