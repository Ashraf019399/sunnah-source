"use client";

import React, { useState } from "react";
import { Printer } from "lucide-react";
import type { AdminOrder, AdminOrderWithItems } from "@/types/orders.types";
import { OrderInvoiceModal } from "./order-invoice-printable";

interface PrintInvoiceButtonProps {
  orderId?: string;
  order?: AdminOrder | AdminOrderWithItems;
  className?: string;
  variant?: "button" | "compact" | "icon";
}

export const PrintInvoiceButton: React.FC<PrintInvoiceButtonProps> = ({
  orderId,
  order,
  className = "",
  variant = "button",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const targetOrder: AdminOrder | AdminOrderWithItems | undefined =
    order || (orderId ? ({ id: orderId, order_number: orderId } as AdminOrder) : undefined);

  const handleClick = () => {
    if (targetOrder) {
      setIsOpen(true);
    } else if (orderId) {
      window.open(`/admin/invoice/${orderId}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          (variant === "compact"
            ? "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-canvas hover:bg-stone-100 text-charcoal-700 hover:text-brand-900 border border-surface-border text-xs font-bold transition-all shadow-2xs cursor-pointer"
            : variant === "icon"
            ? "p-1.5 rounded-lg text-charcoal-600 hover:text-brand-900 hover:bg-brand-50 transition-colors cursor-pointer"
            : "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100/90 text-brand-900 border border-brand-200/90 font-bold text-xs sm:text-sm transition-all shadow-xs hover:shadow-sm active:scale-[0.98] cursor-pointer")
        }
        title="অর্ডারের চালান ও প্যাকিং স্লিপ প্রিন্ট করুন"
      >
        <Printer className={variant === "compact" ? "w-3.5 h-3.5 text-charcoal-500" : "w-4 h-4 text-brand-700 shrink-0"} />
        <span>প্রিন্ট চালান (Print Slip)</span>
      </button>

      {targetOrder && (
        <OrderInvoiceModal
          order={targetOrder}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
