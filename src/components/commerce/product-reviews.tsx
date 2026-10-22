"use client";

import React, { useState } from "react";
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  Award,
  ThumbsUp,
  MessageSquarePlus,
  X,
  Sparkles,
  MapPin,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Product, Review } from "@/types/commerce.types";
import { getReviewsForProduct, getProductRatingSummary } from "@/lib/data/reviews";
import { toBanglaDigits } from "@/lib/utils";

interface ProductReviewsProps {
  product: Product;
}

export function ProductReviews({ product }: ProductReviewsProps) {
  const initialReviews = getReviewsForProduct(product.slug);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [helpfulMap, setHelpfulMap] = useState<Record<string, boolean>>({});
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    initialReviews.forEach((r) => {
      counts[r.id] = r.helpfulCount || 10;
    });
    return counts;
  });

  // Write Review Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newHoverRating, setNewHoverRating] = useState(0);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Compute rating metrics
  const summary = getProductRatingSummary(
    product.slug,
    product.ratingAverage || 4.9,
    product.reviewCount || 24
  );

  // Filter reviews
  const displayedReviews = reviews.filter((r) => {
    if (selectedStarFilter === null) return true;
    return r.rating === selectedStarFilter;
  });

  const handleHelpfulClick = (reviewId: string) => {
    if (helpfulMap[reviewId]) return;
    setHelpfulMap((prev) => ({ ...prev, [reviewId]: true }));
    setHelpfulCounts((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim()) return;

    const newReview: Review = {
      id: `user-rev-${Date.now()}`,
      productSlug: product.slug,
      productTitleBn: product.titleBn,
      userName: newName.trim(),
      userLocation: newLocation.trim() || "বাংলাদেশ",
      rating: newRating,
      date: "আজকে",
      comment: newComment.trim(),
      verifiedBuyer: true,
      avatarText: newName.trim().charAt(0),
      helpfulCount: 1,
    };

    setReviews([newReview, ...reviews]);
    setHelpfulCounts((prev) => ({ ...prev, [newReview.id]: 1 }));
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      setIsModalOpen(false);
      setNewName("");
      setNewLocation("");
      setNewComment("");
      setNewRating(5);
    }, 1500);
  };

  return (
    <section id="product-reviews" className="container mx-auto max-w-7xl px-4 py-8">
      <div className="bg-white rounded-3xl border border-surface-border p-6 sm:p-10 shadow-card space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200/60 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>যাচাইকৃত কাস্টমার রিভিউ ও রেটিং</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-charcoal-900 tracking-tight">
              গ্রাহকদের মতামত ও মূল্যায়ন
            </h2>
            <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
              সারা দেশের সম্মানিত গ্রাহকদের বাস্তব অভিজ্ঞতা ও সুন্নাহ সোর্সের বিশুদ্ধতার প্রমাণ।
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs sm:text-sm transition-all shadow-subtle hover:shadow-card cursor-pointer self-start sm:self-auto"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>রিভিউ লিখুন</span>
          </button>
        </div>

        {/* 100% Purity Trust Guarantee Callout */}
        <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 text-emerald-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white text-emerald-700 rounded-2xl border border-emerald-200 shadow-xs shrink-0">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-emerald-900">
                  ১০০% বিশুদ্ধতার ল্যাব-পরীক্ষিত নিশ্চয়তা ও মানি-ব্যাক গ্যারান্টি
                </h3>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                  ল্যাব টেস্ট সার্টিফাইড
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed max-w-2xl">
                সুন্নাহ সোর্সের প্রতিটি খাদ্যপণ্য শতভাগ প্রাকৃতিক ও কোনো রাসায়নিক প্রিজারভেটিভ ছাড়া সংগৃহীত।
                পণ্যের খাঁটি হওয়ার বিষয়ে সামান্যতম অসন্তোষ থাকলে আমরা দিচ্ছি ৭ দিনের মধ্যে কোনো প্রশ্ন ছাড়াই ১০০% মানি-ব্যাক নিশ্চয়তা।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-emerald-200/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200">
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
              <span>৭ দিনের রিটার্ন</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>১০০% নির্ভেজাল</span>
            </div>
          </div>
        </div>

        {/* Rating Summary Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 bg-surface-canvas rounded-2xl border border-surface-border">
          {/* Big Score Card */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b lg:border-b-0 lg:border-r border-surface-border/80">
            <span className="text-5xl sm:text-6xl font-black text-charcoal-900 tracking-tight font-mono">
              {summary.averageRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 text-amber-400 my-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(summary.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-amber-100 text-amber-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-charcoal-600 font-semibold">
              সর্বমোট <strong className="text-charcoal-900">{toBanglaDigits(summary.totalCount)}টি</strong> গ্রাহক পর্যালোচনার ভিত্তিতে
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-brand-50 border border-brand-200 text-brand-800 text-[11px] font-bold px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{toBanglaDigits(summary.recommendationRate)}% ক্রেতা সন্তুষ্ট</span>
            </div>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="lg:col-span-8 flex flex-col justify-center space-y-2.5">
            {summary.distribution.map((item) => (
              <div key={item.star} className="flex items-center gap-3 text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedStarFilter(selectedStarFilter === item.star ? null : item.star)
                  }
                  className={`flex items-center gap-1 font-bold w-16 text-left transition-colors cursor-pointer ${
                    selectedStarFilter === item.star ? "text-brand-700" : "text-charcoal-700 hover:text-brand-700"
                  }`}
                >
                  <span>{toBanglaDigits(item.star)} স্টার</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </button>

                <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <div className="w-14 text-right font-mono text-xs text-charcoal-500">
                  {toBanglaDigits(item.percentage)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStarFilter(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                selectedStarFilter === null
                  ? "bg-brand-700 text-white border-brand-700 shadow-xs"
                  : "bg-white text-charcoal-700 border-surface-border hover:border-brand-700"
              }`}
            >
              সকল রিভিউ ({toBanglaDigits(reviews.length)})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStarFilter(5)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                selectedStarFilter === 5
                  ? "bg-brand-700 text-white border-brand-700 shadow-xs"
                  : "bg-white text-charcoal-700 border-surface-border hover:border-brand-700"
              }`}
            >
              <span>৫ তারকা</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedStarFilter(4)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                selectedStarFilter === 4
                  ? "bg-brand-700 text-white border-brand-700 shadow-xs"
                  : "bg-white text-charcoal-700 border-surface-border hover:border-brand-700"
              }`}
            >
              <span>৪ তারকা</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </button>
          </div>

          <span className="text-xs text-charcoal-500">
            দেখানো হচ্ছে: <strong>{toBanglaDigits(displayedReviews.length)}টি</strong> রিভিউ
          </span>
        </div>

        {/* Review Cards Grid */}
        <div className="space-y-4">
          {displayedReviews.length === 0 ? (
            <div className="text-center py-12 p-6 bg-surface-canvas rounded-2xl border border-surface-border text-charcoal-500 space-y-2">
              <p className="font-semibold text-sm">এই ফিল্টারে কোনো রিভিউ পাওয়া যায়নি।</p>
              <button
                type="button"
                onClick={() => setSelectedStarFilter(null)}
                className="text-xs font-bold text-brand-700 underline"
              >
                সকল রিভিউ দেখুন
              </button>
            </div>
          ) : (
            displayedReviews.map((review) => {
              const isHelpful = Boolean(helpfulMap[review.id]);
              const count = helpfulCounts[review.id] ?? review.helpfulCount ?? 10;

              return (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs hover:shadow-subtle transition-shadow space-y-3.5"
                >
                  {/* Review Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-sm border border-brand-200 shrink-0">
                        {review.avatarText || review.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-charcoal-900 text-sm sm:text-base leading-tight">
                            {review.userName}
                          </h4>
                          {review.verifiedBuyer && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[11px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              যাচাইকৃত ক্রেতা
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-charcoal-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-charcoal-400" />
                            {review.userLocation}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-charcoal-400" />
                            {review.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-1 self-start sm:self-auto">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-stone-100 text-stone-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed font-normal">
                    {review.comment}
                  </p>

                  {/* Helpful Button Row */}
                  <div className="pt-2 flex items-center justify-between text-xs text-charcoal-500 border-t border-surface-border/50">
                    <button
                      type="button"
                      onClick={() => handleHelpfulClick(review.id)}
                      disabled={isHelpful}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                        isHelpful
                          ? "bg-brand-50 border-brand-200 text-brand-800 font-bold"
                          : "bg-surface-canvas border-surface-border hover:bg-stone-100 text-charcoal-600"
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isHelpful ? "fill-brand-700 text-brand-700" : ""}`} />
                      <span>{isHelpful ? "ধন্যবাদ!" : "উপকারী"}</span>
                      <span className="font-mono">({toBanglaDigits(count)})</span>
                    </button>

                    <span className="text-[11px] text-charcoal-400">
                      সুন্নাহ সোর্স ভেরিফাইড রিভিউ
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-surface-border space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-charcoal-400 hover:text-charcoal-800 p-1 rounded-full hover:bg-stone-100 transition-colors"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                আপনার মূল্যবান প্রতিক্রিয়া
              </span>
              <h3 className="text-xl font-black text-charcoal-900 mt-1">
                পণ্যটির অভিজ্ঞতা শেয়ার করুন
              </h3>
              <p className="text-xs text-charcoal-500 mt-0.5">
                {product.titleBn} সম্পর্কে আপনার সত্য অভিজ্ঞতা লিখুন।
              </p>
            </div>

            {isSubmitted ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-base">
                  আপনার রিভিউ সফলভাবে যুক্ত হয়েছে!
                </h4>
                <p className="text-xs text-emerald-700">
                  সুন্নাহ সোর্সের সাথে আপনার খাঁটি খাদ্য অভিজ্ঞতা শেয়ার করার জন্য আন্তরিক শুকরিয়া।
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Rating Stars Picker */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1.5">
                    আপনার রেটিং নির্বাচন করুন:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        onMouseEnter={() => setNewHoverRating(star)}
                        onMouseLeave={() => setNewHoverRating(0)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (newHoverRating || newRating)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-stone-100 text-stone-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-charcoal-700 ml-2 font-mono">
                      {toBanglaDigits(newRating)} / ৫
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    আপনার নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: তানভীর আহমেদ"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-surface-border focus:border-brand-700 focus:outline-hidden bg-stone-50/50"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    আপনার এলাকা বা শহর
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: উত্তরা, ঢাকা বা পাঁচলাইশ, চট্টগ্রাম"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-surface-border focus:border-brand-700 focus:outline-hidden bg-stone-50/50"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    আপনার রিভিউ ও মতামত <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="পণ্যের খাঁটি মান, ঘ্রাণ, প্যাকেজিং এবং ডেলিভারি অভিজ্ঞতা সম্পর্কে বিস্তারিত লিখুন..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-surface-border focus:border-brand-700 focus:outline-hidden bg-stone-50/50 resize-none"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 hover:bg-stone-100 transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs sm:text-sm transition-all shadow-card cursor-pointer"
                  >
                    রিভিউ সাবমিট করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
