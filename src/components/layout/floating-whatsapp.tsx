"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function FloatingWhatsApp() {
  const pathname = usePathname();

  // Route Protection: Keep admin dashboard views clean
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const defaultMessage = "আসসালামু আলাইকুম, আমি সান্নাহ সোর্স থেকে তথ্য জানতে চাচ্ছি।";
  const whatsappUrl = `https://wa.me/8801914612007?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div
      className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 pointer-events-auto"
      role="complementary"
      aria-label="WhatsApp গ্রাহক সেবা"
    >
      {/* Tooltip greeting badge on Desktop */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-xs shadow-card border border-surface-border text-charcoal-800 text-xs font-bold font-bengali hover:text-[#25D366] hover:border-[#25D366]/40 transition-all cursor-pointer group"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span>WhatsApp চ্যাট</span>
      </a>

      {/* Circular Floating WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp-এ সরাসরি মেসেজ দিন"
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group relative cursor-pointer"
      >
        {/* Gentle pulse wave effect */}
        <span className="absolute inset-0 rounded-full bg-[#25D366]/30 animate-ping pointer-events-none" />

        {/* Official WhatsApp SVG Icon */}
        <svg
          className="w-7 h-7 fill-white transition-transform group-hover:scale-110"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.16C10.57 20.16 9.12 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.05 20.16ZM16.57 14.39C16.32 14.27 15.11 13.67 14.88 13.58C14.66 13.5 14.5 13.46 14.33 13.7C14.17 13.95 13.71 14.49 13.57 14.65C13.43 14.81 13.29 14.83 13.04 14.71C12.8 14.59 12.01 14.33 11.08 13.5C10.36 12.85 9.87 12.05 9.73 11.8C9.59 11.55 9.71 11.42 9.84 11.3C9.95 11.19 10.08 11.01 10.21 10.87C10.33 10.72 10.37 10.62 10.45 10.46C10.53 10.29 10.49 10.15 10.43 10.03C10.37 9.91 9.87 8.68 9.67 8.18C9.47 7.69 9.27 7.76 9.12 7.75C8.98 7.74 8.81 7.74 8.65 7.74C8.48 7.74 8.22 7.8 7.99 8.05C7.77 8.29 7.15 8.87 7.15 10.05C7.15 11.23 8.01 12.37 8.13 12.53C8.25 12.69 9.83 15.12 12.25 16.16C12.83 16.41 13.28 16.56 13.63 16.67C14.21 16.85 14.74 16.83 15.16 16.76C15.63 16.69 16.61 16.17 16.81 15.6C17.02 15.02 17.02 14.53 16.96 14.43C16.89 14.33 16.82 14.51 16.57 14.39Z" />
        </svg>
      </a>
    </div>
  );
}
