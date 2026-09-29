import { Header } from "../../../components/layout/Header/Header";
import { AboutHero } from "./components/AboutHero/AboutHero";
import { AboutStory } from "./components/AboutStory/AboutStory";
import { SocialBanner } from "./components/SocialBanner/SocialBanner";
import { Footer } from "../../../components/layout/Footer/Footer";

/**
 * Página "Sobre" (rota "/sobre"): apresenta a história da Bruxel Piscinas
 * e leva o visitante às redes sociais.
 */
export function AboutPage() {
  return (
    <>
      <Header />
      <AboutHero />
      <AboutStory />
      <SocialBanner />
      <Footer />
    </>
  );
}

export default AboutPage;
