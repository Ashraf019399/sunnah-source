import React from "react";
import Link from "next/link";
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FBF9F5]">
      <div className="max-w-xl p-8 bg-white rounded-3xl border border-[#E5DEC9] shadow-sm space-y-4">
        <h1 className="text-3xl font-extrabold text-[#1B4D2E]">SUNNAH SOURCE</h1>
        <p className="text-sm text-[#4E544E]">প্রকৃতির বিশুদ্ধতা, সুন্নাহর অনুপ্রেরণা। ১০০% খাঁটি ও প্রাকৃতিক খাবারের বিশ্বস্ত প্রতিষ্ঠান।</p>
        <div className="pt-4 flex justify-center gap-3">
          <Link href="/checkout" className="bg-[#1B4D2E] text-white px-6 py-3 rounded-xl font-bold text-sm shadow">সরাসরি চেকআউট</Link>
          <Link href="/admin" className="bg-[#F0F6F2] text-[#1B4D2E] border border-[#C4DBC8] px-6 py-3 rounded-xl font-bold text-sm">অ্যাডমিন প্যানেল</Link>
        </div>
      </div>
    </main>
  );
}