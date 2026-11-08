"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { TWIN_PROMOS } from "./hero-section";

export function MobilePromoBanners() {
  return (
    <section
      aria-label="অফার ব্যানার"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:hidden font-bengali w-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {TWIN_PROMOS.map((promo) => (
          <Link
            key={promo.id}
            href={promo.link}
            prefetch={true}
            draggable={false}
            aria-label={promo.alt}
            className="group relative w-full rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 border border-stone-200/80 hover:border-emerald-500/40 aspect-[21/9] sm:aspect-[16/7] block bg-stone-900"
          >
            <Image
              src={promo.image}
              alt={promo.alt}
              fill
              draggable={false}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 34vw"
              className="object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}

