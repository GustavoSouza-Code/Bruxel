import { useNavigate } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { SecaoProdutos } from "../../../componentes/produto/SecaoProdutos/SecaoProdutos";
import { PRODUTOS_DESTAQUE } from "../../../dados/produtos";
import { BannerInicio } from "./componentes/BannerInicio/BannerInicio";
import { Faq } from "./componentes/Faq/Faq";
import { Depoimentos } from "./componentes/Depoimentos/Depoimentos";

/**
 * Página inicial do portal (rota "/"): reúne as seções na ordem em que
 * aparecem — BannerInicio, produtos em destaque, FAQ e depoimentos.
 */
export function PaginaInicio() {
  const navigate = useNavigate();

  return (
      <>
        <Cabecalho />
        <BannerInicio />
        {/* passar onSeeStore faz o botão "Acessar loja virtual" aparecer e levar pra Loja */}
        <SecaoProdutos
          produtos={PRODUTOS_DESTAQUE}
          onVerLoja={() => navigate("/loja")}
        />
        <Faq />
        <Depoimentos />
        <Rodape />
      </>
  );
}

export default PaginaInicio;
