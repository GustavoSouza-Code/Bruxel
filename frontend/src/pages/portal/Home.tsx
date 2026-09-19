import { Header } from "../../components/Header/Header";
import { Hero } from "../../components/Hero/Hero";
import { ProductsSection } from "../../components/ProductsSection/ProductsSection";
import { Faq } from "../../components/Faq/Faq";
import { Testimonials } from "../../components/Testimonials/Testimonials";
import { Footer } from "../../components/Footer/Footer";
import type { Product } from "../../types/product";

import hidrofloc1L from "../../assets/images/produtos/hidroall-hidrofloc-1l.png";
import cadeiraRosa from "../../assets/images/produtos/cadeira-espreguicadeira-rosa.png";
import propool10kg from "../../assets/images/produtos/propool-3em1-10kg.png";
import propool3kg from "../../assets/images/produtos/propool-3em1-3kg.png";
import filtroDancor from "../../assets/images/produtos/filtro-piscina-dancor.png";
import bombaDancor from "../../assets/images/produtos/bomba-piscina-dancor.png";
import guardaSol from "../../assets/images/produtos/guarda-sol-listrado.png";
import hidroallPenta from "../../assets/images/produtos/hidroall-penta-200g.png";
import hiperclor60 from "../../assets/images/produtos/hidroall-hiperclor60-10kg.png";
import kitAlgicidas from "../../assets/images/produtos/hidroall-kit-algicidas.png";
import algicidaChoque from "../../assets/images/produtos/hidroall-algicida-choque-1l.png";
import algicidaManutencao from "../../assets/images/produtos/hidroall-algicida-manutencao-1l.png";
import phMais from "../../assets/images/produtos/hidroall-ph-mais-2kg.png";
import escova from "../../assets/images/produtos/escova-piscina.png";
import peneira from "../../assets/images/produtos/peneira-piscina.png";

// TODO: substituir por dados vindos da API (src/services) quando o backend
// tiver a rota de produtos pronta. Preços abaixo foram tirados do Figma.
const FEATURED_PRODUCTS: Product[] = [
  {
    id: "hidrofloc-1l",
    name: "Hidroall Clarificante Hidrofloc Tripla Ação",
    packageInfo: "1L",
    price: 21.5,
    imageUrl: hidrofloc1L,
  },
  {
    id: "cadeira-espreguicadeira",
    name: "Cadeira Espreguiçadeira em Alumínio Mor",
    price: 395,
    imageUrl: cadeiraRosa,
  },
  {
    id: "propool-10kg",
    name: "Cloro Propool Hidroall 3 em 1",
    packageInfo: "10 KG/3KG/1KG",
    price: 210,
    imageUrl: propool10kg,
  },
  {
    id: "propool-3kg",
    name: "Cloro Propool Hidroall 3 em 1 Multi Função",
    packageInfo: "10 KG/3KG/1KG",
    price: 210,
    imageUrl: propool3kg,
  },
];

// Catálogo maior, pronto pra usar na Loja Virtual (ainda não tem página própria)
export const ALL_PRODUCTS: Product[] = [
  ...FEATURED_PRODUCTS,
  {
    id: "filtro-dancor",
    name: "Filtro de Piscina Dancor",
    price: 0,
    imageUrl: filtroDancor,
  },
  {
    id: "bomba-dancor",
    name: "Motobomba Dancor PM-1/30R",
    price: 0,
    imageUrl: bombaDancor,
  },
  {
    id: "guarda-sol",
    name: "Guarda-sol Listrado",
    price: 0,
    imageUrl: guardaSol,
  },
  {
    id: "hidroall-penta-200g",
    name: "Hidroall HCL Penta 5 Funções",
    packageInfo: "200g",
    price: 0,
    imageUrl: hidroallPenta,
  },
  {
    id: "hiperclor-60",
    name: "Hidroall Hiperclor 60 Dicloro Estabilizado",
    packageInfo: "10kg",
    price: 0,
    imageUrl: hiperclor60,
  },
  {
    id: "kit-algicidas",
    name: "Kit Hidroall Algicidas + Floculante",
    packageInfo: "1L cada",
    price: 0,
    imageUrl: kitAlgicidas,
  },
  {
    id: "algicida-choque",
    name: "Hidroall HCL Algicida de Choque",
    packageInfo: "1L",
    price: 0,
    imageUrl: algicidaChoque,
  },
  {
    id: "algicida-manutencao",
    name: "Hidroall HCL Algicida de Manutenção",
    packageInfo: "1L",
    price: 0,
    imageUrl: algicidaManutencao,
  },
  {
    id: "ph-mais",
    name: "Hidroall Hidro pH+ Barrilha Leve",
    packageInfo: "2kg",
    price: 0,
    imageUrl: phMais,
  },
  {
    id: "escova-piscina",
    name: "Escova para Piscina",
    price: 0,
    imageUrl: escova,
  },
  {
    id: "peneira-piscina",
    name: "Peneira para Piscina",
    price: 0,
    imageUrl: peneira,
  },
];

export function PortalHome() {
  return (
      <>
        <Header />
        <Hero />
        <ProductsSection products={FEATURED_PRODUCTS} />
        <Faq />
        <Testimonials />
        <Footer />
      </>
  );
}

export default PortalHome;
