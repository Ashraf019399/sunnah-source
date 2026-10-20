"use client";

import React, { useState, useEffect } from "react";
import { Search, Phone, Hash, Loader2, AlertCircle } from "lucide-react";
import { isValidBDPhone } from "@/lib/utils";

interface OrderTrackingFormProps {
  initialOrderNumber?: string;
  initialPhone?: string;
  isLoading: boolean;
  errorMessage?: string | null;
  onSubmit: (orderNumber: string, phone: string) => void;
}

export const OrderTrackingForm: React.FC<OrderTrackingFormProps> = ({
  initialOrderNumber = "",
  initialPhone = "",
  isLoading,
  errorMessage,
  onSubmit,
}) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone);
  const [clientError, setClientError] = useState<string | null>(null);

  // Sync state if initial props change (e.g. from searchParams)
  useEffect(() => {
    if (initialOrderNumber) setOrderNumber(initialOrderNumber);
    if (initialPhone) setPhone(initialPhone);
  }, [initialOrderNumber, initialPhone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    const cleanOrderNumber = orderNumber.trim();
    const cleanPhone = phone.trim();

    if (!cleanOrderNumber) {
      setClientError("অনুগ্রহ করে আপনার অর্ডার নম্বরটি লিখুন।");
      return;
    }

    if (!cleanPhone) {
      setClientError("অনুগ্রহ করে অর্ডারের সময় ব্যবহৃত মোবাইল নম্বরটি লিখুন।");
      return;
    }

    if (!isValidBDPhone(cleanPhone)) {
      setClientError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।");
      return;
    }

    onSubmit(cleanOrderNumber, cleanPhone);
  };

  const displayError = clientError || errorMessage;

  return (
    <div className="bg-white rounded-2xl border border-surface-border shadow-card p-5 sm:p-7">
      <div className="mb-5 text-center sm:text-left">
        <h2 className="text-lg sm:text-xl font-black text-charcoal-900 tracking-tight">
          অর্ডার অনুসন্ধান করুন
        </h2>
        <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
          অর্ডারের বর্তমান অবস্থা ও ডেলিভারি অগ্রগতি জানতে নিচের তথ্যগুলো দিন
        </p>
      </div>

      {displayError && (
        <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-rose-800 text-xs sm:text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">{displayError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Order Number Input */}
          <div>
            <label
              htmlFor="track-order-number"
              className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1.5"
            >
              অর্ডার নম্বর <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="track-order-number"
                type="text"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value);
                  if (clientError) setClientError(null);
                }}
                placeholder="যেমন: SS-261019-0001"
                disabled={isLoading}
                className="w-full h-11 pl-10 pr-3.5 text-xs sm:text-sm font-mono uppercase bg-surface-canvas rounded-xl border border-surface-border focus:bg-white focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20 transition-all placeholder:font-sans placeholder:normal-case placeholder:text-charcoal-400 disabled:opacity-60"
                required
              />
              <Hash className="absolute left-3.5 top-3.5 w-4 h-4 text-charcoal-400 pointer-events-none" />
            </div>
            <p className="text-[11px] text-charcoal-400 mt-1">
              অর্ডার সফল হওয়ার পর এসএমএস বা স্ক্রিনে প্রদর্শিত নম্বর
            </p>
          </div>

          {/* Phone Number Input */}
          <div>
            <label
              htmlFor="track-phone"
              className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1.5"
            >
              মোবাইল নম্বর <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="track-phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (clientError) setClientError(null);
                }}
                placeholder="যেমন: 017XXXXXXXX"
                disabled={isLoading}
                className="w-full h-11 pl-10 pr-3.5 text-xs sm:text-sm font-sans bg-surface-canvas rounded-xl border border-surface-border focus:bg-white focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20 transition-all placeholder:text-charcoal-400 disabled:opacity-60"
                required
              />
              <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-charcoal-400 pointer-events-none" />
            </div>
            <p className="text-[11px] text-charcoal-400 mt-1">
              অর্ডারের সময় যে মোবাইল নম্বর ব্যবহার করা হয়েছিল
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto min-w-[200px] h-11 px-6 rounded-xl bg-brand-700 hover:bg-brand-800 active:scale-[0.99] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-card hover:shadow-card-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>অনুসন্ধান করা হচ্ছে...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>অর্ডার ট্র্যাক করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
