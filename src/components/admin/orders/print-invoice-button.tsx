"use client";

import React from "react";
import { Printer } from "lucide-react";

interface PrintInvoiceButtonProps {
  orderId: string;
  className?: string;
}

export const PrintInvoiceButton: React.FC<PrintInvoiceButtonProps> = ({
  orderId,
  className = "",
}) => {
  const handlePrint = () => {
    if (!orderId) return;
    window.open(`/admin/invoice/${orderId}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100/90 text-brand-900 border border-brand-200/90 font-bold text-xs sm:text-sm transition-all shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer ${className}`}
      title="অর্ডারের চালান ও প্যাকিং স্লিপ প্রিন্ট করুন"
    >
      <Printer className="w-4 h-4 text-brand-700 shrink-0" />
      <span>চালান প্রিন্ট করুন</span>
    </button>
  );
};
