import { useNavigate } from "react-router-dom";
import { Header } from "../../../components/layout/Header/Header";
import { Footer } from "../../../components/layout/Footer/Footer";
import { ProductsSection } from "../../../components/product/ProductsSection/ProductsSection";
import { FEATURED_PRODUCTS } from "../../../data/products";
import { Hero } from "./components/Hero/Hero";
import { Faq } from "./components/Faq/Faq";
import { Testimonials } from "./components/Testimonials/Testimonials";

export function PortalHome() {
  const navigate = useNavigate();

  return (
      <>
        <Header />
        <Hero />
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
