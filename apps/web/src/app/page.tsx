import { Nav } from "@/components/marketing/nav";
import { UrlForm } from "@/components/marketing/url-form";
import { LiveAudit } from "@/components/marketing/live-audit";
import { BrokenFixed } from "@/components/marketing/broken-fixed";
import { Faq } from "@/components/marketing/faq";
import { Reveal } from "@/components/marketing/motion";
import { Buyers, FinalCta, Footer, Heading, HowItWorks, Killers, ProofFacts, ProofStrip, Section, Shopify } from "@/components/marketing/sections";

export default function Home() {
  return (
    <>
      <Nav />

      <main className="flex-1">
        <section id="audit" className="relative scroll-mt-14 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[560px] [background:radial-gradient(50%_60%_at_50%_0%,var(--glow),transparent_70%)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:pb-24">
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <Reveal y={12}>
                <h1 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.04em] text-balance sm:text-[64px] lg:text-[76px]">
                  Watch AI buyers try to buy from your store.
                </h1>
              </Reveal>
              <Reveal delay={0.08} y={12}>
                <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
                  Seven AI buyers shop your store. See where each one stops.
                </p>
              </Reveal>
              <Reveal delay={0.16} y={12} className="mt-8 flex w-full justify-center">
                <UrlForm secondary centered />
              </Reveal>
            </div>
            <Reveal delay={0.24} y={20} className="mx-auto mt-14 max-w-5xl">
              <LiveAudit />
            </Reveal>
          </div>
        </section>

        <ProofFacts />

        <ProofStrip />

        <HowItWorks />

        <Section id="demo" className="border-t border-line bg-surface/50">
          <Heading title="Same buyers. Two stores." lead="Flip the store. Watch the same journeys turn buyable." />
          <Reveal delay={0.1} className="mt-10">
            <BrokenFixed />
          </Reveal>
        </Section>

        <Buyers />

        <Killers />

        <Shopify />

        <Section id="faq" className="border-t border-line">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <Heading title="Questions" />
            <Reveal delay={0.1}>
              <Faq />
            </Reveal>
          </div>
        </Section>

        <FinalCta />
      </main>

      <Footer />
    </>
  );
}
