import { LanguageProvider } from "@/contexts/LanguageContext";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { UniqueFeatures } from "@/components/landing/UniqueFeatures";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <LanguageProvider>
      <main
        className="min-h-screen w-full mx-auto"
        style={{ backgroundColor: "var(--color-bg)", maxWidth: "390px" }}
      >
        <Header />
        <Hero />
        <FeatureGrid />
        <UniqueFeatures />
        <Footer />
      </main>
    </LanguageProvider>
  );
};

export default Index;
