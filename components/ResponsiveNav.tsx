'use client';

import { useState } from 'react';

export default function ResponsiveNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="p-4 border-b flex justify-between items-center">
      {/* ブランドロゴ */}
      <span data-testid="brand-logo" className="font-bold text-lg">
        My App
      </span>

      {/* デスクトップ表示 */}
      <ul className="hidden md:flex gap-4" data-testid="desktop-nav">
        <li>Home</li>
        <li>About</li>
        <li>Contact</li>
      </ul>

      {/* モバイル表示 */}
      <div className="md:hidden" data-testid="mobile-nav">
        <button data-testid="hamburger" onClick={() => setOpen((o) => !o)} className="p-2 border rounded">
          ☰
        </button>
        {open && (
          <ul className="absolute top-12 left-0 bg-white border w-full p-4 space-y-2" data-testid="mobile-menu">
            <li>Home</li>
            <li>About</li>
            <li>Contact</li>
          </ul>
        )}
      </div>
    </nav>
  );
}
