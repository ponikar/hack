import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8 space-y-4">
      <h1 className="text-2xl font-semibold">AI Buyer Watchdog</h1>
      <p>Uptime monitoring, but for AI buyers.</p>
      <ul className="list-disc pl-6">
        <li><Link className="underline" href="/dashboard">Dashboard</Link></li>
        <li><Link className="underline" href="/store?mode=broken">Demo store (broken)</Link></li>
        <li><Link className="underline" href="/store?mode=fixed">Demo store (fixed)</Link></li>
      </ul>
    </main>
  );
}
