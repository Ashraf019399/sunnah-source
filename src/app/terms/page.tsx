import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronRight,
  FileCheck,
  Scale,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";

export const metadata: Metadata = {
  title: "Terms of Service | Sunnah Source - Pure Nature, Sunnah Inspired",
  description:
    "Review the terms and conditions governing purchases, shipping, payment methods, returns, and account usage on Sunnah Source e-commerce platform.",
  openGraph: {
    title: "Terms of Service | Sunnah Source",
    description:
      "Review the official terms and conditions for orders, deliveries, and authentic organic foods from Sunnah Source.",
    url: "https://sunnahsourcebd.com/terms",
    siteName: "Sunnah Source",
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "https://sunnahsourcebd.com/terms",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = "October 22, 2026";

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-charcoal-900 font-sans antialiased selection:bg-brand-500 selection:text-white">
      <AnnouncementBar />
      <Header />

      <main className="flex-1 pb-16 sm:pb-24">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-surface-border/60 bg-white/70 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-charcoal-500">
              <Link href="/" className="hover:text-brand-700 transition-colors flex items-center gap-1 font-medium">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal-400" />
              <span className="text-charcoal-900 font-semibold">Terms of Service</span>
            </nav>
          </div>
        </div>

        {/* Hero Header */}
        <section className="bg-gradient-to-b from-white via-white to-surface-canvas/50 border-b border-surface-border/50 pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-800 text-xs font-semibold mb-4">
              <Scale className="w-3.5 h-3.5 text-brand-700" />
              <span>Customer Agreement & Guidelines</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 tracking-tight font-bengali">
              ব্যবহারের শর্তাবলী <span className="font-sans text-2xl sm:text-3xl font-bold text-stone-500">/ Terms of Service</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-charcoal-600 max-w-2xl leading-relaxed">
              These Terms of Service govern your access to and use of <strong>Sunnah Source</strong> website, catalog, order processing, and customer support services across Bangladesh.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-charcoal-500 font-medium">
              <span>Last Updated: <strong className="text-charcoal-700">{lastUpdated}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>Effective across: <strong className="text-charcoal-700">Bangladesh</strong></span>
            </div>
          </div>
        </section>

        {/* Main Content Body */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-surface-border shadow-xs space-y-10">
            
            {/* 1. Acceptance */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">1</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Acceptance of Terms</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                By visiting our website (<Link href="/" className="text-brand-700 font-semibold underline underline-offset-2">sunnahsourcebd.com</Link>), browsing our catalog, registering an account, or placing an order, you confirm that you have read, understood, and agreed to be bound by these Terms of Service and our associated{" "}
                <Link href="/privacy" className="text-brand-700 font-semibold underline underline-offset-2">Privacy Policy</Link>. If you do not agree with any portion of these terms, please refrain from using our services.
              </p>
            </section>

            {/* 2. User Accounts & Google Sign-In */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">2</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">User Accounts & Authentication</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                You may browse our store and place orders as a guest or by creating an account through email registration or <strong>Google Sign-In</strong>:
              </p>
              <ul className="text-xs sm:text-sm text-charcoal-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>You are responsible for maintaining the confidentiality of your login credentials and preventing unauthorized access to your devices.</li>
                <li>When using Google OAuth to sign in, you authorize Sunnah Source to verify your identity using your verified Google profile email and name in accordance with our Privacy Policy.</li>
                <li>You agree to provide true, accurate, and complete shipping address and contact phone numbers for delivery dispatch.</li>
              </ul>
            </section>

            {/* 3. Product Authenticity & Pricing */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Product Authenticity & Pricing</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                Our primary brand mission is delivering 100% natural, adulteration-free, and prophetically inspired foods. Every batch of Sundarban honey, artisanal bilona cow ghee, mustard oil, black seed oil, and Medina dates is sourced ethically and tested for purity.
              </p>
              <div className="p-4 rounded-xl bg-surface-canvas/60 border border-surface-border text-xs sm:text-sm text-charcoal-700 space-y-2">
                <p>
                  <strong>Currency:</strong> All prices displayed on our website are denominated in Bangladeshi Taka (BDT / ৳) and are inclusive of standard local taxes.
                </p>
                <p>
                  <strong>Accuracy:</strong> While we endeavor to ensure exact stock levels and pricing accuracy, in the rare event of a typographical error or technical discrepancy, Sunnah Source reserves the right to contact you before shipment to cancel or adjust the affected item.
                </p>
              </div>
            </section>

            {/* 4. Ordering & Payment Terms */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">4</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Ordering & Payment Methods</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                Placing an order constitutes an offer to purchase. An order is confirmed upon automated system receipt and verbal or SMS verification when necessary. We provide multiple payment options:
              </p>
              <ul className="text-xs sm:text-sm text-charcoal-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>Cash on Delivery (COD):</strong> Available nationwide across all 64 districts in Bangladesh. You pay in cash directly to the courier delivery agent.</li>
                <li><strong>Mobile Financial Services:</strong> bKash, Nagad, and Rocket mobile wallet payments via official channels.</li>
                <li><strong>Bank Cards & Electronic Banking:</strong> Visa, Mastercard, and Islami Bank Bangladesh Limited (IBBL) electronic transfers via verified banking channels.</li>
              </ul>
            </section>

            {/* 5. Shipping & Delivery */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">5</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Shipping & Delivery Policy</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                We partner with <strong>Steadfast Courier</strong> to provide reliable, tracked nationwide doorstep delivery across Bangladesh:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl border border-surface-border bg-white">
                  <h4 className="text-xs font-bold text-charcoal-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Inside Dhaka City</span>
                  </h4>
                  <p className="text-xs text-charcoal-600 mt-1">
                    Delivered within <strong>24 to 48 hours</strong>. Standard shipping rate: ৳70 (Free on orders above ৳2,000).
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-surface-border bg-white">
                  <h4 className="text-xs font-bold text-charcoal-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Outside Dhaka (All 64 Districts)</span>
                  </h4>
                  <p className="text-xs text-charcoal-600 mt-1">
                    Delivered within <strong>48 to 72 hours</strong>. Standard shipping rate: ৳130 (Free on orders above ৳2,000).
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Returns, Replacements & Refunds */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">6</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Returns, Replacements & Refunds</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                Customer satisfaction and Sunnah integrity are paramount to us. Because we sell consumable and glass-bottled food products, our return conditions are straightforward:
              </p>
              <ul className="text-xs sm:text-sm text-charcoal-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>Inspection on Delivery:</strong> Customers are warmly encouraged to inspect the outer packaging and contents in the presence of the courier rider before accepting the delivery.</li>
                <li><strong>Transit Damage or Broken Jars:</strong> If any jar is cracked, broken, or leaked during transit, notify us within <strong>24–48 hours</strong> with a photo. We will immediately dispatch a free replacement or issue a 100% refund.</li>
                <li><strong>Quality Guarantee:</strong> If our honey, ghee, or oil fails any certified laboratory purity test for adulteration, we offer an unconditional 100% full money-back guarantee.</li>
              </ul>
            </section>

            {/* 7. Intellectual Property */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">7</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Intellectual Property Rights</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                All brand graphics, product photography, mockups, logos, text descriptions, and software code on <strong>sunnahsourcebd.com</strong> are the proprietary intellectual property of Sunnah Source. You may not reproduce, copy, or redistribute our assets without prior written consent.
              </p>
            </section>

            {/* 8. Limitation of Liability */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">8</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Limitation of Liability</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                To the fullest extent permitted under Bangladeshi law, Sunnah Source shall not be liable for any indirect, incidental, or consequential damages resulting from website unavailability, courier transit delays beyond our reasonable control, or individual customer allergies. Customers with specific medical conditions should consult a healthcare provider regarding nutritional dietary intake.
              </p>
            </section>

            {/* 9. Governing Law */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">9</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Governing Law & Jurisdiction</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                These Terms of Service are governed by and construed in accordance with the laws of the <strong>People&apos;s Republic of Bangladesh</strong>. Any dispute arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts of Bangladesh.
              </p>
            </section>

            {/* 10. Contact Details */}
            <section className="space-y-4 pt-4 border-t border-surface-border">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">10</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Questions & Customer Support</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                For questions regarding these Terms of Service or our ordering policies:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-surface-canvas/80 border border-surface-border flex items-start gap-3">
                  <Mail className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-charcoal-900">Email Address</h4>
                    <a href="mailto:sunnahsourcebd@gmail.com" className="text-xs text-brand-700 hover:underline break-all font-sans font-medium">
                      sunnahsourcebd@gmail.com
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-canvas/80 border border-surface-border flex items-start gap-3">
                  <Phone className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-charcoal-900">Official Hotline</h4>
                    <a href="tel:01914612007" className="text-xs text-brand-700 hover:underline font-sans font-medium">
                      +880 1914-612007
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-canvas/80 border border-surface-border flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-charcoal-900">Operating Address</h4>
                    <p className="text-xs text-charcoal-600">
                      Lalmonirhat, Bangladesh
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
      <CartDrawer />
    </div>
  );
}
