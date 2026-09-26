"use client";

import { useState } from "react";

export function CheckoutForm({ forceLogin }: { forceLogin: boolean }) {
  const [placed, setPlaced] = useState(false);
  if (placed) return <p className="text-green-700 font-medium" data-testid="order-confirmed">Order confirmed. Thank you.</p>;

  if (forceLogin) {
    return (
      <form className="space-y-2 max-w-sm" onSubmit={(e) => e.preventDefault()}>
        <p>Sign in to continue</p>
        <input name="email" placeholder="Email" className="border w-full px-2 py-1" />
        <input name="password" type="password" placeholder="Password" className="border w-full px-2 py-1" />
        <button className="bg-black text-white px-4 py-2">Sign in</button>
      </form>
    );
  }

  return (
    <form
      className="space-y-2 max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setPlaced(true);
      }}
    >
      <input name="name" placeholder="Full name" required className="border w-full px-2 py-1" />
      <input name="email" placeholder="Email" required className="border w-full px-2 py-1" />
      <input name="address" placeholder="Address" required className="border w-full px-2 py-1" />
      <input name="card" placeholder="Card number (4242 4242 4242 4242)" required className="border w-full px-2 py-1" />
      <button type="submit" className="bg-black text-white px-4 py-2" data-testid="place-order">Place order</button>
    </form>
  );
}
