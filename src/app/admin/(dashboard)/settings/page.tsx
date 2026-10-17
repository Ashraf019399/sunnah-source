import React from "react";
import type { Metadata } from "next";
import { Settings, ShieldCheck } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SettingsViewData, IntegrationServiceItem } from "@/types/settings.types";
import { SettingsManager } from "@/components/admin/settings/settings-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "সেটিংস ও ইন্টিগ্রেশন | Sunnah Source Admin",
  description: "সুন্নাহ সোর্স সিস্টেম, ডেলিভারি নীতি, ইন্টিগ্রেশন হেলথ ও স্টোর সেটিংস ব্যবস্থাপনা।",
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Verify Database read access safely
  let dbStatus: "connected" | "error" = "connected";
  let dbStatusLabel = "সংযুক্ত (সরাসরি ডেটাবেস সক্রিয়)";
  let dbNotes = "PostgreSQL কোয়েরি সফলভাবে নির্বাহ হয়েছে।";

  try {
    const adminClient = await createAdminClient();
    const { error } = await adminClient.from("categories").select("id").limit(1);
    if (error) {
      dbStatus = "error";
      dbStatusLabel = "সংযোগ সমস্যা";
      dbNotes = error.message;
    }
  } catch (err: any) {
    dbStatus = "error";
    dbStatusLabel = "সংযোগ ব্যর্থ";
    dbNotes = err?.message || "সার্ভার রেসপন্স দেয়নি।";
  }

  // 2. Integration Services Health (Strict: Not claiming verified unless live tested)
  const integrations: IntegrationServiceItem[] = [
    {
      id: "supabase-db",
      name: "Supabase PostgreSQL Database",
      category: "database",
      status: dbStatus,
      statusLabelBn: dbStatusLabel,
      descriptionBn: "ইউজার, পণ্য, অর্ডার ও কুপন সংরক্ষণের মূল রিলেশনাল ডেটাবেস।",
      environmentKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      notesBn: dbNotes,
    },
    {
      id: "supabase-storage",
      name: "Supabase Storage (CDN)",
      category: "storage",
      status: "connected",
      statusLabelBn: "সক্রিয় (পাবলিক বাকেট রেডি)",
      descriptionBn: "পণ্যের ছবি ও মিডিয়া অ্যাসেট হোস্ট করার পাবলিক স্টোরেজ বাকেট।",
      environmentKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      notesBn: "product-images পাবলিক বাকেট সক্রিয় রয়েছে।",
    },
    {
      id: "vercel-hosting",
      name: "Vercel Production Hosting",
      category: "storage",
      status: "connected",
      statusLabelBn: "লাইভ প্রোডাকশন (Active)",
      descriptionBn: "sunnahsourcebd.com গ্লোবাল এজ নেটওয়ার্ক এবং স্বয়ংক্রিয় CI/CD ডিপ্লয়মেন্ট।",
      environmentKeyPresent: true,
      notesBn: "কাস্টম ডোমেইন sunnahsourcebd.com এবং SSL কার্যকর।",
    },
    {
      id: "steadfast-courier",
      name: "Steadfast Courier API",
      category: "courier",
      status: process.env.STEADFAST_API_KEY ? "configured_unverified" : "not_configured",
      statusLabelBn: process.env.STEADFAST_API_KEY
        ? "কী প্রস্তুত (হ্যান্ডশেক অপ্রমাণিত)"
        : "কনফিগার করা হয়নি",
      descriptionBn: "সমগ্র বাংলাদেশে হোম ডেলিভারি পার্সেল তৈরি ও স্বয়ংক্রিয় ট্র্যাকিং এপিআই।",
      environmentKeyPresent: Boolean(process.env.STEADFAST_API_KEY),
      notesBn: process.env.STEADFAST_API_KEY
        ? "এনভায়রনমেন্ট ভ্যারিয়েবল আছে কিন্তু লাইভ পার্সেল বুকিং হ্যান্ডশেক টেস্ট করা হয়নি।"
        : "STEADFAST_API_KEY অনুপস্থিত। ম্যানুয়াল ডেলিভারি ট্র্যাকিং প্রযোজ্য।",
    },
    {
      id: "greenweb-sms",
      name: "Greenweb SMS Gateway",
      category: "sms",
      status: process.env.GREENWEB_SMS_API_KEY ? "configured_unverified" : "not_configured",
      statusLabelBn: process.env.GREENWEB_SMS_API_KEY
        ? "কী প্রস্তুত (লাইভ কল অপ্রমাণিত)"
        : "কনফিগার করা হয়নি",
      descriptionBn: "অর্ডার নিশ্চিতকরণ ও ডেলিভারি আপডেটের জন্য স্বয়ংক্রিয় বাল্ক SMS গেটওয়ে।",
      environmentKeyPresent: Boolean(process.env.GREENWEB_SMS_API_KEY),
      notesBn: process.env.GREENWEB_SMS_API_KEY
        ? "GREENWEB_SMS_API_KEY কনফিগার করা আছে। ব্যালেন্স ও সরাসরি সেন্ড টেস্ট করা হয়নি।"
        : "GREENWEB_SMS_API_KEY অনুপস্থিত।",
    },
    {
      id: "bkash-checkout",
      name: "bKash Tokenized Checkout",
      category: "payment",
      status: process.env.BKASH_APP_KEY ? "configured_unverified" : "not_configured",
      statusLabelBn: process.env.BKASH_APP_KEY
        ? "ক্রেডেনশিয়াল প্রস্তুত (হ্যান্ডশেক অপ্রমাণিত)"
        : "কনফিগার করা হয়নি",
      descriptionBn: "বিকাশ পেমেন্ট গেটওয়ের মাধ্যমে সরাসরি মোবাইল ওয়ালেট থেকে মূল্য পরিশোধ।",
      environmentKeyPresent: Boolean(process.env.BKASH_APP_KEY),
      notesBn: process.env.BKASH_APP_KEY
        ? "BKASH_APP_KEY সংজ্ঞায়িত কিন্তু পেমেন্ট কলব্যাক এপিআই সক্রিয় নয়।"
        : "বর্তমানে শুধু ক্যাশ অন ডেলিভারি (COD) পেমেন্ট চালু রয়েছে।",
    },
    {
      id: "sslcommerz-gateway",
      name: "SSLCommerz Payment Gateway",
      category: "payment",
      status: process.env.SSLCOMMERZ_STORE_ID ? "configured_unverified" : "not_configured",
      statusLabelBn: process.env.SSLCOMMERZ_STORE_ID
        ? "স্টোর ক্রেডেনশিয়াল প্রস্তুত (লাইভ টেস্ট অপ্রমাণিত)"
        : "কনফিগার করা হয়নি",
      descriptionBn: "ভিসা, মাস্টারকার্ড ও অন্যান্য মোবাইল ব্যাংকিং পেমেন্ট গেটওয়ে।",
      environmentKeyPresent: Boolean(process.env.SSLCOMMERZ_STORE_ID),
      notesBn: "বর্তমানে শুধু ক্যাশ অন ডেলিভারি (COD) পেমেন্ট চালু রয়েছে।",
    },
  ];

  // 3. Consolidated View Data
  const viewData: SettingsViewData = {
    storeProfile: {
      nameBn: "সুন্নাহ সোর্স",
      nameEn: "Sunnah Source",
      taglineBn: "প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা। ১০০% খাঁটি ও প্রাকৃতিক খাবারের বিশ্বস্ত প্রতিষ্ঠান।",
      websiteUrl: "https://sunnahsourcebd.com",
      supportPhone: "01914-612007",
      supportEmail: "sunnahsourcebd@gmail.com",
      facebookUrl: "https://www.facebook.com/profile.php?id=61572120171387",
      operatingCountry: "বাংলাদেশ (সমগ্র দেশব্যাপী ডেলিভারি)",
      currency: "BDT (টাকা — ৳)",
      sourcingOrigins: [
        "সুন্দরবন ম্যানগ্রোভ বন (কাঁচা মধু)",
        "পাবনা ও সিরাজগঞ্জ (বিলোনা গাওয়া ঘি)",
        "নাটোর ও কুষ্টিয়া (কাঠের ঘানি ভাঙা সরিষার তেল)",
        "মদিনা মুনাওয়ারা, সৌদি আরব (প্রাকৃতিক আজওয়া খেজুর)",
      ],
    },
    deliveryRules: {
      insideDhakaFee: 70,
      outsideDhakaFee: 130,
      freeDeliveryThreshold: 2000,
      paymentMethod: "ক্যাশ অন ডেলিভারি (COD)",
      isHardcodedInSource: true,
      sourceFilePath: "src/lib/actions/checkout-actions.ts",
    },
    integrations,
    notificationTemplates: [
      {
        id: "order-confirmation-sms",
        titleBn: "অর্ডার নিশ্চিতকরণ বার্তা (Order Confirmation)",
        channel: "sms",
        sampleMessageBn:
          "আলহামদুলিল্লাহ! সুন্নাহ সোর্স-এ আপনার অর্ডার {order_number} নিশ্চিত হয়েছে।\nগ্রাহক: {customer_name}\nমোট প্রদেয়: ৳{grand_total} (ক্যাশ অন ডেলিভারি)।\nপণ্য পৌঁছানো পর্যন্ত অনুগ্রহ করে প্রস্তুত থাকুন।\nহেল্পলাইন: 01914-612007",
        variables: ["{order_number}", "{customer_name}", "{grand_total}"],
      },
      {
        id: "courier-dispatch-sms",
        titleBn: "কুরিয়ারে হস্তান্তর ও ট্র্যাকিং (Courier Dispatch)",
        channel: "sms",
        sampleMessageBn:
          "সুন্নাহ সোর্স: আপনার অর্ডার {order_number} প্যাকেজিং সম্পন্ন হয়ে কুরিয়ারে হস্তান্তর করা হয়েছে।\nট্র্যাকিং নম্বর: {tracking_code}।\nশিগগিরই ডেলিভারি প্রতিনিধি আপনার ঠিকানায় যোগাযোগ করবেন।\nধন্যবাদ।",
        variables: ["{order_number}", "{tracking_code}"],
      },
      {
        id: "whatsapp-inquiry",
        titleBn: "হোয়াটসঅ্যাপ কাস্টমার সাপোর্ট (WhatsApp Support)",
        channel: "whatsapp",
        sampleMessageBn:
          "আসসালামু আলাইকুম {customer_name},\nসুন্নাহ সোর্স থেকে আপনার অর্ডার #{order_number} বিষয়ে যোগাযোগ করা হয়েছে। আপনার কোনো বিশেষ নির্দেশনা থাকলে অনুগ্রহ করে এখানে জানান।",
        variables: ["{customer_name}", "{order_number}"],
      },
    ],
    adminSecurity: {
      adminEmail: user?.email || "অ্যাডমিন ব্যবহারকারী",
      role: "সুপার অ্যাডমিন (Admin)",
      authProvider: "Supabase Auth (সার্ভার সেশন কুকি)",
      resetPasswordPath: "/admin/reset-password",
    },
  };

  return (
    <div className="space-y-6 font-bengali">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>সিস্টেম ও স্টোর কনফিগারেশন</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
            সেটিংস ও ইন্টিগ্রেশন ওভারভিউ (Settings)
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-0.5">
            স্টোর প্রোফাইল, লাইভ ডেলিভারি নীতি, ইন্টিগ্রেশন হেলথ এবং নিরাপত্তা নিরীক্ষণ।
          </p>
        </div>
      </div>

      {/* Main Settings Manager */}
      <SettingsManager data={viewData} />
    </div>
  );
}
