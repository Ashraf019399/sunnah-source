import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronRight,
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  Trash2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";

export const metadata: Metadata = {
  title: "Privacy Policy | Sunnah Source - Pure Nature, Sunnah Inspired",
  description:
    "Learn how Sunnah Source collects, uses, protects, and handles your personal information, including Google OAuth authentication, limited use compliance, and account deletion rights.",
  openGraph: {
    title: "Privacy Policy | Sunnah Source",
    description:
      "Learn how Sunnah Source protects your data, ensures confidential processing, and strictly complies with the Google API Services User Data Policy.",
    url: "https://sunnahsourcebd.com/privacy",
    siteName: "Sunnah Source",
    locale: "en_US",
    type: "website",
  },
  alternates: {
    canonical: "https://sunnahsourcebd.com/privacy",
  },
};

export default function PrivacyPolicyPage() {
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
              <span className="text-charcoal-900 font-semibold">Privacy Policy</span>
            </nav>
          </div>
        </div>

        {/* Hero Header */}
        <section className="bg-gradient-to-b from-white via-white to-surface-canvas/50 border-b border-surface-border/50 pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Trust, Transparency & Security</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 tracking-tight font-bengali">
              প্রাইভেসি পলিসি <span className="font-sans text-2xl sm:text-3xl font-bold text-stone-500">/ Privacy Policy</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-charcoal-600 max-w-2xl leading-relaxed">
              At <strong>Sunnah Source</strong>, we are deeply committed to protecting your privacy, securing your personal data, and maintaining complete transparency regarding how your information is handled.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-charcoal-500 font-medium">
              <span>Last Updated: <strong className="text-charcoal-700">{lastUpdated}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>Applies to: <strong className="text-charcoal-700">sunnahsourcebd.com</strong></span>
            </div>
          </div>
        </section>

        {/* Key Highlights Banner */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-surface-border">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal-900">Encrypted Storage</h4>
                <p className="text-[11px] text-charcoal-500 mt-0.5">Industry-standard 256-bit SSL encryption</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                <EyeOff className="w-4 h-4 text-brand-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal-900">Zero Data Selling</h4>
                <p className="text-[11px] text-charcoal-500 mt-0.5">We never sell or monetize your personal data</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal-900">Google OAuth Certified</h4>
                <p className="text-[11px] text-charcoal-500 mt-0.5">Strict Limited Use compliance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-rose-700" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-charcoal-900">Full Deletion Rights</h4>
                <p className="text-[11px] text-charcoal-500 mt-0.5">Request data purge at any time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 border border-surface-border shadow-xs space-y-10">
            
            {/* 1. Introduction */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">1</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Introduction & Scope</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                Welcome to <strong>Sunnah Source</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), accessible via{" "}
                <Link href="/" className="text-brand-700 font-semibold underline underline-offset-2">https://sunnahsourcebd.com</Link>. 
                We provide an e-commerce platform dedicated to offering pure, unadulterated, and prophetic Sunnah-inspired organic foods—such as raw wild honey, handcrafted bilona ghee, cold-pressed oils, premium Medina dates, and organic seeds across Bangladesh.
              </p>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                This Privacy Policy describes what information we collect from you, how we use and safeguard that information, your legal rights regarding your data, and our explicit compliance policies for third-party services including Google Sign-In / OAuth.
              </p>
            </section>

            {/* 2. GOOGLE OAUTH USER DATA POLICY COMPLIANCE (CRITICAL FOR GOOGLE VERIFICATION) */}
            <section id="google-oauth-disclosure" className="space-y-4 p-5 sm:p-7 rounded-2xl bg-amber-50/60 border-2 border-amber-300/80 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <span className="text-[11px] font-bold tracking-wider text-amber-800 uppercase">Mandatory Disclosure</span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-charcoal-900">
                    Google OAuth & Google API User Data Policy Compliance
                  </h2>
                </div>
              </div>

              <p className="text-sm text-charcoal-700 leading-relaxed">
                Sunnah Source provides an optional, seamless <strong>Google Sign-In</strong> button to allow users to authenticate quickly and securely without remembering separate passwords. When you choose to sign in using Google, our application requests access solely to your basic Google profile identity.
              </p>

              {/* Data Types via Google */}
              <div className="bg-white rounded-xl p-4 border border-amber-200 space-y-2">
                <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wide">
                  Specific Information Collected via Google Sign-In:
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-charcoal-700">
                  <li className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Full Name</strong> (to address you on invoices)</span>
                  </li>
                  <li className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Email Address</strong> (for order confirmations)</span>
                  </li>
                  <li className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Profile Picture</strong> (optional avatar icon)</span>
                  </li>
                </ul>
              </div>

              {/* Exact Google Clause */}
              <div className="bg-white p-4 rounded-xl border-l-4 border-l-brand-600 border border-stone-200">
                <p className="text-xs sm:text-sm font-semibold text-charcoal-900 leading-relaxed">
                  &quot;Sunnah Source&apos;s use and transfer of information received from Google APIs will adhere to the{" "}
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 underline font-bold hover:text-brand-900 inline-flex items-center gap-0.5"
                  >
                    Google API Services User Data Policy
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
                  , including the Limited Use requirements.&quot;
                </p>
              </div>

              {/* Google Data Limitations */}
              <div className="space-y-2 text-xs sm:text-sm text-charcoal-700 leading-relaxed">
                <p>
                  <strong>How we use Google Data:</strong> Information received via Google OAuth is used strictly to authenticate your account, maintain your verified shopping cart, track your order history, and send order receipt emails.
                </p>
                <p>
                  <strong>We do NOT sell Google User Data:</strong> Sunnah Source strictly does not sell, rent, license, or disclose Google user credentials, email addresses, or personal records to any third-party marketing firms, data brokers, or advertisers.
                </p>
                <p>
                  <strong>No Human Reading of Private Data:</strong> No humans at Sunnah Source read your private profile data unless required by applicable law, needed for security fraud investigation, or with your explicit documented consent for technical support.
                </p>
              </div>
            </section>

            {/* 3. Information We Collect */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">2</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Information We Collect</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                Depending on how you interact with our website, we collect the following categories of information:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-surface-canvas/60 border border-surface-border space-y-2">
                  <h3 className="text-sm font-bold text-charcoal-900">A. Information You Provide Directly</h3>
                  <ul className="text-xs text-charcoal-600 space-y-1.5 list-disc pl-4">
                    <li><strong>Contact Information:</strong> Your name, phone number, and email address.</li>
                    <li><strong>Shipping & Delivery Details:</strong> Physical delivery address, district, city, and optional delivery notes.</li>
                    <li><strong>Order Details:</strong> Items purchased, order quantities, variant selections, and coupon codes applied.</li>
                    <li><strong>Customer Support Inquiries:</strong> Messages, feedback, or review ratings submitted through our forms.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-surface-canvas/60 border border-surface-border space-y-2">
                  <h3 className="text-sm font-bold text-charcoal-900">B. Technical & Automated Data</h3>
                  <ul className="text-xs text-charcoal-600 space-y-1.5 list-disc pl-4">
                    <li><strong>Device & Connection:</strong> IP address, browser type, operating system, and device screen dimensions.</li>
                    <li><strong>Session Cookies:</strong> Cookies used to persist your shopping cart items, preferred language, and login token.</li>
                    <li><strong>Security Logs:</strong> Timestamped access records for anomaly detection, rate-limiting, and fraud prevention.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. How We Use Information */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">How We Use Your Information</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                We process your personal information exclusively for lawful, legitimate e-commerce purposes, including:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-charcoal-700 pl-4 list-disc leading-relaxed">
                <li><strong>Order Fulfillment:</strong> Packaging your items, generating authentic invoices, and delivering products safely to your doorstep.</li>
                <li><strong>Live Delivery Tracking:</strong> Transmitting essential delivery details (recipient name, address, phone number) to our courier partner (Steadfast Courier) to enable live parcel tracking.</li>
                <li><strong>Account Authentication:</strong> Verifying identity via secure email/password or Google OAuth to safeguard your order history.</li>
                <li><strong>Transactional Notifications:</strong> Sending SMS or email notifications confirming order placement, shipping updates, and delivery confirmations.</li>
                <li><strong>Customer Support:</strong> Answering hotline inquiries, resolving parcel delays, or processing quality feedback.</li>
              </ul>
            </section>

            {/* 5. Payment Security */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">4</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Payment Processing & Security</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                We offer multiple secure payment methods for customers across Bangladesh:
              </p>
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs sm:text-sm text-charcoal-700 space-y-2">
                <p>
                  <strong>Cash on Delivery (COD):</strong> You pay in cash directly to the delivery rider upon inspecting your package. No card data is collected.
                </p>
                <p>
                  <strong>Mobile Financial Services (bKash, Nagad, Rocket):</strong> Handled via official merchant numbers or secure banking gateways. Sunnah Source <strong>never stores your MFS PIN or one-time passwords (OTP)</strong>.
                </p>
                <p>
                  <strong>Card & Bank Transfers:</strong> Any card processing is conducted through PCI-DSS Level 1 certified payment processors. We never retain full card numbers or CVV codes on our servers.
                </p>
              </div>
            </section>

            {/* 6. Third-Party Sharing */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">5</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Third-Party Data Sharing</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                We only share personal information with third parties when strictly necessary to deliver our services to you:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-charcoal-700 pl-4 list-disc leading-relaxed">
                <li><strong>Logistics Providers:</strong> We provide your name, shipping address, and phone number to <strong>Steadfast Courier</strong> solely for dispatching packages and communicating delivery status.</li>
                <li><strong>Infrastructure Providers:</strong> Hosted on secure cloud infrastructure (Vercel, Supabase) with strict enterprise-grade encryption at rest and in transit.</li>
                <li><strong>Legal Requirements:</strong> We may disclose data if required by applicable laws of Bangladesh, court orders, or governmental authorities.</li>
              </ul>
              <p className="text-xs sm:text-sm font-semibold text-charcoal-900 pt-1">
                We under no circumstances sell, rent, trade, or distribute your customer list to marketing affiliates or external advertisers.
              </p>
            </section>

            {/* 7. Data Retention & User Deletion Rights */}
            <section id="data-deletion" className="space-y-4 p-5 sm:p-6 rounded-2xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">6</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">
                  Data Retention & User Account Deletion Instructions
                </h2>
              </div>
              <p className="text-sm text-charcoal-700 leading-relaxed">
                You retain complete ownership and control over your personal data. You have the right to request access, correction, or permanent deletion of your account and personal records at any time.
              </p>

              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
                <h3 className="text-xs font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  How to Request Account & Data Deletion:
                </h3>
                <p className="text-xs sm:text-sm text-charcoal-600 leading-relaxed">
                  To permanently delete your Sunnah Source account, Google OAuth association, order history, and contact information:
                </p>
                <ol className="text-xs sm:text-sm text-charcoal-700 space-y-1.5 pl-4 list-decimal">
                  <li>Send an email to our Data Protection Officer at: <strong className="text-brand-800">sunnahsourcebd@gmail.com</strong></li>
                  <li>Use the subject line: <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs text-rose-700 font-mono">Data Deletion Request - [Your Name/Email]</code></li>
                  <li>State your registered email address and phone number so we can verify account ownership.</li>
                </ol>
                <p className="text-xs text-stone-500 pt-1">
                  Upon receipt and identity verification, our technical team will permanently purge your personal account records and OAuth tokens within <strong>48–72 business hours</strong>, except where minimum transaction data must be retained to comply with legal tax accounting requirements in Bangladesh.
                </p>
              </div>
            </section>

            {/* 8. Cookies */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">7</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Cookies & Local Storage</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                We utilize essential first-party cookies and local browser storage to keep you logged in, retain items in your cart between sessions, and remember your display preferences. We do not use third-party tracking cookies for cross-site retargeting or intrusive behavioral advertising. You can configure your browser to reject cookies, though certain cart features may not function properly.
              </p>
            </section>

            {/* 9. Children's Privacy */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">8</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Children&apos;s Privacy</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                Our services are directed to individuals capable of entering legally binding contracts under the laws of Bangladesh. We do not knowingly collect personal information from children under the age of 13. If you believe a child has provided us with personal information without parental consent, please contact us immediately for prompt deletion.
              </p>
            </section>

            {/* 10. Contact Information */}
            <section className="space-y-4 pt-4 border-t border-surface-border">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold">9</span>
                <h2 className="text-lg sm:text-xl font-bold text-charcoal-900">Official Contact & Inquiries</h2>
              </div>
              <p className="text-sm text-charcoal-600 leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our compliance with the Google API Services User Data Policy, please contact our team directly:
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
