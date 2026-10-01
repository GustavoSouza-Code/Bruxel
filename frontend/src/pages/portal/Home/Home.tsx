import { useNavigate } from "react-router-dom";
import { Header } from "../../../components/layout/Header/Header";
import { Footer } from "../../../components/layout/Footer/Footer";
import { ProductsSection } from "../../../components/product/ProductsSection/ProductsSection";
import { FEATURED_PRODUCTS } from "../../../data/products";
import { Hero } from "./components/Hero/Hero";
import { Faq } from "./components/Faq/Faq";
import { Testimonials } from "./components/Testimonials/Testimonials";

/**
 * Página inicial do portal (rota "/"): reúne as seções na ordem em que
 * aparecem — Hero, produtos em destaque, FAQ e depoimentos.
 */
export function PortalHome() {
  const navigate = useNavigate();

  return (
      <>
        <Header />
        <Hero />
        {/* passar onSeeStore faz o botão "Acessar loja virtual" aparecer e levar pra Loja */}
        <ProductsSection
          products={FEATURED_PRODUCTS}
          onSeeStore={() => navigate("/loja")}
        />
        <Faq />
        <Testimonials />
        <Footer />
      </>
  );
}

export default PortalHome;
