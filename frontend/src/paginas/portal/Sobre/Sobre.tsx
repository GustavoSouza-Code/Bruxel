import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { BannerSobre } from "./componentes/BannerSobre/BannerSobre";
import { HistoriaSobre } from "./componentes/HistoriaSobre/HistoriaSobre";
import { BannerSocial } from "./componentes/BannerSocial/BannerSocial";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";

/**
 * Página "Sobre" (rota "/sobre"): apresenta a história da Bruxel Piscinas
 * e leva o visitante às redes sociais.
 */
export function PaginaSobre() {
  return (
    <>
      <Cabecalho />
      <BannerSobre />
      <HistoriaSobre />
      <BannerSocial />
      <Rodape />
    </>
  );
}

export default PaginaSobre;
