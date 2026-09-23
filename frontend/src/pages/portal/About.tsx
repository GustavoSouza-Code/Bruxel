import { Header } from "../../components/Header/Header";
import { AboutHero } from "../../components/AboutHero/AboutHero";
import { AboutStory } from "../../components/AboutStory/AboutStory";
import { SocialBanner } from "../../components/SocialBanner/SocialBanner";
import { Footer } from "../../components/Footer/Footer";

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
