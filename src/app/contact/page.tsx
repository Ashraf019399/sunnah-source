import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Truck,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";

export const metadata: Metadata = {
  title: "যোগাযোগ (Contact Us) | Sunnah Source - খাঁটি প্রাকৃতিক খাদ্য",
  description:
    "সান্নাহ সোর্স (Sunnah Source)-এর সাথে যোগাযোগ করুন। খাঁটি মধু, ঘি, তেল ও যেকোনো অর্ডার বা তথ্যের জন্য আমাদের হটলাইন, হোয়াটসঅ্যাপ বা ইমেইলে সরাসরি মেসেজ দিন।",
  openGraph: {
    title: "যোগাযোগ (Contact Us) | Sunnah Source",
    description:
      "সান্নাহ সোর্স (Sunnah Source)-এর সাথে যোগাযোগ করুন। আমাদের হটলাইন: 01914-612007 (WhatsApp & Call)।",
    url: "https://sunnahsourcebd.com/contact",
  },
};

export default function ContactPage() {
  const contactMethods = [
    {
      id: "phone",
      icon: Phone,
      title: "হটলাইন ও ফোন কল",
      value: "০১৯১৪-৬১২০০৭",
      subtext: "সকাল ৯:০০ - রাত ১১:০০ (প্রতিদিন খোলা)",
      actionLabel: "সরাসরি কল দিন",
      actionHref: "tel:01914612007",
      colorClass: "bg-brand-50 text-brand-800 border-brand-200",
      iconColor: "text-brand-700",
    },
    {
      id: "whatsapp",
      icon: MessageCircle,
      title: "হোয়াটসঅ্যাপ সাপোর্ট",
      value: "01914-612007",
      subtext: "যেকোনো প্রশ্ন বা দ্রুত অর্ডারের জন্য মেসেজ দিন",
      actionLabel: "হোয়াটসঅ্যাপে চ্যাট করুন",
      actionHref: "https://wa.me/8801914612007",
      colorClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      iconColor: "text-emerald-600",
    },
    {
      id: "email",
      icon: Mail,
      title: "ইমেইল যোগাযোগ",
      value: "sunnahsourcebd@gmail.com",
      subtext: "কর্পোরেট ইনকোয়ারি বা পার্টনারশিপের জন্য",
      actionLabel: "ইমেইল পাঠান",
      actionHref: "mailto:sunnahsourcebd@gmail.com",
      colorClass: "bg-amber-50 text-amber-900 border-amber-200",
      iconColor: "text-amber-700",
    },
    {
      id: "office",
      icon: MapPin,
      title: "অফিস ও ওয়্যারহাউস",
      value: "লালমনিরহাট, বাংলাদেশ",
      subtext: "সারাদেশের ৬৪ জেলায় ক্যাশ অন হোম ডেলিভারি",
      actionLabel: "অর্ডার ট্র্যাক করুন",
      actionHref: "/track-order",
      colorClass: "bg-stone-50 text-charcoal-800 border-stone-200",
      iconColor: "text-charcoal-700",
    },
  ];

  return (
    <div className="min-h-screen bg-surface-canvas text-charcoal-900 flex flex-col font-bengali">
      <AnnouncementBar />
      <Header />
      <CartDrawer />

      <main className="flex-1 pb-16">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-surface-border/60 py-3">
          <div className="container mx-auto px-4 max-w-7xl">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-charcoal-500 font-sans"
            >
              <Link href="/" className="hover:text-brand-700 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-semibold text-charcoal-900 font-bengali">
                যোগাযোগ (Contact)
              </span>
            </nav>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-b from-brand-50/60 to-surface-canvas border-b border-surface-border/50 py-12 md:py-16 text-center px-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>সান্নাহ সোর্স গ্রাহক সেবা</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-charcoal-900 tracking-tight">
              আমাদের সাথে যোগাযোগ করুন
            </h1>
            <p className="text-sm md:text-base text-charcoal-600 leading-relaxed">
              যেকোনো পণ্য সংক্রান্ত তথ্য, বাল্ক বা হোলসেল অর্ডার, অথবা অর্ডারের তথ্যের জন্য সান্নাহ সোর্স টিম সবসময় আপনার পাশে আছে।
            </p>
          </div>
        </div>

        {/* Contact Cards Grid */}
        <div className="container mx-auto px-4 max-w-5xl -mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contactMethods.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-6 border border-surface-border shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${item.colorClass}`}
                    >
                      <Icon className={`w-6 h-6 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-charcoal-900">
                        {item.title}
                      </h2>
                      <p className="text-base font-black text-brand-800 font-sans mt-0.5">
                        {item.value}
                      </p>
                      <p className="text-xs text-charcoal-500 mt-1">
                        {item.subtext}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-surface-border/50 flex items-center justify-end">
                    <a
                      href={item.actionHref}
                      target={item.actionHref.startsWith("http") ? "_blank" : undefined}
                      rel={item.actionHref.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold transition-colors"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Guarantees */}
          <div className="mt-8 bg-white rounded-2xl p-6 border border-surface-border shadow-xs">
            <h3 className="text-sm font-bold text-charcoal-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-700" />
              <span>আমাদের সেবার অঙ্গীকার</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-charcoal-600">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>দ্রুত রেসপন্স: সকাল ৯টা থেকে রাত ১১টা</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <Truck className="w-4 h-4 text-brand-700 shrink-0" />
                <span>সারাদেশে ২-৩ দিনে নিরাপদ হোম ডেলিভারি</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>১০০% খাঁটি পণ্যের নিশ্চয়তা ও সহজ রিটার্ন</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
