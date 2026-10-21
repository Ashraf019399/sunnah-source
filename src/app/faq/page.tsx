"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "Purity & Sourcing" | "Shipping & Orders" | "Payment & Returns";
}

const FAQ_LIST: FaqItem[] = [
  {
    id: "faq-1",
    question: "Is your Sundarban honey 100% raw, pure, and unprocessed?",
    answer:
      "Yes, absolutely. Our Sundarban Raw Wild Honey is harvested directly from wild honeycombs in the deep mangrove forests by traditional honey-collectors (Mawals). It is raw, completely unheated, and unfiltered, preserving all natural pollen, enzymes, and medicinal benefits. Every batch is certified for 100% purity.",
    category: "Purity & Sourcing",
  },
  {
    id: "faq-2",
    question: "How is Traditional Bilona Cow Ghee prepared?",
    answer:
      "Our cow ghee is crafted following the ancient Bilona method. Fresh cow milk is first cultured into curd (dahi), which is then hand-churned in earthen or wooden pots to extract pure makkhan (butter). This butter is gently simmered over slow heat to produce golden, aromatic, and granulated (danadar) ghee with zero chemicals or artificial fragrances.",
    category: "Purity & Sourcing",
  },
  {
    id: "faq-3",
    question: "What are your shipping options and delivery times?",
    answer:
      "We provide secure nationwide home delivery with live package tracking via Steadfast Courier across all 64 districts in Bangladesh. Delivery takes 24–48 hours inside Dhaka city, and 48–72 hours anywhere outside Dhaka.",
    category: "Shipping & Orders",
  },
  {
    id: "faq-4",
    question: "How can I qualify for Free Shipping?",
    answer:
      "Any order of ৳2,000 or above automatically qualifies for 100% Free Nationwide Delivery across Bangladesh. For orders below ৳2,000, shipping is ৳70 inside Dhaka and ৳130 outside Dhaka.",
    category: "Shipping & Orders",
  },
  {
    id: "faq-5",
    question: "Do you offer Cash on Delivery (COD)?",
    answer:
      "Yes! We offer 100% Cash on Delivery across all 64 districts of Bangladesh. You can inspect your parcel upon arrival and pay the delivery courier directly.",
    category: "Payment & Returns",
  },
  {
    id: "faq-6",
    question: "What is your return and refund policy?",
    answer:
      "Customer satisfaction and ethical commerce are our core principles. If you are not completely satisfied with product purity, aroma, or packaging, we offer a 100% hassle-free 7-day return and instant money-back guarantee.",
    category: "Payment & Returns",
  },
  {
    id: "faq-7",
    question: "How can I track my order status?",
    answer:
      "You can track your order at any time using our dedicated Live Order Tracker at /track-order with your Order ID, or visit /account/orders with your 11-digit mobile number to view your complete order history and printable A4 invoice.",
    category: "Shipping & Orders",
  },
  {
    id: "faq-8",
    question: "Are your Mustard Oil, Black Seed Oil, and Dates 100% natural?",
    answer:
      "Yes. Our mustard and black seed oils are 100% cold-pressed using traditional wooden ghani (kolu) machines with zero chemicals or adulterants. Our VIP Ajwa dates are directly imported from Medina, Saudi Arabia.",
    category: "Purity & Sourcing",
  },
];

export default function FaqPage() {
  const [openIds, setOpenIds] = useState<string[]>(["faq-1", "faq-2", "faq-3"]);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas font-sans text-charcoal-900">
      {/* 1. Global Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Global Header */}
      <Header />

      {/* 3. Main FAQ Page Content */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="container mx-auto max-w-6xl px-4 space-y-10 sm:space-y-12">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-charcoal-500 font-medium"
          >
            <Link
              href="/"
              className="hover:text-brand-700 transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-charcoal-900 font-bold">FAQs</span>
          </nav>

          {/* Page Hero Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-1 rounded-full text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Help Center & Knowledge Base</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-charcoal-900 tracking-tight leading-tight">
              Frequently Asked Questions (FAQs)
            </h1>
            <p className="text-sm sm:text-base text-charcoal-600 leading-relaxed">
              Find quick answers to common questions about our pure Sunnah food
              products, shipping, payment, and return policy.
            </p>
            <div className="w-20 h-1 bg-amber-500 rounded-full mx-auto mt-2" />
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 border border-brand-100">
                <ShieldCheck className="w-5 h-5 text-brand-700" />
              </div>
              <div>
                <span className="text-xs font-bold text-charcoal-900 block leading-tight">
                  100% Raw & Pure
                </span>
                <span className="text-[11px] text-charcoal-500">
                  Lab Certified
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
                <Truck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <span className="text-xs font-bold text-charcoal-900 block leading-tight">
                  Nationwide Delivery
                </span>
                <span className="text-[11px] text-charcoal-500">
                  All 64 Districts
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-charcoal-900 block leading-tight">
                  Cash on Delivery
                </span>
                <span className="text-[11px] text-charcoal-500">
                  Inspect First, Pay Later
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-100">
                <HelpCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-charcoal-900 block leading-tight">
                  7-Day Guarantee
                </span>
                <span className="text-[11px] text-charcoal-500">
                  100% Money-Back
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Responsive Interactive Accordion Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start max-w-5xl mx-auto">
            {FAQ_LIST.map((faq, index) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-2xl border border-stone-200/80 hover:border-brand-700/40 shadow-xs hover:shadow-subtle transition-all overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-800 text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 border border-brand-200/60 font-mono">
                        Q{index + 1}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-charcoal-900 leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-stone-50 border border-stone-200/70 flex items-center justify-center shrink-0 text-stone-500 transition-colors">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-brand-700" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-charcoal-600 leading-relaxed border-t border-stone-100 bg-surface-canvas/30">
                      {faq.answer.includes("/track-order") ||
                      faq.answer.includes("/account/orders") ? (
                        <p>
                          You can track your order at any time using our dedicated{" "}
                          <Link
                            href="/track-order"
                            className="text-brand-700 font-bold hover:underline"
                          >
                            Live Order Tracker
                          </Link>{" "}
                          with your Order ID, or visit{" "}
                          <Link
                            href="/account/orders"
                            className="text-brand-700 font-bold hover:underline"
                          >
                            My Orders
                          </Link>{" "}
                          with your 11-digit mobile number to view your complete
                          order history and printable A4 invoice.
                        </p>
                      ) : (
                        <p>{faq.answer}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Help Support Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-white rounded-3xl p-6 sm:p-10 border border-brand-700 shadow-xl max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left max-w-lg">
              <span className="inline-block bg-accent-amber/20 text-accent-amber border border-accent-amber/40 text-xs font-bold px-3 py-1 rounded-full">
                Dedicated Customer Care
              </span>
              <h2 className="text-xl sm:text-2xl font-black leading-snug">
                Still have questions? We are always here to help.
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Our support team is available every day from 9:00 AM to 10:00 PM
                to answer inquiries, guide product selection, or assist with
                your order.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <a
                href="https://wa.me/8801914612007"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href="tel:01914612007"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Call Hotline</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Global Footer */}
      <Footer />

      {/* 5. Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* 6. Shopping Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
