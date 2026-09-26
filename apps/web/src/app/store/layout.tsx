import Link from "next/link";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b p-4 flex gap-4">
        <Link href="/store">Home</Link>
        <Link href="/store/cart">Cart</Link>
      </header>
      {children}
    </div>
  );
}
