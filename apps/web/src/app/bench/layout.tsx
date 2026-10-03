import type { Metadata } from "next";
import { Beacon } from "./beacon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bench store",
  description: "Benchmark fixture store",
  robots: { index: false, follow: true },
};

export default function BenchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Beacon />
      {children}
    </>
  );
}
