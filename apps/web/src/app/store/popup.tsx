"use client";

import { useState } from "react";

export function NewsletterPopup() {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-80 space-y-3">
        <h2 className="font-semibold">Get 10% off</h2>
        <input placeholder="Email" className="border w-full px-2 py-1" />
        <button className="bg-black text-white px-3 py-1 w-full">Subscribe</button>
        <button onClick={() => setOpen(false)} aria-label="close" className="text-xs opacity-0">×</button>
      </div>
    </div>
  );
}
