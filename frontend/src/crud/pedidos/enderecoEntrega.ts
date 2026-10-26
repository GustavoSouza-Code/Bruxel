import type { Usuario } from "../../tipos/usuario";
import { formatarEndereco } from "../usuarios/camposUsuario";

/**
 * Texto do endereço de entrega a partir do endereço do perfil, pra já vir
 * preenchido no fechamento da compra. O pedido guarda o endereço como texto
 * livre, então o CEP vai no fim, com hífen. Sem endereço devolve "".
 */
export function enderecoDeEntrega(endereco: Pick<Usuario, "rua" | "numero" | "bairro" | "cidade" | "estado" | "cep">) {
  const cep = endereco.cep ? `CEP ${endereco.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}` : "";
  return [formatarEndereco(endereco), cep].filter(Boolean).join(" - ");
}
