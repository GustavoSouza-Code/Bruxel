import { useNavigate } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { SecaoProdutos } from "../../../componentes/produto/SecaoProdutos/SecaoProdutos";
import { useCatalogo } from "../../../crud/produtos/useCatalogo";
import { produtosEmDestaque } from "../../../crud/produtos/selecaoProdutos";
import { BannerInicio } from "./componentes/BannerInicio/BannerInicio";
import { Faq } from "./componentes/Faq/Faq";
import { Depoimentos } from "./componentes/Depoimentos/Depoimentos";

/**
 * Página inicial do portal (rota "/"): reúne as seções na ordem em que
 * aparecem — BannerInicio, produtos em destaque, FAQ e depoimentos.
 */
export function PaginaInicio() {
  const navigate = useNavigate();
  const { produtos, erro } = useCatalogo();
  // com erro a lista pode ser a antiga; sem destaques a seção some
  const destaques = erro ? [] : produtosEmDestaque(produtos);

  return (
      <>
        <Cabecalho />
        <BannerInicio />
        {/* passar onSeeStore faz o botão "Acessar loja virtual" aparecer e levar pra Loja */}
        {destaques.length > 0 && (
          <SecaoProdutos
            produtos={destaques}
            onVerLoja={() => navigate("/loja")}
          />
        )}
        <Faq />
        <Depoimentos />
        <Rodape />
      </>
  );
}

export default PaginaInicio;
