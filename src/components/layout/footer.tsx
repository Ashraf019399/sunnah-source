import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

export const Footer: React.FC = () => {
  return (
    <footer
      role="contentinfo"
      aria-label="Site Footer"
      className="bg-brand-900 text-stone-300 font-bengali pt-12 pb-20 lg:pb-12 border-t border-brand-800"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-brand-800">
          {/* 1. Brand Section (Official Brand Logo & Verified Tagline) */}
          <div className="space-y-3">
            <BrandLogo />
            <p className="text-xs text-stone-400 leading-relaxed pt-1">
              প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা। ১০০% খাঁটি ও প্রাকৃতিক খাবারের বিশ্বস্ত প্রতিষ্ঠান।
            </p>
          </div>

          {/* 2. Navigation (Verified Routes Only) */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">দ্রুত লিংক</h4>
            <nav aria-label="Footer Navigation">
              <ul className="space-y-2 text-xs text-stone-400">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    হোম
                  </Link>
                </li>
                <li>
                  <Link href="/#products" className="hover:text-white transition-colors">
                    পণ্যসমূহ
                  </Link>
                </li>
                <li>
                  <Link href="/#categories" className="hover:text-white transition-colors">
                    ক্যাটাগরি
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* 3. Product & Purity Values (Derived from Existing Catalog Data) */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">আমাদের অঙ্গীকার</h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              সুন্দরবনের প্রাকৃতিক চাকের মধু, বিলোনা গাওয়া ঘি, কাঠের ঘানি ভাঙা সরিষার তেল ও মদিনার আজওয়া খেজুরসহ নির্ভেজাল খাদ্যপণ্য সরবরাহ করাই আমাদের মূল লক্ষ্য।
            </p>
            <div className="flex items-center gap-2 text-xs text-accent-amber font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>১০০% খাঁটি ও প্রাকৃতিক গ্যারান্টি</span>
            </div>
          </div>
        </div>

        {/* 4. Copyright Area */}
        <div className="pt-8 text-center text-xs text-stone-400">
          <p>© 2026 SUNNAH SOURCE. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </div>
    </footer>
  );
};
