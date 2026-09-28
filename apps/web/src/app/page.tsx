import { Nav } from "@/components/marketing/nav";
import { UrlForm } from "@/components/marketing/url-form";
import { LiveAudit } from "@/components/marketing/live-audit";
import { BrokenFixed } from "@/components/marketing/broken-fixed";
import { Faq } from "@/components/marketing/faq";
import { Reveal } from "@/components/marketing/motion";
import { Buyers, FinalCta, Footer, Heading, HowItWorks, Killers, ProofStrip, Section, Shopify } from "@/components/marketing/sections";

export default function Home() {
  return (
    <>
      <Nav />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[520px] [background:radial-gradient(60%_50%_at_70%_0%,var(--glow),transparent_70%)]"
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-10 lg:pb-24">
            <div className="max-w-xl">
              <Reveal y={12}>
                <h1 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.04em] text-balance sm:text-[64px] lg:text-[68px]">
                  See where AI buyers give up.
                </h1>
              </Reveal>
              <Reveal delay={0.08} y={12}>
                <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
                  Watchdog shops your store as ChatGPT, Perplexity, Grok, Google and Amazon do, and shows the exact step each one dies on.
                </p>
              </Reveal>
              <Reveal delay={0.16} y={12} className="mt-8">
                <UrlForm secondary />
              </Reveal>
            </div>
            <Reveal delay={0.2} y={20}>
              <LiveAudit />
            </Reveal>
          </div>
        </section>

        <ProofStrip />

        <HowItWorks />

        <Section id="demo" className="border-t border-line bg-surface/50">
          <Heading title="Same buyers. Two stores." lead="The demo store ships with every mistake we found in the wild. Flip it and watch the same journeys turn buyable." />
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
