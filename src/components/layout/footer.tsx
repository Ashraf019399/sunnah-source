import React from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Facebook, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.979-.276-.1-.477-.15-.678.15-.2.3-.778.979-.954 1.18-.176.2-.351.226-.652.076-.301-.15-1.272-.469-2.424-1.497-.896-.8-1.501-1.787-1.677-2.088-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.101-.2.05-.376-.025-.527-.075-.15-.678-1.634-.929-2.238-.244-.588-.493-.509-.678-.518l-.578-.01c-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.511c0 1.481 1.079 2.91 1.23 3.111.15.201 2.122 3.24 5.141 4.544.718.31 1.279.495 1.716.634.721.23 1.377.197 1.895.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.076-.126-.277-.201-.578-.352zm-5.464 7.428c-1.802 0-3.568-.485-5.122-1.405l-.367-.218-3.805 1 1.016-3.71-.24-.381c-1.01-1.607-1.544-3.468-1.544-5.385 0-5.632 4.582-10.214 10.218-10.214 2.73 0 5.295 1.064 7.225 2.996 1.93 1.932 2.992 4.498 2.99 7.228-.002 5.633-4.584 10.216-10.217 10.216zm8.655-18.871c-2.313-2.251-5.388-3.489-8.655-3.489-6.734 0-12.213 5.479-12.216 12.216 0 2.152.562 4.25 1.63 6.102l-1.732 6.326 6.471-1.698c1.782.972 3.791 1.486 5.842 1.487h.005c6.732 0 12.213-5.48 12.216-12.217 0-3.264-1.27-6.333-3.561-8.727z" />
  </svg>
);

export const Footer: React.FC = () => {
  return (
    <footer
      role="contentinfo"
      aria-label="Site Footer"
      className="bg-brand-900 text-stone-300 pt-10 pb-20 lg:pt-12 lg:pb-10 border-t border-brand-800/90"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 pb-8 border-b border-brand-800/80">
          {/* Column 1: Brand */}
          <div className="lg:col-span-4 space-y-3.5">
            <BrandLogo className="bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl shadow-subtle hover:bg-stone-50 transition-all [&_img]:h-10 sm:[&_img]:h-11 md:[&_img]:h-12 [&_img]:w-auto w-fit" />
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-sm">
              Pure & natural organic food inspired by prophetic traditions. 100% authentic, lab-tested, and wholesome nutrition for your family.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-accent-amber font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>100% Pure & Authentic Guaranteed</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-white font-bold text-sm tracking-wide">Quick Links</h4>
            <nav aria-label="Quick Links">
              <ul className="space-y-2.5 text-xs sm:text-sm text-stone-300">
                <li>
                  <Link
                    href="/"
                    className="hover:text-white hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/shop"
                    className="hover:text-white hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    Shop Collection
                  </Link>
                </li>
                <li>
                  <Link
                    href="/track-order"
                    className="hover:text-white hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    Order Tracking
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account"
                    className="hover:text-white hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    My Account
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 3: Customer Care */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-white font-bold text-sm tracking-wide">Customer Care</h4>
            <nav aria-label="Customer Care">
              <ul className="space-y-2.5 text-xs sm:text-sm text-stone-300">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-white hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-white hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    Shipping & Returns
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-white hover:translate-x-0.5 transition-all duration-200 inline-block"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 4: Get in Touch */}
          <div className="lg:col-span-3 space-y-3.5">
            <h4 className="text-white font-bold text-sm tracking-wide">Get in Touch</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-stone-300">
              <li className="flex items-center gap-2.5 text-stone-300 group">
                <span className="w-7 h-7 rounded-lg bg-brand-800/80 border border-brand-700/60 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 group-hover:bg-brand-700/80 transition-colors shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                </span>
                <span>Lalmonirhat, Bangladesh</span>
              </li>
              <li>
                <a
                  href="https://wa.me/8801914612007"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-stone-300 hover:text-white transition-colors group"
                  aria-label="WhatsApp: +880 1914-612007"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-800/80 border border-brand-700/60 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 group-hover:bg-brand-700/80 transition-colors shrink-0">
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  </span>
                  <span className="font-sans font-medium tracking-wide">+880 1914-612007</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:sunnahsourcebd@gmail.com"
                  className="inline-flex items-center gap-2.5 text-stone-300 hover:text-white transition-colors group"
                  aria-label="Email: sunnahsourcebd@gmail.com"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-800/80 border border-brand-700/60 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 group-hover:bg-brand-700/80 transition-colors shrink-0">
                    <Mail className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  </span>
                  <span className="font-sans text-xs break-all">sunnahsourcebd@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61572120171387"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-stone-300 hover:text-white transition-colors group"
                  aria-label="Official Facebook Page"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand-800/80 border border-brand-700/60 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 group-hover:bg-brand-700/80 transition-colors shrink-0">
                    <Facebook className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  </span>
                  <span>Official Facebook</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 text-center text-xs text-stone-400">
          <p>© 2026 SUNNAH SOURCE. All rights reserved. Pure & Natural Organic Foods.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
