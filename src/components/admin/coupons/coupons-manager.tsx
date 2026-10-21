"use client";

import React, { useState, useTransition, useMemo, useCallback } from "react";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Copy,
  Calendar,
  Percent,
  Banknote,
  Search,
  Filter,
  Info,
  Clock,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import type { Coupon, CouponFormData, CouponDiscountType } from "@/types/coupons.types";
import {
  addAdminCoupon,
  updateAdminCoupon,
  toggleCouponStatus,
  deleteAdminCoupon,
} from "@/lib/actions/admin-coupon-actions";
import { formatBDT } from "@/lib/utils";

// ─── Types & Constants ────────────────────────────────────────────────────────

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

type FormMode = "add" | "edit";

const EMPTY_FORM: CouponFormData = {
  code: "",
  discountType: "percentage",
  discountValue: 10,
  minOrderAmount: 0,
  maxDiscountAmount: null,
  usageLimit: null,
  startDate: null,
  expiryDate: null,
  isActive: true,
  description: "",
};

interface CouponsManagerProps {
  initialCoupons: Coupon[];
  isUsingLiveDb: boolean;
}

export function CouponsManager({
  initialCoupons,
  isUsingLiveDb,
}: CouponsManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "expired">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "percentage" | "fixed" | "free_shipping">("all");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  // Copy Feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Transitions
  const [isPending, startTransition] = useTransition();

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Helper: check if a coupon is expired
  const isCouponExpired = (coupon: Coupon): boolean => {
    if (!coupon.expiryDate) return false;
    const exp = new Date(coupon.expiryDate).getTime();
    return !isNaN(exp) && exp < Date.now();
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.isActive && !isCouponExpired(c)).length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    const expiredOrInactive = coupons.filter((c) => !c.isActive || isCouponExpired(c)).length;
    return { total, active, totalRedemptions, expiredOrInactive };
  }, [coupons]);

  // Filtered coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      // Search
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchCode = c.code.toLowerCase().includes(q);
        const matchDesc = (c.description || "").toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }

      // Status filter
      const expired = isCouponExpired(c);
      if (statusFilter === "active") {
        if (!c.isActive || expired) return false;
      } else if (statusFilter === "inactive") {
        if (c.isActive) return false;
      } else if (statusFilter === "expired") {
        if (!expired) return false;
      }

      // Type filter
      if (typeFilter !== "all" && c.discountType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [coupons, searchQuery, statusFilter, typeFilter]);

  // Open Add Modal
  const openAddModal = () => {
    setFormMode("add");
    setEditingCouponId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (coupon: Coupon) => {
    setFormMode("edit");
    setEditingCouponId(coupon.id);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount ?? null,
      usageLimit: coupon.usageLimit ?? null,
      startDate: coupon.startDate ? coupon.startDate.split("T")[0] : null,
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split("T")[0] : null,
      isActive: coupon.isActive,
      description: coupon.description || "",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const cleanCode = (formData.code || "").trim().toUpperCase();
    if (!cleanCode) {
      errors.code = "কুপন কোড আবশ্যক।";
    } else if (!/^[A-Z0-9_-]{3,30}$/.test(cleanCode)) {
      errors.code = "শুধুমাত্র ইংরেজি বড় হাতের বর্ণ, সংখ্যা ও হাইফেন দিন (৩-৩০ অক্ষর)।";
    }

    if (!formData.discountValue || formData.discountValue <= 0) {
      errors.discountValue = "সঠিক ডিসকাউন্ট মান লিখুন (০ এর বেশি)।";
    } else if (formData.discountType === "percentage" && formData.discountValue > 100) {
      errors.discountValue = "শতাংশ ডিসকাউন্ট সর্বোচ্চ ১০০% হতে পারে।";
    }

    if (formData.minOrderAmount < 0) {
      errors.minOrderAmount = "ন্যূনতম অর্ডার ঋণাত্মক হতে পারে না।";
    }

    if (
      typeof formData.maxDiscountAmount === "number" &&
      formData.maxDiscountAmount <= 0
    ) {
      errors.maxDiscountAmount = "সর্বোচ্চ ডিসকাউন্ট সীমা ০ এর বেশি হতে হবে।";
    }

    if (typeof formData.usageLimit === "number" && formData.usageLimit <= 0) {
      errors.usageLimit = "ব্যবহারের সীমা অন্তত ১ হতে হবে।";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: CouponFormData = {
      ...formData,
      code: formData.code.trim().toUpperCase(),
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
      expiryDate: formData.expiryDate
        ? new Date(`${formData.expiryDate}T23:59:59Z`).toISOString()
        : null,
    };

    startTransition(async () => {
      if (formMode === "add") {
        const res = await addAdminCoupon(payload);
        if (res.success) {
          addToast("success", res.message || "কুপন তৈরি সফল হয়েছে!");
          setModalOpen(false);
          // Optimistically append if not in live DB or refresh
          const newCoupon: Coupon = {
            id: "cpn-" + Date.now(),
            code: payload.code,
            discountType: payload.discountType,
            discountValue: payload.discountValue,
            minOrderAmount: payload.minOrderAmount,
            maxDiscountAmount: payload.maxDiscountAmount,
            usageLimit: payload.usageLimit,
            usedCount: 0,
            startDate: payload.startDate,
            expiryDate: payload.expiryDate,
            isActive: payload.isActive,
            description: payload.description,
            createdAt: new Date().toISOString(),
          };
          setCoupons((prev) => [newCoupon, ...prev]);
        } else {
          addToast("error", res.message || "কুপন তৈরিতে সমস্যা হয়েছে।");
        }
      } else if (formMode === "edit" && editingCouponId) {
        const res = await updateAdminCoupon(editingCouponId, payload);
        if (res.success) {
          addToast("success", res.message || "কুপন আপডেট সফল হয়েছে!");
          setModalOpen(false);
          setCoupons((prev) =>
            prev.map((c) =>
              c.id === editingCouponId
                ? {
                    ...c,
                    ...payload,
                    updatedAt: new Date().toISOString(),
                  }
                : c
            )
          );
        } else {
          addToast("error", res.message || "কুপন আপডেটে সমস্যা হয়েছে।");
        }
      }
    });
  };

  // Handle Status Toggle
  const handleToggleStatus = (coupon: Coupon) => {
    const newStatus = !coupon.isActive;

    // Optimistic update
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: newStatus } : c))
    );

    startTransition(async () => {
      const res = await toggleCouponStatus(coupon.id, newStatus);
      if (res.success) {
        addToast("success", res.message || "স্ট্যাটাস পরিবর্তন সফল হয়েছে।");
      } else {
        // Rollback
        setCoupons((prev) =>
          prev.map((c) => (c.id === coupon.id ? { ...c, isActive: coupon.isActive } : c))
        );
        addToast("error", res.message || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।");
      }
    });
  };

  // Handle Delete
  const handleDeleteConfirm = () => {
    if (!couponToDelete) return;

    const targetId = couponToDelete.id;
    const targetCode = couponToDelete.code;

    // Optimistic delete
    setCoupons((prev) => prev.filter((c) => c.id !== targetId));
    setDeleteModalOpen(false);
    setCouponToDelete(null);

    startTransition(async () => {
      const res = await deleteAdminCoupon(targetId);
      if (res.success) {
        addToast("success", `কুপন "${targetCode}" মুছে ফেলা হয়েছে।`);
      } else {
        // Rollback
        if (couponToDelete) {
          setCoupons((prev) => [couponToDelete, ...prev]);
        }
        addToast("error", res.message || "কুপন মুছে ফেলা যায়নি।");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Database Permission Notice Banner */}
      {!isUsingLiveDb && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-subtle">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <strong className="block text-amber-950 font-bold mb-0.5">
              ডাটাবেস পারমিশন নোটিশ (Permission 42501 Pending):
            </strong>
            Supabase-এ <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950 text-xs">public.coupons</code> টেবিলের পারমিশন এখনো গ্রান্ট করা হয়নি। কুপন ম্যানেজমেন্ট এবং চেকআউট ডিসকাউন্ট সক্রিয় করার জন্য অনুগ্রহ করে প্রস্তুতকৃত মাইগ্রেশন SQL স্ক্রিপ্টটি Supabase SQL Editor-এ রান করে পারমিশন গ্রান্ট করুন।
          </div>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-charcoal-500">মোট কুপন</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-charcoal-900">{stats.total}</div>
          <span className="text-[11px] text-charcoal-400 mt-1">সর্বমোট ডিসকাউন্ট ক্যাম্পেইন</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-charcoal-500">সক্রিয় কুপন</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700">{stats.active}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1">বর্তমানে ব্যবহারে কার্যকর</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-charcoal-500">মোট ব্যবহার</span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-brand-700">{stats.totalRedemptions}</div>
          <span className="text-[11px] text-charcoal-400 mt-1">গ্রাহকদের সফল অর্ডার ব্যবহার</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-surface-border shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-charcoal-500">নিষ্ক্রিয় / মেয়াদোত্তীর্ণ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-600">{stats.expiredOrInactive}</div>
          <span className="text-[11px] text-charcoal-400 mt-1">অকার্যকর বা মেয়াদোত্তীর্ণ</span>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="কুপন কোড বা বিবরণ লিখে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-surface-border bg-surface-canvas/50 text-xs sm:text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all placeholder:text-charcoal-400"
            />
          </div>

          {/* Add Coupon Button */}
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-subtle active:scale-[0.98] transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন কুপন যোগ করুন</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-border/60 text-xs">
          <span className="text-charcoal-500 font-bold flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>স্ট্যাটাস:</span>
          </span>
          {[
            { id: "all" as const, label: "সকল কুপন" },
            { id: "active" as const, label: "সক্রিয়" },
            { id: "expired" as const, label: "মেয়াদোত্তীর্ণ" },
            { id: "inactive" as const, label: "নিষ্ক্রিয়" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-full font-bold transition-all ${
                statusFilter === tab.id
                  ? "bg-brand-700 text-white shadow-subtle"
                  : "bg-surface-canvas text-charcoal-600 hover:bg-surface-border/60 border border-surface-border/60"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <span className="text-charcoal-300 mx-1">|</span>

          <span className="text-charcoal-500 font-bold shrink-0">ধরন:</span>
          {[
            { id: "all" as const, label: "সব ধরন" },
            { id: "percentage" as const, label: "শতাংশ (%)" },
            { id: "fixed" as const, label: "ফিক্সড (৳)" },
            { id: "free_shipping" as const, label: "ফ্রি ডেলিভারি" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-2.5 py-1 rounded-full font-bold transition-all ${
                typeFilter === tab.id
                  ? "bg-purple-700 text-white shadow-subtle"
                  : "bg-surface-canvas text-charcoal-600 hover:bg-surface-border/60 border border-surface-border/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons List */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-surface-border shadow-subtle text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto">
            <Tag className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-charcoal-900">কোনো কুপন পাওয়া যায়নি</h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            আপনার ফিল্টার বা অনুসন্ধানের সাথে মেলে এমন কোনো কুপন কোড নেই।
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-700 text-white text-xs font-bold hover:bg-brand-800 transition-colors shadow-subtle"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন কুপন তৈরি করুন</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => {
            const expired = isCouponExpired(coupon);
            const usagePercent =
              coupon.usageLimit && coupon.usageLimit > 0
                ? Math.min(100, Math.round(((coupon.usedCount || 0) / coupon.usageLimit) * 100))
                : null;

            return (
              <div
                key={coupon.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-subtle hover:shadow-card ${
                  !coupon.isActive
                    ? "border-stone-200 opacity-75 bg-stone-50/50"
                    : expired
                    ? "border-rose-200 bg-rose-50/20"
                    : "border-surface-border hover:border-brand-700/40"
                }`}
              >
                <div>
                  {/* Top Bar: Code & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-base font-black px-2.5 py-1 rounded-lg bg-surface-canvas border border-surface-border text-brand-900 tracking-wider">
                        {coupon.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        className="p-1.5 rounded-lg text-charcoal-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                        title="কোড কপি করুন"
                      >
                        {copiedCode === coupon.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {expired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          মেয়াদোত্তীর্ণ
                        </span>
                      ) : coupon.isActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          সক্রিয়
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 text-charcoal-600 border border-stone-300">
                          নিষ্ক্রিয়
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Discount Value Display */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-xl sm:text-2xl font-black text-charcoal-900 font-mono">
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}%`
                        : coupon.discountType === "free_shipping"
                        ? "১০০% ফ্রি"
                        : formatBDT(coupon.discountValue)}
                    </span>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      {coupon.discountType === "percentage"
                        ? "শতাংশ ছাড়"
                        : coupon.discountType === "free_shipping"
                        ? "ফ্রি ডেলিভারি"
                        : "ফিক্সড ছাড়"}
                    </span>
                  </div>

                  {/* Description */}
                  {coupon.description && (
                    <p className="text-xs text-charcoal-600 leading-relaxed mb-3 line-clamp-2">
                      {coupon.description}
                    </p>
                  )}

                  {/* Rules & Constraints Grid */}
                  <div className="space-y-1.5 text-[11px] text-charcoal-600 pt-2 border-t border-surface-border/60">
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-400">ন্যূনতম অর্ডার:</span>
                      <span className="font-bold font-mono">
                        {coupon.minOrderAmount > 0
                          ? formatBDT(coupon.minOrderAmount)
                          : "কোনো সীমা নেই"}
                      </span>
                    </div>

                    {coupon.discountType === "percentage" && coupon.maxDiscountAmount && (
                      <div className="flex justify-between items-center">
                        <span className="text-charcoal-400">সর্বোচ্চ ছাড়ের সীমা:</span>
                        <span className="font-bold font-mono text-brand-700">
                          {formatBDT(coupon.maxDiscountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-400">ব্যবহার সংখ্যা:</span>
                      <span className="font-bold font-mono">
                        {coupon.usedCount || 0}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit} বার` : " বার (আনলিমিটেড)"}
                      </span>
                    </div>

                    {/* Usage Progress Bar */}
                    {usagePercent !== null && (
                      <div className="w-full bg-surface-canvas rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            usagePercent >= 100
                              ? "bg-rose-500"
                              : usagePercent > 75
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-charcoal-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>মেয়াদ শেষ:</span>
                      </span>
                      <span
                        className={`font-mono font-medium ${
                          expired ? "text-rose-600 font-bold" : "text-charcoal-800"
                        }`}
                      >
                        {coupon.expiryDate
                          ? new Date(coupon.expiryDate).toLocaleDateString("bn-BD", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "আজীবন কার্যকর"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Card */}
                <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
                  {/* Status Toggle Switch */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={coupon.isActive}
                      onChange={() => handleToggleStatus(coupon)}
                      disabled={isPending}
                      className="sr-only"
                    />
                    <div
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        coupon.isActive ? "bg-emerald-600" : "bg-stone-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm ${
                          coupon.isActive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-charcoal-600">
                      {coupon.isActive ? "সক্রিয়" : "বন্ধ"}
                    </span>
                  </label>

                  {/* Edit and Delete Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(coupon)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-charcoal-500 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                      title="সম্পাদনা করুন"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCouponToDelete(coupon);
                        setDeleteModalOpen(true);
                      }}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-charcoal-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create / Edit Modal ────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-bengali">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-surface-border shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-charcoal-900">
                    {formMode === "add" ? "নতুন কুপন তৈরি করুন" : "কুপন সম্পাদনা করুন"}
                  </h3>
                  <p className="text-[11px] text-charcoal-500">
                    {formMode === "add"
                      ? "নতুন ডিসকাউন্ট ক্যাম্পেইন চালু করতে বিবরণ পূরণ করুন"
                      : `"${formData.code}" কুপনের শর্তাদি পরিবর্তন করুন`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-charcoal-400 hover:text-charcoal-700 hover:bg-surface-canvas transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  কুপন কোড (Coupon Code) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="যেমন: SUNNAH15 বা EID500"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border uppercase font-mono tracking-wider font-bold text-xs sm:text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all"
                />
                {formErrors.code && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {formErrors.code}
                  </p>
                )}
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    ডিসকাউন্টের ধরন <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-canvas rounded-xl border border-surface-border">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: "percentage" })}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                        formData.discountType === "percentage"
                          ? "bg-white text-purple-800 shadow-subtle border border-surface-border/60"
                          : "text-charcoal-600 hover:text-charcoal-900"
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>শতাংশ (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, discountType: "fixed" })}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                        formData.discountType === "fixed"
                          ? "bg-white text-brand-800 shadow-subtle border border-surface-border/60"
                          : "text-charcoal-600 hover:text-charcoal-900"
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>ফিক্সড (৳)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    ছাড়ের পরিমাণ <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max={formData.discountType === "percentage" ? 100 : 100000}
                      value={formData.discountValue || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountValue: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder={formData.discountType === "percentage" ? "১০" : "১০০"}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border font-mono text-xs sm:text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all font-bold"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-charcoal-400">
                      {formData.discountType === "percentage" ? "%" : "৳"}
                    </span>
                  </div>
                  {formErrors.discountValue && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {formErrors.discountValue}
                    </p>
                  )}
                </div>
              </div>

              {/* Minimum Order & Max Discount Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    ন্যূনতম অর্ডার মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minOrderAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="০ (কোনো শর্ত নেই)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border font-mono text-xs sm:text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all"
                  />
                  <span className="text-[10px] text-charcoal-400 mt-0.5 block">
                    কত টাকার পণ্য কিনলে কুপন কাজ করবে
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    সর্বোচ্চ ছাড়ের সীমা (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={formData.discountType !== "percentage"}
                    value={formData.maxDiscountAmount ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountAmount: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder={
                      formData.discountType === "percentage"
                        ? "যেমন: ৩০০ (ঐচ্ছিক)"
                        : "ফিক্সড ছাড়া প্রযোজ্য নয়"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border font-mono text-xs sm:text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all disabled:bg-stone-100 disabled:text-stone-400"
                  />
                  <span className="text-[10px] text-charcoal-400 mt-0.5 block">
                    শতাংশ হারে সর্বোচ্চ কত টাকা ছাড় হবে
                  </span>
                </div>
              </div>

              {/* Usage Limit & Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    ব্যবহারের সর্বোচ্চ সীমা
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageLimit: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                    placeholder="খালি রাখলে সীমাহীন"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border font-mono text-xs sm:text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all"
                  />
                  <span className="text-[10px] text-charcoal-400 mt-0.5 block">
                    মোট কতবার কুপনটি ব্যবহার করা যাবে
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    মেয়াদ শেষের তারিখ
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value || null })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-border text-xs sm:text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all"
                  />
                  <span className="text-[10px] text-charcoal-400 mt-0.5 block">
                    খালি রাখলে কুপনটি আজীবন চলবে
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  বিবরণ বা অফার নোট
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="যেমন: ঈদুল ফিতর উপলক্ষে বিশেষ ১০% ছাড় (সর্বোচ্চ ৩০০ টাকা)"
                  className="w-full px-3.5 py-2 rounded-xl border border-surface-border text-xs text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-all resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-canvas border border-surface-border/70">
                <div>
                  <span className="text-xs font-bold text-charcoal-900 block">কুপন সক্রিয় রাখুন</span>
                  <span className="text-[11px] text-charcoal-500">
                    বন্ধ থাকলে গ্রাহকরা এটি চেকআউটে ব্যবহার করতে পারবেন না
                  </span>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      formData.isActive ? "bg-emerald-600" : "bg-stone-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm ${
                        formData.isActive ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>
              </div>

              {/* Real-time Preview Badge */}
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                  %
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-purple-900 tracking-wider">
                      {formData.code || "কোড লিখুন"}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-200 text-purple-950">
                      {formData.discountType === "percentage"
                        ? `${formData.discountValue || 0}% ছাড়`
                        : `৳${formData.discountValue || 0} ছাড়`}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800 mt-0.5 line-clamp-1">
                    {formData.minOrderAmount > 0
                      ? `ন্যূনতম অর্ডার ৳${formData.minOrderAmount}`
                      : "কোনো ন্যূনতম অর্ডারের শর্ত নেই"}
                    {formData.maxDiscountAmount && formData.discountType === "percentage"
                      ? ` • সর্বোচ্চ ছাড় ৳${formData.maxDiscountAmount}`
                      : ""}
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl border border-surface-border text-charcoal-700 hover:bg-surface-canvas text-xs font-bold transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-2 shadow-subtle transition-all active:scale-95"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>সেভ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{formMode === "add" ? "কুপন তৈরি করুন" : "পরিবর্তন সেভ করুন"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ────────────────────────────────────── */}
      {deleteModalOpen && couponToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm animate-fade-in font-bengali">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-surface-border shadow-2xl p-6 text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-charcoal-900">কুপনটি মুছে ফেলতে চান?</h3>
              <p className="text-xs text-charcoal-500 mt-1">
                আপনি কি নিশ্চিতভাবে <strong className="font-mono text-charcoal-900">{couponToDelete.code}</strong> কুপনটি ডিলিট করতে চান? এই কাজ পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setCouponToDelete(null);
                }}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-surface-border text-charcoal-700 hover:bg-surface-canvas text-xs font-bold transition-colors"
              >
                না, রাখুন
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-subtle"
              >
                {isPending ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating Toast Alerts ────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm font-bengali">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-2xl shadow-lg border flex items-center gap-2.5 text-xs font-bold transition-all animate-slide-up ${
              toast.type === "success"
                ? "bg-emerald-900 text-white border-emerald-700"
                : "bg-rose-900 text-white border-rose-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
