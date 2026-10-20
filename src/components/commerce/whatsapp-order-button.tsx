"use client";

import React from "react";

export interface WhatsappOrderButtonProps {
  productTitle: string;
  variantName?: string;
  unitPrice: number;
  quantity: number;
  productSlug: string;
  phoneNumber?: string;
  disabled?: boolean;
  className?: string;
}

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
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

export const WhatsappOrderButton: React.FC<WhatsappOrderButtonProps> = ({
  productTitle,
  variantName,
  unitPrice,
  quantity,
  productSlug,
  phoneNumber = "01914612007",
  disabled = false,
  className = "",
}) => {
  // Format BD number with 880 prefix
  let cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  if (!cleanPhone.startsWith("880")) {
    cleanPhone = cleanPhone.startsWith("0") ? `88${cleanPhone}` : `880${cleanPhone}`;
  }

  const totalPrice = unitPrice * quantity;
  const productUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://sunnahsourcebd.com/product/${productSlug}`;

  const messageLines = [
    "আসসালামু আলাইকুম, আমি সুন্নাহ সোর্স থেকে এই পণ্যটি অর্ডার করতে চাই:",
    "",
    `📦 পণ্য: ${productTitle}`,
    variantName ? `⚖️ ভ্যারিয়েন্ট: ${variantName}` : null,
    `🔢 পরিমাণ: ${quantity}টি`,
    `💰 মোট মূল্য: ৳${totalPrice}`,
    `🔗 লিংক: ${productUrl}`,
    "",
    "আমার ডেলিভারি ঠিকানা ও তথ্য:",
    "নাম: ",
    "ফোন নাম্বার: ",
    "ডেলিভারি ঠিকানা: ",
  ].filter(Boolean);

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    messageLines.join("\n")
  )}`;

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed ${className}`}
      >
        <WhatsAppIcon className="w-5 h-5 fill-stone-400" />
        <span>হোয়াটসঅ্যাপে অর্ডার (স্টক শেষ)</span>
      </button>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] active:scale-[0.99] text-white shadow-sm hover:shadow-md transition-all cursor-pointer ${className}`}
    >
      <WhatsAppIcon className="w-5 h-5 fill-white shrink-0" />
      <span>হোয়াটসঅ্যাপে অর্ডার করুন</span>
      <span className="text-[11px] bg-white/20 text-white font-medium px-2 py-0.5 rounded-full hidden sm:inline">
        ১-ক্লিক অর্ডার
      </span>
    </a>
  );
};
