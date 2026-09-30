import type { Product } from "../types/product";

// imagens dos produtos: o Vite empacota cada arquivo e entrega a URL final
import hidrofloc1L from "../assets/images/produtos/hidroall-hidrofloc-1l.png";
import cadeiraRosa from "../assets/images/produtos/cadeira-espreguicadeira-rosa.png";
import propool10kg from "../assets/images/produtos/propool-3em1-10kg.png";
import propool3kg from "../assets/images/produtos/propool-3em1-3kg.png";
import filtroDancor from "../assets/images/produtos/filtro-piscina-dancor.png";
import bombaDancor from "../assets/images/produtos/bomba-piscina-dancor.png";
import guardaSol from "../assets/images/produtos/guarda-sol-listrado.png";
import hidroallPenta from "../assets/images/produtos/hidroall-penta-200g.png";
import hiperclor60 from "../assets/images/produtos/hidroall-hiperclor60-10kg.png";
import kitAlgicidas from "../assets/images/produtos/hidroall-kit-algicidas.png";
import algicidaChoque from "../assets/images/produtos/hidroall-algicida-choque-1l.png";
import algicidaManutencao from "../assets/images/produtos/hidroall-algicida-manutencao-1l.png";
import phMais from "../assets/images/produtos/hidroall-ph-mais-2kg.png";
import escova from "../assets/images/produtos/escova-piscina.png";
import peneira from "../assets/images/produtos/peneira-piscina.png";

/**
 * Produtos em destaque ("mais vendidos"), mostrados na Home. Também são a
 * base do catálogo completo (ALL_PRODUCTS), logo abaixo.
 */
// TODO: substituir por dados vindos da API (src/services) quando o backend
// tiver a rota de produtos pronta. Preços abaixo foram tirados do Figma.
export const FEATURED_PRODUCTS: Product[] = [
  {
    id: "hidrofloc-1l",
    categoria_id: "tratamento-agua",
    codigo: "hidrofloc-1l",
    nome: "Hidroall Clarificante Hidrofloc Tripla Ação 1L",
    preco: 21.5,
    estoque: 0,
    url_imagem: hidrofloc1L,
    ativo: true,
  },
  {
    id: "cadeira-espreguicadeira",
    categoria_id: "acessorios-lazer",
    codigo: "cadeira-espreguicadeira",
    nome: "Cadeira Espreguiçadeira em Alumínio Mor",
    preco: 395,
    estoque: 0,
    url_imagem: cadeiraRosa,
    ativo: true,
  },
  {
    id: "propool-10kg",
    categoria_id: "tratamento-agua",
    codigo: "propool-10kg",
    nome: "Cloro Propool Hidroall 3 em 1 10 KG/3KG/1KG",
    preco: 210,
    estoque: 0,
    url_imagem: propool10kg,
    ativo: true,
  },
  {
    id: "propool-3kg",
    categoria_id: "tratamento-agua",
    codigo: "propool-3kg",
    nome: "Cloro Propool Hidroall 3 em 1 Multi Função 10 KG/3KG/1KG",
    preco: 210,
    estoque: 0,
    url_imagem: propool3kg,
    ativo: true,
  },
];

// Catálogo completo (Loja, Piscinator e Admin usam esta lista)
// obs.: preco: 0 quer dizer "preço ainda a definir" (só os destaques têm preço real)
export const ALL_PRODUCTS: Product[] = [
  ...FEATURED_PRODUCTS,
  {
    id: "filtro-dancor",
    categoria_id: "filtracao-circulacao",
    codigo: "filtro-dancor",
    nome: "Filtro de Piscina Dancor",
    preco: 0,
    estoque: 0,
    url_imagem: filtroDancor,
    ativo: true,
  },
  {
    id: "bomba-dancor",
    categoria_id: "filtracao-circulacao",
    codigo: "bomba-dancor",
    nome: "Motobomba Dancor PM-1/30R",
    preco: 0,
    estoque: 0,
    url_imagem: bombaDancor,
    ativo: true,
  },
  {
    id: "guarda-sol",
    categoria_id: "acessorios-lazer",
    codigo: "guarda-sol",
    nome: "Guarda-sol Listrado",
    preco: 0,
    estoque: 0,
    url_imagem: guardaSol,
    ativo: true,
  },
  {
    id: "hidroall-penta-200g",
    categoria_id: "tratamento-agua",
    codigo: "hidroall-penta-200g",
    nome: "Hidroall HCL Penta 5 Funções 200g",
    preco: 0,
    estoque: 0,
    url_imagem: hidroallPenta,
    ativo: true,
  },
  {
    id: "hiperclor-60",
    categoria_id: "tratamento-agua",
    codigo: "hiperclor-60",
    nome: "Hidroall Hiperclor 60 Dicloro Estabilizado 10kg",
    preco: 0,
    estoque: 0,
    url_imagem: hiperclor60,
    ativo: true,
  },
  {
    id: "kit-algicidas",
    categoria_id: "tratamento-agua",
    codigo: "kit-algicidas",
    nome: "Kit Hidroall Algicidas + Floculante 1L cada",
    preco: 0,
    estoque: 0,
    url_imagem: kitAlgicidas,
    ativo: true,
  },
  {
    id: "algicida-choque",
    categoria_id: "tratamento-agua",
    codigo: "algicida-choque",
    nome: "Hidroall HCL Algicida de Choque 1L",
    preco: 0,
    estoque: 0,
    url_imagem: algicidaChoque,
    ativo: true,
  },
  {
    id: "algicida-manutencao",
    categoria_id: "tratamento-agua",
    codigo: "algicida-manutencao",
    nome: "Hidroall HCL Algicida de Manutenção 1L",
    preco: 0,
    estoque: 0,
    url_imagem: algicidaManutencao,
    ativo: true,
  },
  {
    id: "ph-mais",
    categoria_id: "tratamento-agua",
    codigo: "ph-mais",
    nome: "Hidroall Hidro pH+ Barrilha Leve 2kg",
    preco: 0,
    estoque: 0,
    url_imagem: phMais,
    ativo: true,
  },
  {
    id: "escova-piscina",
    categoria_id: "limpeza-piscina",
    codigo: "escova-piscina",
    nome: "Escova para Piscina",
    preco: 0,
    estoque: 0,
    url_imagem: escova,
    ativo: true,
  },
  {
    id: "peneira-piscina",
    categoria_id: "limpeza-piscina",
    codigo: "peneira-piscina",
    nome: "Peneira para Piscina",
    preco: 0,
    estoque: 0,
    url_imagem: peneira,
    ativo: true,
  },
];
