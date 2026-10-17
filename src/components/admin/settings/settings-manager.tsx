"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Store,
  Truck,
  Server,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Lock,
  Layers,
  MapPin,
  Info,
  Smartphone,
  Copy,
  Check,
  FileCode,
  KeyRound,
  Shield,
  CircleDollarSign,
  Save,
  Loader2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { SettingsViewData, DeliveryRuleConfig } from "@/types/settings.types";
import { formatBDT, toBanglaDigits } from "@/lib/utils";
import { updateAdminDeliverySettingsAction } from "@/lib/actions/admin-settings-actions";

interface SettingsManagerProps {
  data: SettingsViewData;
}

type TabType = "store" | "delivery" | "integrations" | "templates" | "security";

export function SettingsManager({ data }: SettingsManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("store");
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  // Delivery Rules State
  const [rules, setRules] = useState<DeliveryRuleConfig>(data.deliveryRules);
  const [insideDhakaInput, setInsideDhakaInput] = useState<string>(String(data.deliveryRules.insideDhakaFee));
  const [outsideDhakaInput, setOutsideDhakaInput] = useState<string>(String(data.deliveryRules.outsideDhakaFee));
  const [thresholdInput, setThresholdInput] = useState<string>(String(data.deliveryRules.freeDeliveryThreshold));

  const [isSaving, startSavingTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    insideDhakaFee?: string;
    outsideDhakaFee?: string;
    freeDeliveryThreshold?: string;
  }>({});

  const handleResetDelivery = () => {
    setInsideDhakaInput(String(rules.insideDhakaFee));
    setOutsideDhakaInput(String(rules.outsideDhakaFee));
    setThresholdInput(String(rules.freeDeliveryThreshold));
    setFeedback(null);
    setFieldErrors({});
  };

  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setFieldErrors({});

    const inside = Number(insideDhakaInput);
    const outside = Number(outsideDhakaInput);
    const threshold = Number(thresholdInput);

    const errs: Record<string, string> = {};
    if (isNaN(inside) || inside < 0) {
      errs.insideDhakaFee = "বৈধ ধনাত্মক সংখ্যা প্রদান করুন।";
    }
    if (isNaN(outside) || outside < 0) {
      errs.outsideDhakaFee = "বৈধ ধনাত্মক সংখ্যা প্রদান করুন।";
    }
    if (isNaN(threshold) || threshold < 0) {
      errs.freeDeliveryThreshold = "বৈধ ধনাত্মক সংখ্যা প্রদান করুন।";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    startSavingTransition(async () => {
      const res = await updateAdminDeliverySettingsAction({
        insideDhakaFee: inside,
        outsideDhakaFee: outside,
        freeDeliveryThreshold: threshold,
      });

      if (res.success && res.data) {
        setRules(res.data);
        setFeedback({ type: "success", message: res.message });
      } else {
        setFeedback({ type: "error", message: res.message });
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    });
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplateId(id);
    setTimeout(() => setCopiedTemplateId(null), 2000);
  };

  const tabs = [
    { id: "store" as TabType, labelBn: "স্টোর প্রোফাইল", icon: Store },
    { id: "delivery" as TabType, labelBn: "ডেলিভারি নীতি", icon: Truck },
    { id: "integrations" as TabType, labelBn: "সিস্টেম ও API হেলথ", icon: Server },
    { id: "templates" as TabType, labelBn: "নোটিফিকেশন প্রিভিউ", icon: MessageSquare },
    { id: "security" as TabType, labelBn: "অ্যাডমিন ও নিরাপত্তা", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 font-bengali">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-surface-border shadow-subtle overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? "bg-brand-700 text-white shadow-sm"
                  : "text-charcoal-500 hover:text-charcoal-900 hover:bg-surface-canvas/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-accent-amber" : "text-charcoal-400"}`} />
              <span>{tab.labelBn}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Store Profile */}
      {activeTab === "store" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Identity Card */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-surface-border shadow-subtle space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-charcoal-900">
                      প্রাতিষ্ঠানিক পরিচয় ও ব্র্যান্ড
                    </h2>
                    <p className="text-xs text-charcoal-500">
                      ওয়েবসাইট ও অফিসিয়াল ফন্ট-এ ব্যবহৃত স্টোর তথ্য
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ভেরিফাইড
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-surface-canvas/50 border border-surface-border/60">
                  <span className="text-xs text-charcoal-500 block mb-1">দোকানের নাম (বাংলা)</span>
                  <span className="text-sm font-bold text-charcoal-900">{data.storeProfile.nameBn}</span>
                </div>
                <div className="p-4 rounded-2xl bg-surface-canvas/50 border border-surface-border/60">
                  <span className="text-xs text-charcoal-500 block mb-1">দোকানের নাম (ইংরেজি)</span>
                  <span className="text-sm font-bold text-charcoal-900">{data.storeProfile.nameEn}</span>
                </div>
                <div className="sm:col-span-2 p-4 rounded-2xl bg-surface-canvas/50 border border-surface-border/60">
                  <span className="text-xs text-charcoal-500 block mb-1">ব্র্যান্ড স্লোগান (Official Tagline)</span>
                  <span className="text-sm font-bold text-brand-900">{data.storeProfile.taglineBn}</span>
                </div>
                <div className="p-4 rounded-2xl bg-surface-canvas/50 border border-surface-border/60">
                  <span className="text-xs text-charcoal-500 block mb-1">মুদ্রা (Currency)</span>
                  <span className="text-sm font-bold text-charcoal-900">{data.storeProfile.currency}</span>
                </div>
                <div className="p-4 rounded-2xl bg-surface-canvas/50 border border-surface-border/60">
                  <span className="text-xs text-charcoal-500 block mb-1">অপারেটিং অঞ্চল</span>
                  <span className="text-sm font-bold text-charcoal-900">{data.storeProfile.operatingCountry}</span>
                </div>
              </div>

              {/* Sourcing Origins */}
              <div className="pt-2">
                <span className="text-xs font-bold text-charcoal-700 block mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-700" />
                  <span>পণ্য সংগ্রহের প্রাকৃতিক উৎসসমূহ (Sourcing Origins)</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {data.storeProfile.sourcingOrigins.map((origin) => (
                    <span
                      key={origin}
                      className="text-xs px-3 py-1.5 rounded-xl bg-brand-50 text-brand-900 border border-brand-200/60 font-medium"
                    >
                      {origin}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Channels & Support */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-border shadow-subtle space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
                  <Phone className="w-4 h-4 text-brand-700" />
                  <h3 className="text-sm font-bold text-charcoal-900">যোগাযোগ চ্যানেলসমূহ</h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-surface-canvas/40 border border-surface-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] text-charcoal-400 block">WhatsApp ও হেল্পলাইন</span>
                        <span className="text-xs font-bold text-charcoal-900">{data.storeProfile.supportPhone}</span>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/88${data.storeProfile.supportPhone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-charcoal-400 hover:text-emerald-600 transition-colors"
                      title="হোয়াটসঅ্যাপে চ্যাট করুন"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-canvas/40 border border-surface-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] text-charcoal-400 block">সাপোর্ট ইমেইল</span>
                        <span className="text-xs font-bold text-charcoal-900">{data.storeProfile.supportEmail}</span>
                      </div>
                    </div>
                    <a
                      href={`mailto:${data.storeProfile.supportEmail}`}
                      className="p-1.5 text-charcoal-400 hover:text-amber-600 transition-colors"
                      title="ইমেইল পাঠান"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-canvas/40 border border-surface-border flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] text-charcoal-400 block">লাইভ ওয়েবসাইট ডোমেইন</span>
                        <span className="text-xs font-bold text-charcoal-900">{data.storeProfile.websiteUrl.replace("https://", "")}</span>
                      </div>
                    </div>
                    <a
                      href={data.storeProfile.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-charcoal-400 hover:text-blue-600 transition-colors"
                      title="ওয়েবসাইট দেখুন"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200/80 text-brand-900 text-xs">
                <span className="font-bold block mb-0.5">তথ্য উৎস:</span>
                এই তথ্যগুলো ফুটারে ও চেকআউটে কেন্দ্রীয়ভাবে প্রদর্শিত হয়।
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Delivery Rules (Editable) */}
      {activeTab === "delivery" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status & Notice Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-surface-border shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-charcoal-900">
                    ডেলিভারি চার্জ ও ফ্রি ডেলিভারি নীতি
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      rules.isFromDb
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {rules.isFromDb ? "লাইভ ডেটাবেস সক্রিয়" : "ডিফল্ট ফলব্যাক সক্রিয়"}
                  </span>
                </div>
                <p className="text-charcoal-500 leading-relaxed">
                  {rules.isFromDb
                    ? `সর্বশেষ আপডেট: ${rules.updatedAt ? new Date(rules.updatedAt).toLocaleString("bn-BD") : "সম্প্রতি"} (${rules.updatedBy || "Admin"})`
                    : "store_settings টেবিল সক্রিয় হলে এটি ডাটাবেসে স্থায়ীভাবে সংরক্ষিত হবে। বর্তমানে নিরাপদ ফলব্যাক মান কার্যকর রয়েছে।"}
                </p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-charcoal-400 bg-surface-canvas/60 px-3 py-1.5 rounded-xl border border-surface-border shrink-0">
              Source: {rules.sourceFilePath || "Server Settings"}
            </div>
          </div>

          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 transition-all animate-fadeIn ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                  : "bg-rose-50 text-rose-900 border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Live Rate Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Inside Dhaka */}
            <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ঢাকার ভেতরে
                  </span>
                </div>
                <span className="text-xs text-charcoal-400 block mb-1">কার্যকর হোম ডেলিভারি ফি</span>
                <div className="text-2xl sm:text-3xl font-black text-charcoal-900">
                  {formatBDT(rules.insideDhakaFee)}
                </div>
                <p className="text-xs text-charcoal-500 mt-2">
                  ঢাকা মেট্রোপলিটন এলাকার অর্ডারে প্রযোজ্য।
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-border/60 text-[11px] text-charcoal-400 flex items-center justify-between">
                <span>Zone: <code className="font-mono text-charcoal-700">inside_dhaka</code></span>
                <span className="font-bold text-emerald-700">সক্রিয়</span>
              </div>
            </div>

            {/* Outside Dhaka */}
            <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    ঢাকার বাইরে
                  </span>
                </div>
                <span className="text-xs text-charcoal-400 block mb-1">কার্যকর হোম ডেলিভারি ফি</span>
                <div className="text-2xl sm:text-3xl font-black text-charcoal-900">
                  {formatBDT(rules.outsideDhakaFee)}
                </div>
                <p className="text-xs text-charcoal-500 mt-2">
                  ঢাকার বাইরের জেলা, উপজেলা ও থানা পর্যায়ে।
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-border/60 text-[11px] text-charcoal-400 flex items-center justify-between">
                <span>Zone: <code className="font-mono text-charcoal-700">outside_dhaka</code></span>
                <span className="font-bold text-blue-700">সক্রিয়</span>
              </div>
            </div>

            {/* Free Delivery Threshold */}
            <div className="bg-white rounded-3xl p-6 border border-surface-border shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <CircleDollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    ফ্রি ডেলিভারি
                  </span>
                </div>
                <span className="text-xs text-charcoal-400 block mb-1">ন্যূনতম অর্ডার মূল্য</span>
                <div className="text-2xl sm:text-3xl font-black text-purple-900">
                  {formatBDT(rules.freeDeliveryThreshold)}
                </div>
                <p className="text-xs text-charcoal-500 mt-2">
                  অর্ডারের সাবটোটাল {toBanglaDigits(rules.freeDeliveryThreshold)}৳ বা তদূর্ধ্ব হলে ডেলিভারি সম্পূর্ণ ফ্রি।
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-border/60 text-[11px] text-charcoal-400 flex items-center justify-between">
                <span>Condition: <code className="font-mono text-charcoal-700">&gt;= {rules.freeDeliveryThreshold}</code></span>
                <span className="font-bold text-purple-700">সক্রিয়</span>
              </div>
            </div>
          </div>

          {/* Edit Form Card */}
          <form
            onSubmit={handleSaveDelivery}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-border shadow-subtle space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">
                    ডেলিভারি চার্জ ও ফ্রি ডেলিভারি সীমা সম্পাদন করুন
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    নতুন মান প্রদান করে সংরক্ষণ করুন। এটি চেকআউটের সার্ভার-সাইড গণনায় সরাসরি কার্যকর হবে।
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Field 1: Inside Dhaka */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal-800 block">
                  ঢাকার ভেতরে ডেলিভারি চার্জ (টাকা) <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-2xl border border-surface-border focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/20 bg-surface-canvas/30 overflow-hidden">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 font-bold text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="1"
                    value={insideDhakaInput}
                    onChange={(e) => setInsideDhakaInput(e.target.value)}
                    disabled={isSaving}
                    className="w-full py-2.5 pl-8 pr-4 bg-transparent text-sm font-bold text-charcoal-900 focus:outline-none"
                    placeholder="70"
                    required
                  />
                </div>
                {fieldErrors.insideDhakaFee ? (
                  <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.insideDhakaFee}</p>
                ) : (
                  <p className="text-[11px] text-charcoal-400">বর্তমান: {formatBDT(rules.insideDhakaFee)}</p>
                )}
              </div>

              {/* Field 2: Outside Dhaka */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal-800 block">
                  ঢাকার বাইরে ডেলিভারি চার্জ (টাকা) <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-2xl border border-surface-border focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/20 bg-surface-canvas/30 overflow-hidden">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 font-bold text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="1"
                    value={outsideDhakaInput}
                    onChange={(e) => setOutsideDhakaInput(e.target.value)}
                    disabled={isSaving}
                    className="w-full py-2.5 pl-8 pr-4 bg-transparent text-sm font-bold text-charcoal-900 focus:outline-none"
                    placeholder="130"
                    required
                  />
                </div>
                {fieldErrors.outsideDhakaFee ? (
                  <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.outsideDhakaFee}</p>
                ) : (
                  <p className="text-[11px] text-charcoal-400">বর্তমান: {formatBDT(rules.outsideDhakaFee)}</p>
                )}
              </div>

              {/* Field 3: Free Delivery Threshold */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-charcoal-800 block">
                  ফ্রি ডেলিভারি সীমা (টাকা) <span className="text-rose-500">*</span>
                </label>
                <div className="relative rounded-2xl border border-surface-border focus-within:border-brand-700 focus-within:ring-2 focus-within:ring-brand-700/20 bg-surface-canvas/30 overflow-hidden">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 font-bold text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="50"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                    disabled={isSaving}
                    className="w-full py-2.5 pl-8 pr-4 bg-transparent text-sm font-bold text-charcoal-900 focus:outline-none"
                    placeholder="2000"
                    required
                  />
                </div>
                {fieldErrors.freeDeliveryThreshold ? (
                  <p className="text-[11px] text-rose-600 font-medium">{fieldErrors.freeDeliveryThreshold}</p>
                ) : (
                  <p className="text-[11px] text-charcoal-400">বর্তমান: {formatBDT(rules.freeDeliveryThreshold)} বা তদূর্ধ্ব</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-surface-border/60">
              <span className="text-xs text-charcoal-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-brand-700" />
                <span>শুধুমাত্র অনুমোদিত অ্যাডমিনরা সেটিংস পরিবর্তন করতে পারেন।</span>
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleResetDelivery}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-surface-border bg-surface-canvas/60 text-charcoal-600 hover:text-charcoal-900 hover:bg-surface-canvas text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>রিসেট</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 flex-1 sm:flex-none"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>সেটিংস সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Payment Method Specification */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-border shadow-subtle space-y-4">
            <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-700" />
              <span>পেমেন্ট ও অর্ডার প্রসেসিং নীতি</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-surface-canvas/40 border border-surface-border">
                <span className="font-bold text-charcoal-800 block mb-1">ডিফল্ট পেমেন্ট মেথড:</span>
                <p className="text-charcoal-500 leading-relaxed">
                  ক্যাশ অন ডেলিভারি (Cash on Delivery — COD)। গ্রাহক পণ্য হাতে পেয়ে মূল্য পরিশোধ করবেন।
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-canvas/40 border border-surface-border">
                <span className="font-bold text-charcoal-800 block mb-1">কুপন ও ছাড়ের প্রভাব:</span>
                <p className="text-charcoal-500 leading-relaxed">
                  কুপন বা ডিসকাউন্ট সাবটোটালের ওপর প্রয়োগ হয়। ফ্রি শিপিং কুপন সক্রিয় হলে কার্যকর ডেলিভারি চার্জ সম্পূর্ণ মওকুফ হবে।
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System & Integrations */}
      {activeTab === "integrations" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Security Banner */}
          <div className="p-4 sm:p-5 rounded-3xl bg-brand-50 border border-brand-200/80 text-brand-900 flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold block text-sm">
                নিরাপদ ও রিড-অনলি ইন্টিগ্রেশন হেলথ অডিট
              </span>
              <p className="text-brand-800 leading-relaxed">
                কোনো সার্ভিস-রোল কি, পাসওয়ার্ড বা গোপন ক্রেডেনশিয়াল ব্রাউজারে পাঠানো হয়নি। যেখানে প্রকৃত সার্ভার সংযোগ প্রমাণিত হয়েছে শুধু সেখানেই &ldquo;সংযুক্ত&rdquo; দেখানো হয়েছে; বাকিগুলোতে সততার সঙ্গে স্ট্যাটাস নির্দেশ করা হয়েছে।
              </p>
            </div>
          </div>

          {/* Integration Services List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.integrations.map((svc) => {
              const isConnected = svc.status === "connected";
              const isConfigured = svc.status === "configured_unverified";
              const isNotConfigured = svc.status === "not_configured";

              return (
                <div
                  key={svc.id}
                  className="bg-white rounded-3xl p-6 border border-surface-border shadow-subtle flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isConnected
                              ? "bg-emerald-50 text-emerald-700"
                              : isConfigured
                              ? "bg-amber-50 text-amber-700"
                              : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-charcoal-900">{svc.name}</h4>
                          <span className="text-[10px] text-charcoal-400 uppercase tracking-wider font-mono">
                            {svc.category}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                          isConnected
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isConfigured
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-stone-100 text-stone-600 border-stone-200"
                        }`}
                      >
                        {isConnected ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : isConfigured ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{svc.statusLabelBn}</span>
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-500 leading-relaxed">
                      {svc.descriptionBn}
                    </p>
                  </div>

                  {svc.notesBn && (
                    <div className="mt-4 pt-3 border-t border-surface-border/60 text-[11px] text-charcoal-400">
                      নোট: {svc.notesBn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Notification Templates */}
      {activeTab === "templates" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Read-Only Disclaimer */}
          <div className="p-4 sm:p-5 rounded-3xl bg-surface-canvas border border-surface-border text-charcoal-700 flex items-start gap-3.5">
            <Smartphone className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold block text-sm">
                নোটিফিকেশন মেসেজ প্রিভিউ (নমুনা মাত্র)
              </span>
              <p className="text-charcoal-500 leading-relaxed">
                এটি শুধুমাত্র কাস্টমারদের পাঠানো মেসেজের স্ট্যান্ডার্ড ফরম্যাট দেখার জন্য। এখান থেকে কোনো বাস্তব SMS বা বার্তা পাঠানো হয় না।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.notificationTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-surface-border shadow-subtle space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 uppercase">
                        {template.channel}
                      </span>
                      <h4 className="text-sm font-bold text-charcoal-900">{template.titleBn}</h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(template.id, template.sampleMessageBn)}
                      className="text-xs text-charcoal-400 hover:text-brand-700 flex items-center gap-1 transition-colors"
                      title="টেমপ্লেট কপি করুন"
                    >
                      {copiedTemplateId === template.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>কপি</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Mock Message Bubble */}
                  <div className="p-4 rounded-2xl bg-surface-canvas/60 border border-surface-border text-xs text-charcoal-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {template.sampleMessageBn}
                  </div>
                </div>

                {/* Variables List */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-charcoal-500 block mb-2">
                    ডায়নামিক ভ্যারিয়েবলসমূহ:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {template.variables.map((v) => (
                      <code
                        key={v}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-surface-canvas text-charcoal-600 font-mono border border-surface-border"
                      >
                        {v}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Admin Security */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-surface-border shadow-subtle space-y-6 max-w-3xl">
            <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-charcoal-900">
                  অ্যাডমিন প্রোফাইল ও সেশন তথ্য
                </h3>
                <p className="text-xs text-charcoal-500">
                  আপনার বর্তমান লগইন সেশন এবং অ্যাকাউন্ট নিরাপত্তা
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-canvas/50 border border-surface-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-charcoal-400 block mb-0.5">লগইনকৃত অ্যাডমিন ইমেইল</span>
                  <span className="text-sm font-bold text-charcoal-900 font-mono">{data.adminSecurity.adminEmail || "অজ্ঞাত"}</span>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {data.adminSecurity.role}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-canvas/50 border border-surface-border">
                <span className="text-xs text-charcoal-400 block mb-0.5">অথেনটিকেশন ইঞ্জিন</span>
                <span className="text-sm font-semibold text-charcoal-800">{data.adminSecurity.authProvider}</span>
                <p className="text-xs text-charcoal-500 mt-1">
                  সার্ভার-সাইড কুকি বেসড সেশন। প্রতি রিকোয়েস্টে সুরক্ষিত টোকেন ভেরিফিকেশন করা হয়।
                </p>
              </div>
            </div>

            {/* Password Reset Action */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-brand-50/70 border border-brand-200/80">
              <div className="flex items-center gap-3">
                <KeyRound className="w-5 h-5 text-brand-700 shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-brand-900">পাসওয়ার্ড পরিবর্তন করতে চান?</h4>
                  <p className="text-xs text-brand-800">নিরাপদ পাসওয়ার্ড রিসেট প্যানেল ব্যবহার করুন।</p>
                </div>
              </div>
              <Link
                href={data.adminSecurity.resetPasswordPath}
                className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold transition-all text-center shrink-0 shadow-sm"
              >
                পাসওয়ার্ড পরিবর্তন করুন
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
