export interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  taglineBn: string;
  descriptionBn: string;
  sourcingOriginBn?: string;
  purityPromiseBn?: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}

export const CATEGORIES_DATA: Category[] = [
  {
    id: "cat-1",
    slug: "honey",
    nameEn: "Raw Honey",
    nameBn: "প্রাকৃতিক চাকের মধু",
    taglineBn: "সুন্দরবন ও প্রত্যন্ত অঞ্চলের ১০০% অপরিশোধিত কাঁচা মধু",
    descriptionBn: "আমাদের মধু কোনো প্রকার হিটিং বা কৃত্রিম সুগার সিরাপের প্রক্রিয়াজাতকরণ ছাড়াই সরাসরি সুন্দরবন ও বিভিন্ন অঞ্চলের মৌয়ালদের থেকে সংগৃহীত।",
    sourcingOriginBn: "সুন্দরবন ম্যানগ্রোভ বন, সাতক্ষীরা ও শরীয়তপুর",
    purityPromiseBn: "হাইড্রোমিটার ও ল্যাব টেস্টে আর্দ্রতা ও সুক্রোজের প্রাকৃতিক মাত্রা উত্তীর্ণ।",
    imageUrl: "https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=800&q=80",
    displayOrder: 1,
    isActive: true,
  },
  {
    id: "cat-2",
    slug: "ghee-oil",
    nameEn: "Ghee & Cold-Pressed Oils",
    nameBn: "গাওয়া ঘি ও কোল্ড-প্রেসড তেল",
    taglineBn: "প্রথাগত কাঠের ঘানি ও বিলোনা পদ্ধতিতে তৈরি আসল তেল ও ঘি",
    descriptionBn: "দেশি গরুর দুধের মাখন থেকে তৈরি সুবাসিত বিলোনা ঘি এবং কাঠের ঘানিতে কম তাপমাত্রায় ভাঙানো ঝাঁঝালো সরিষা ও কালোজিরার তেল।",
    sourcingOriginBn: "পাবনা ও সিরাজগঞ্জের খামার এবং নাটোরের দেশি সরিষা",
    purityPromiseBn: "প্রাকৃতিক ঝাঁঝ ও কাঠের ঘানির খাঁটি ঘ্রাণ নিশ্চিত। কোনো কেমিক্যাল রিফাইনিং নেই।",
    imageUrl: "https://images.unsplash.com/photo-1631379578550-7038263db699?auto=format&fit=crop&w=800&q=80",
    displayOrder: 2,
    isActive: true,
  },
  {
    id: "cat-3",
    slug: "dates",
    nameEn: "Premium Dates",
    nameBn: "প্রিমিয়াম খেজুর",
    taglineBn: "মদিনা মনোয়ারা ও মধ্যপ্রাচ্যের বাগান থেকে বাছাইকৃত তাজা খেজুর",
    descriptionBn: "রাসুলুল্লাহ (সা.)-এর প্রিয় খাদ্য আজওয়াসহ মদিনার বিখ্যাত মেদজুল, মাশরুক ও আম্বার খেজুর। প্রাকৃতিক মিষ্টি ও পুষ্টিতে ভরপুর।",
    sourcingOriginBn: "মদিনা শরীফ (সৌদি আরব) ও জর্ডান ভ্যালি",
    purityPromiseBn: "স্বাভাবিক আর্দ্রতা ও শতভাগ পোকামুক্ত নিয়ন্ত্রিত প্যাকেজিং।",
    imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80",
    displayOrder: 3,
    isActive: true,
  },
  {
    id: "cat-4",
    slug: "organic-seeds",
    nameEn: "Organic Seeds & Superfoods",
    nameBn: "অর্গানিক বীজ ও সুপারফুড",
    taglineBn: "উচ্চ পুষ্টিসমৃদ্ধ প্রিমিয়াম কোয়ালিটি চিয়া সিড ও কালোজিরা",
    descriptionBn: "ওমেগা-৩ ও ফাইবার সমৃদ্ধ আমদানিকৃত অর্গানিক চিয়া সিড এবং নাটোরের বাছাইকৃত ধুলোবালিমুক্ত প্রিমিয়াম কালোজিরা।",
    sourcingOriginBn: "মেক্সিকো (চিয়া সিড) ও নাটোর, বাংলাদেশ (কালোজিরা)",
    purityPromiseBn: "আন্তর্জাতিক মানের পিউরিটি টেস্ট ও এ-গ্রেড ক্লিনিং উত্তীর্ণ।",
    imageUrl: "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=800&q=80",
    displayOrder: 4,
    isActive: true,
  },
  {
    id: "cat-5",
    slug: "combos",
    nameEn: "Sunnah Combos & Bundles",
    nameBn: "সান্নাহ কম্বো ও গিফট বক্স",
    taglineBn: "দৈনন্দিন স্বাস্থ্য সুরক্ষায় সাশ্রয়ী মূল্যের খাঁটি খাবারের প্যাকেজ",
    descriptionBn: "মধু, ঘি, তেল ও খেজুরের সমন্বয়ে তৈরি বিশেষ কম্বো প্যাক—সাশ্রয়ী মূল্যে সর্বোচ্চ গুণগত মান এবং উপহারের জন্য সেরা পছন্দ।",
    sourcingOriginBn: "সান্নাহ সোর্স ওয়্যারহাউস কালেকশন",
    purityPromiseBn: "প্রতিটি উপাদান আলাদাভাবে ল্যাব টেস্ট ও কোয়ালিটি সার্টিফাইড।",
    imageUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80",
    displayOrder: 5,
    isActive: true,
  },
];
