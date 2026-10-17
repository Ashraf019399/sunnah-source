"use client";

import React, { useState, useTransition, useCallback } from "react";
import Image from "next/image";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Info,
  ImageOff,
} from "lucide-react";
import type { Category } from "@/lib/data/categories";
import {
  addAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "@/lib/actions/admin-category-actions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

type FormMode = "add" | "edit";

interface CategoryFormData {
  slug: string;
  nameEn: string;
  nameBn: string;
  taglineBn: string;
  descriptionBn: string;
  sourcingOriginBn: string;
  purityPromiseBn: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

const EMPTY_FORM: CategoryFormData = {
  slug: "",
  nameEn: "",
  nameBn: "",
  taglineBn: "",
  descriptionBn: "",
  sourcingOriginBn: "",
  purityPromiseBn: "",
  imageUrl: "",
  displayOrder: 1,
  isActive: true,
};

// ─── Toast Component ──────────────────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const isSuccess = toast.type === "success";
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg text-sm font-bengali animate-in slide-in-from-right-8 fade-in duration-300 ${
        isSuccess
          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
          : "bg-rose-50 border-rose-200 text-rose-900"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
      )}
      <span className="flex-1 text-xs leading-relaxed">{toast.message}</span>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

interface CategoryFormModalProps {
  mode: FormMode;
  initialData?: CategoryFormData;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  editSlug?: string;
}

function CategoryFormModal({
  mode,
  initialData = EMPTY_FORM,
  onClose,
  onSuccess,
  onError,
  editSlug,
}: CategoryFormModalProps) {
  const [form, setForm] = useState<CategoryFormData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [imgError, setImgError] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.nameBn.trim() || !form.nameEn.trim()) {
      onError("স্লাগ, বাংলা নাম ও ইংরেজি নাম আবশ্যিক ফিল্ড।");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-"),
          nameEn: form.nameEn.trim(),
          nameBn: form.nameBn.trim(),
          taglineBn: form.taglineBn.trim(),
          descriptionBn: form.descriptionBn.trim(),
          sourcingOriginBn: form.sourcingOriginBn.trim() || undefined,
          purityPromiseBn: form.purityPromiseBn.trim() || undefined,
          imageUrl: form.imageUrl.trim(),
          displayOrder: form.displayOrder,
          isActive: form.isActive,
        };

        let result;
        if (mode === "add") {
          result = await addAdminCategory(payload);
        } else {
          result = await updateAdminCategory(editSlug!, payload);
        }

        if (result.success) {
          onSuccess(result.message || "সম্পন্ন হয়েছে।");
          onClose();
        } else {
          onError(result.message || "একটি ত্রুটি ঘটেছে।");
        }
      } catch {
        onError("অপ্রত্যাশিত ত্রুটি। আবার চেষ্টা করুন।");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-surface-border animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-accent-dark">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-charcoal-900">
                {mode === "add" ? "নতুন ক্যাটাগরি যোগ" : "ক্যাটাগরি এডিট"}
              </h2>
              <p className="text-[11px] text-charcoal-500">
                {mode === "add"
                  ? "নতুন একটি পণ্য ক্যাটাগরি তৈরি করুন"
                  : `"${initialData.nameBn}" সম্পাদনা করুন`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-charcoal-500 hover:text-charcoal-900 hover:bg-surface-canvas transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form
          id="cat-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {/* Slug + Display Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                স্লাগ (Slug) <span className="text-rose-500">*</span>
              </label>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                disabled={mode === "edit"}
                placeholder="honey"
                className="w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-white text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-surface-canvas disabled:text-charcoal-500"
              />
              {mode === "edit" && (
                <p className="text-[10px] text-charcoal-400 mt-1">স্লাগ পরিবর্তনযোগ্য নয়।</p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                ডিসপ্লে অর্ডার
              </label>
              <input
                name="displayOrder"
                type="number"
                min={1}
                value={form.displayOrder}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-white text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                বাংলা নাম <span className="text-rose-500">*</span>
              </label>
              <input
                name="nameBn"
                value={form.nameBn}
                onChange={handleChange}
                placeholder="প্রাকৃতিক চাকের মধু"
                className="w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-white text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                ইংরেজি নাম <span className="text-rose-500">*</span>
              </label>
              <input
                name="nameEn"
                value={form.nameEn}
                onChange={handleChange}
                placeholder="Raw Honey"
                className="w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-white text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
              ট্যাগলাইন (বাংলা)
            </label>
            <input
              name="taglineBn"
              value={form.taglineBn}
              onChange={handleChange}
              placeholder="সুন্দরবন ও প্রত্যন্ত অঞ্চলের ১০০% অপরিশোধিত কাঁচা মধু"
              className="w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-white text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
              বিবরণ (বাংলা)
            </label>
            <textarea
              name="descriptionBn"
              value={form.descriptionBn}
              onChange={handleChange}
              rows={2}
              placeholder="ক্যাটাগরির বিস্তারিত বিবরণ..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-white text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Sourcing + Purity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                উৎস (Sourcing Origin)
              </label>
              <input
                name="sourcingOriginBn"
                value={form.sourcingOriginBn}
                onChange={handleChange}
                placeholder="সুন্দরবন, সাতক্ষীরা..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-white text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                বিশুদ্ধতার প্রতিশ্রুতি
              </label>
              <input
                name="purityPromiseBn"
                value={form.purityPromiseBn}
                onChange={handleChange}
                placeholder="ল্যাব টেস্ট উত্তীর্ণ..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-white text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Image URL + Preview */}
          <div>
            <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
              ছবির URL
            </label>
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={(e) => {
                handleChange(e);
                setImgError(false);
              }}
              placeholder="https://..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-surface-border bg-white text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans"
            />
            {form.imageUrl && (
              <div className="mt-2 w-20 h-14 rounded-xl overflow-hidden border border-surface-border bg-surface-canvas flex items-center justify-center">
                {imgError ? (
                  <ImageOff className="w-5 h-5 text-charcoal-400" />
                ) : (
                  <Image
                    src={form.imageUrl}
                    alt="প্রিভিউ"
                    width={80}
                    height={56}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                    unoptimized
                  />
                )}
              </div>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-canvas border border-surface-border">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
              className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                form.isActive ? "bg-brand-700" : "bg-charcoal-300"
              }`}
              aria-checked={form.isActive}
              role="switch"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  form.isActive ? "translate-x-4.5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-charcoal-700">
              {form.isActive ? "ক্যাটাগরি সক্রিয় (Active)" : "ক্যাটাগরি নিষ্ক্রিয় (Inactive)"}
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-surface-border bg-surface-canvas/50 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-surface-border text-charcoal-700 hover:bg-surface-canvas transition-colors disabled:opacity-60"
          >
            বাতিল
          </button>
          <button
            type="submit"
            form="cat-form"
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 text-xs font-black rounded-xl bg-brand-900 hover:bg-brand-800 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            {isPending
              ? "সংরক্ষণ হচ্ছে..."
              : mode === "add"
              ? "ক্যাটাগরি যোগ করুন"
              : "পরিবর্তন সংরক্ষণ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

interface DeleteConfirmProps {
  category: Category;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function DeleteConfirmModal({ category, onConfirm, onCancel, isPending }: DeleteConfirmProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-rose-200 animate-in zoom-in-95 fade-in duration-200">
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="text-center space-y-1.5">
            <h3 className="text-sm font-black text-charcoal-900">
              ক্যাটাগরি মুছবেন?
            </h3>
            <p className="text-xs text-charcoal-500 leading-relaxed">
              <span className="font-bold text-charcoal-700">&ldquo;{category.nameBn}&rdquo;</span>{" "}
              ক্যাটাগরিটি স্থায়ীভাবে মুছে ফেলা হবে। এই ক্রিয়া পূর্বাবস্থায় ফেরানো যাবে না।
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-surface-border text-charcoal-700 hover:bg-surface-canvas transition-colors disabled:opacity-60"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {isPending ? "মুছছে..." : "হ্যাঁ, মুছে দিন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Category Row ─────────────────────────────────────────────────────────────

interface CategoryRowProps {
  category: Category;
  index: number;
  total: number;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

function CategoryRow({ category, index, total, onEdit, onDelete }: CategoryRowProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <tr className="border-b border-surface-border/60 hover:bg-surface-canvas/50 transition-colors group">
      {/* Order */}
      <td className="px-4 py-3 w-16 text-center">
        <div className="flex items-center justify-center gap-0.5">
          <span className="text-xs font-bold text-charcoal-500 w-5 text-center">
            {category.displayOrder}
          </span>
        </div>
      </td>

      {/* Image */}
      <td className="px-3 py-3 w-16">
        <div className="w-12 h-10 rounded-xl overflow-hidden border border-surface-border bg-surface-canvas flex items-center justify-center">
          {category.imageUrl && !imgError ? (
            <Image
              src={category.imageUrl}
              alt={category.nameBn}
              width={48}
              height={40}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              unoptimized
            />
          ) : (
            <ImageOff className="w-4 h-4 text-charcoal-300" />
          )}
        </div>
      </td>

      {/* Names */}
      <td className="px-3 py-3 min-w-0">
        <div className="min-w-0">
          <div className="text-xs font-bold text-charcoal-900 truncate">{category.nameBn}</div>
          <div className="text-[11px] text-charcoal-500 truncate font-sans">{category.nameEn}</div>
          {category.taglineBn && (
            <div className="text-[10px] text-charcoal-400 truncate mt-0.5">{category.taglineBn}</div>
          )}
        </div>
      </td>

      {/* Slug */}
      <td className="px-3 py-3 hidden md:table-cell">
        <span className="text-[11px] font-mono bg-surface-canvas text-charcoal-600 px-2 py-0.5 rounded-lg border border-surface-border">
          {category.slug}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-3 w-24">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            category.isActive
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-surface-canvas text-charcoal-500 border border-surface-border"
          }`}
        >
          {category.isActive ? (
            <Eye className="w-2.5 h-2.5" />
          ) : (
            <EyeOff className="w-2.5 h-2.5" />
          )}
          {category.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
        </span>
      </td>

      {/* Actions */}
      <td className="px-3 py-3 w-24">
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(category)}
            title="এডিট"
            className="p-1.5 rounded-lg text-brand-700 hover:bg-brand-50 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(category)}
            title="ডিলিট"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CategoriesManagerProps {
  initialCategories: Category[];
  isUsingLiveDb: boolean;
}

export function CategoriesManager({ initialCategories, isUsingLiveDb }: CategoriesManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const toastIdRef = React.useRef(0);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSuccess = useCallback(
    (msg: string) => {
      addToast("success", msg);
      // Refresh categories from the server by reloading the page
      window.location.reload();
    },
    [addToast]
  );

  const handleError = useCallback(
    (msg: string) => {
      addToast("error", msg);
    },
    [addToast]
  );

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return;
    startDeleteTransition(async () => {
      try {
        const result = await deleteAdminCategory(deletingCategory.slug);
        setDeletingCategory(null);
        if (result.success) {
          addToast("success", result.message || "ক্যাটাগরি মুছে ফেলা হয়েছে।");
          setCategories((prev) => prev.filter((c) => c.slug !== deletingCategory.slug));
        } else {
          addToast("error", result.message || "মুছতে ব্যর্থ হয়েছে।");
        }
      } catch {
        setDeletingCategory(null);
        addToast("error", "অপ্রত্যাশিত ত্রুটি। আবার চেষ্টা করুন।");
      }
    });
  };

  const toFormData = (cat: Category): CategoryFormData => ({
    slug: cat.slug,
    nameEn: cat.nameEn,
    nameBn: cat.nameBn,
    taglineBn: cat.taglineBn,
    descriptionBn: cat.descriptionBn,
    sourcingOriginBn: cat.sourcingOriginBn ?? "",
    purityPromiseBn: cat.purityPromiseBn ?? "",
    imageUrl: cat.imageUrl,
    displayOrder: cat.displayOrder,
    isActive: cat.isActive,
  });

  const sorted = [...categories].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-80">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <CategoryFormModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}

      {/* Edit Modal */}
      {editingCategory && (
        <CategoryFormModal
          mode="edit"
          initialData={toFormData(editingCategory)}
          editSlug={editingCategory.slug}
          onClose={() => setEditingCategory(null)}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingCategory && (
        <DeleteConfirmModal
          category={deletingCategory}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingCategory(null)}
          isPending={isDeleting}
        />
      )}

      {/* Content */}
      <div className="space-y-5">
        {/* Data Source Notice */}
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-2xl text-xs border ${
            isUsingLiveDb
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">
              {isUsingLiveDb
                ? "লাইভ ডেটাবেজ থেকে ক্যাটাগরি লোড হয়েছে"
                : "স্ট্যাটিক ক্যাটালগ ডেটা প্রদর্শিত হচ্ছে"}
            </span>
            <span className="leading-relaxed">
              {isUsingLiveDb
                ? "Supabase 'categories' টেবিল থেকে সরাসরি তথ্য নেওয়া হয়েছে। যোগ, এডিট ও ডিলিট সরাসরি ডেটাবেজে সংরক্ষিত হবে।"
                : "Supabase-এ 'categories' টেবিল পাওয়া যায়নি বা খালি। বর্তমানে src/lib/data/categories.ts থেকে স্ট্যাটিক ডেটা দেখানো হচ্ছে। যোগ/এডিট/ডিলিট করতে Supabase-এ টেবিল থাকতে হবে।"}
            </span>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-3xl border border-surface-border shadow-subtle overflow-hidden">
          {/* Table Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <div>
              <h3 className="text-sm font-black text-charcoal-900">
                সকল ক্যাটাগরি ({sorted.length}টি)
              </h3>
              <p className="text-[11px] text-charcoal-500 mt-0.5">
                ডিসপ্লে অর্ডার অনুযায়ী সাজানো
              </p>
            </div>
            <button
              type="button"
              id="add-category-btn"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl bg-brand-900 hover:bg-brand-800 text-white transition-all hover:shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              নতুন ক্যাটাগরি
            </button>
          </div>

          {/* Table */}
          {sorted.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-surface-canvas text-charcoal-400 flex items-center justify-center mx-auto">
                <FolderTree className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-charcoal-500">কোনো ক্যাটাগরি নেই</p>
                <p className="text-xs text-charcoal-400 mt-1">
                  নতুন ক্যাটাগরি যোগ করুন।
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-canvas/60">
                    <th className="px-4 py-2.5 text-[10px] font-black text-charcoal-500 uppercase tracking-wider text-center w-16">
                      অর্ডার
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-charcoal-500 uppercase tracking-wider text-left w-16">
                      ছবি
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-charcoal-500 uppercase tracking-wider text-left">
                      নাম
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-charcoal-500 uppercase tracking-wider text-left hidden md:table-cell">
                      স্লাগ
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-charcoal-500 uppercase tracking-wider text-left w-24">
                      স্ট্যাটাস
                    </th>
                    <th className="px-3 py-2.5 text-[10px] font-black text-charcoal-500 uppercase tracking-wider text-left w-24">
                      একশন
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((cat, idx) => (
                    <CategoryRow
                      key={cat.id}
                      category={cat}
                      index={idx}
                      total={sorted.length}
                      onEdit={setEditingCategory}
                      onDelete={setDeletingCategory}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "মোট ক্যাটাগরি",
              value: sorted.length,
              color: "bg-amber-50 text-accent-dark border-amber-200",
            },
            {
              label: "সক্রিয়",
              value: sorted.filter((c) => c.isActive).length,
              color: "bg-emerald-50 text-emerald-700 border-emerald-200",
            },
            {
              label: "নিষ্ক্রিয়",
              value: sorted.filter((c) => !c.isActive).length,
              color: "bg-surface-canvas text-charcoal-600 border-surface-border",
            },
            {
              label: "ডেটা উৎস",
              value: isUsingLiveDb ? "লাইভ DB" : "ক্যাটালগ",
              color: isUsingLiveDb
                ? "bg-brand-50 text-brand-700 border-brand-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl p-4 border ${card.color} flex flex-col gap-1`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {card.label}
              </span>
              <span className="text-lg font-black">{card.value}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
