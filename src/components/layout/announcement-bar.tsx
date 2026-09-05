import React from "react";
import { Truck, ShieldCheck } from "lucide-react";

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="bg-brand-900 text-stone-200 text-xs py-2 px-4 font-bengali border-b border-brand-800">
      <div className="container mx-auto flex items-center justify-center sm:justify-between gap-4 max-w-7xl">
        <div className="flex items-center gap-1.5 font-medium">
          <Truck className="w-3.5 h-3.5 text-accent-amber shrink-0" />
          <span>৳২,০০০ এর বেশি অর্ডারে সারাদেশে ফ্রি ডেলিভারি!</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-stone-300">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-amber shrink-0" />
          <span>প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা</span>
        </div>
      </div>
    </div>
  );
};
