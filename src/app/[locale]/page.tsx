import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Season } from "@/components/Season";
import { InPerson } from "@/components/InPerson";
import { Classes } from "@/components/Classes";
import { Packages } from "@/components/Packages";
import { Additional } from "@/components/Additional";
import { Start } from "@/components/Start";
import { Why } from "@/components/Why";
import { Story } from "@/components/Story";
import { Faq } from "@/components/Faq";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { MobileCta } from "@/components/MobileCta";
import { Espinha } from "@/components/ui/Espinha";
import { faqSchema, schemaToJson } from "@/lib/schema";

// A ordem é a da cliente (roteiro.md, Parte 1). Uma página, revelação progressiva.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main>
        {/* o FAQ marcado só aqui, onde ele aparece (ver `faqSchema`) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaToJson(faqSchema(locale)) }} />
        <Hero />
        <Season />
        <InPerson />
        <Classes />
        <Packages />
        <Additional />
        <Start />
        <Why />
        <Story />
        <Faq />
        <Testimonials />
      </main>
      <Footer />
      <MobileCta />
      {/* a câmera que atravessa as seções: montada depois delas, desenha por cima de todas */}
      <Espinha />
    </>
  );
}
