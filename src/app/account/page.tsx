"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  PackageCheck,
  Truck,
  Heart,
  MapPin,
  User,
  ShieldCheck,
  Sparkles,
  Clock,
  CheckCircle2,
  Printer,
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  Phone,
  Mail,
  Plus,
  Trash2,
  Edit3,
  Save,
  LogOut,
  Search,
  Filter,
  ArrowUpRight,
  HelpCircle,
  Wallet,
  Check,
  RotateCcw,
  Building2,
  Home,
  Briefcase,
  Loader2,
  X,
  Copy,
} from "lucide-react";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { PrintableInvoice, InvoiceOrderData } from "@/components/checkout/printable-invoice";
import { WhatsAppIcon } from "@/components/commerce/whatsapp-order-button";
import { useCartStore } from "@/store/use-cart-store";
import { useWishlistStore } from "@/store/use-wishlist-store";
import { createClient } from "@/lib/supabase/client";
import {
  getCustomerOrdersByPhone,
  CustomerOrderDTO,
  CustomerOrderItem,
} from "@/lib/actions/customer-order-actions";
import {
  formatBDT,
  formatBanglaDateTime,
  toBanglaDigits,
  isValidBDPhone,
  normalizeBDPhone,
  cn,
} from "@/lib/utils";
import { ALL_PRODUCTS } from "@/lib/data/products";
import { ORDER_STATUS_CONFIG } from "@/types/orders.types";
import { OrderStatus, PaymentMethod } from "@/types/commerce.types";
import { PaymentStatus } from "@/types/orders.types";

// ==========================================
// Types & Constants
// ==========================================
type TabKey = "overview" | "orders" | "addresses" | "wishlist" | "profile";

interface SavedAddress {
  id: string;
  label: "home" | "office" | "other";
  title: string;
  recipientName: string;
  phone: string;
  alternativePhone?: string;
  zone: "inside_dhaka" | "outside_dhaka";
  district: string;
  thana: string;
  fullAddress: string;
  isDefault: boolean;
}

interface UserProfile {
  name: string;
  phone: string;
  email: string;
  alternativePhone?: string;
  defaultDeliveryNotes?: string;
  memberSince?: string;
}

const STORAGE_PHONE_KEY = "sunnah_customer_phone";
const STORAGE_PROFILE_KEY = "sunnah_customer_profile";
const STORAGE_ADDRESSES_KEY = "sunnah_customer_addresses";
const LOCAL_STORAGE_ORDER_KEYS = [
  "sunnah_orders",
  "sunnah_placed_orders",
  "sunnah_latest_order",
  "sunnah_order_history",
];

const SUPPORT_PHONE = "01914612007";
const SUPPORT_PHONE_DISPLAY = "০১৯১৪-৬১২০০৭";

/**
 * Extracts and normalizes guest orders stored locally
 */
function getLocalOrdersByPhone(cleanPhone: string): CustomerOrderDTO[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  const last10 = cleanPhone.slice(-10);
  const matchedList: CustomerOrderDTO[] = [];

  for (const key of LOCAL_STORAGE_ORDER_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed: unknown = JSON.parse(raw);
      const candidates: Record<string, unknown>[] = [];

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object") {
            candidates.push(item as Record<string, unknown>);
          }
        }
      } else if (parsed && typeof parsed === "object") {
        candidates.push(parsed as Record<string, unknown>);
      }

      for (const item of candidates) {
        const shipping = (item.shippingAddress || item.shipping_address) as
          | Record<string, unknown>
          | string
          | undefined;

        const candidatePhones: string[] = [
          item.phone,
          item.customerPhone,
          item.customer_phone,
          item.guest_phone,
          item.guestPhone,
          typeof shipping === "object" && shipping ? shipping.phone : undefined,
          typeof shipping === "object" && shipping ? shipping.guest_phone : undefined,
          typeof shipping === "object" && shipping ? shipping.customer_phone : undefined,
        ].filter((p): p is string => typeof p === "string" && p.trim().length > 0);

        const isMatch = candidatePhones.some((p) => {
          const norm = normalizeBDPhone(p);
          return norm === cleanPhone || (norm.length >= 10 && norm.slice(-10) === last10);
        });

        if (!isMatch) continue;

        const rawItems = Array.isArray(item.items) ? item.items : [];
        const parsedItems: CustomerOrderItem[] = rawItems.map((it, idx) => {
          const itObj = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
          const pTitle = String(
            itObj.titleBn || itObj.productTitle || itObj.title || itObj.name || "পণ্য"
          );
          const vName = (itObj.variantName || itObj.variantTitle || itObj.weightLabel || null) as
            | string
            | null;
          const uPrice = Number(itObj.unitPrice ?? itObj.price ?? itObj.unit_price ?? 0);
          const qty = Number(itObj.quantity ?? 1);
          const lTotal = Number(itObj.lineTotal ?? itObj.line_total ?? uPrice * qty);
          const img =
            (typeof itObj.image === "string" && itObj.image) ||
            (Array.isArray(itObj.images) && typeof itObj.images[0] === "string"
              ? itObj.images[0]
              : "") ||
            "/images/hero-honey.png";

          return {
            id: String(itObj.id || itObj.productId || itObj.product_id || `local-it-${idx}`),
            productId: String(itObj.productId || itObj.product_id || `prod-${idx}`),
            productTitle: pTitle,
            variantName: vName,
            unitPrice: uPrice,
            quantity: qty,
            lineTotal: lTotal,
            image: img,
          };
        });

        const orderNum = String(
          item.orderNumber ||
            item.order_number ||
            item.id ||
            `SS-LOCAL-${Math.floor(1000 + Math.random() * 9000)}`
        );

        let deliveryAddr = "ঢাকা, বাংলাদেশ";
        if (typeof shipping === "string" && shipping.trim()) {
          deliveryAddr = shipping.trim();
        } else if (typeof shipping === "object" && shipping) {
          deliveryAddr = String(
            shipping.fullAddress || shipping.full_address || shipping.address || deliveryAddr
          );
        } else if (typeof item.fullAddress === "string" && item.fullAddress) {
          deliveryAddr = item.fullAddress;
        }

        const grandTotal = Number(
          item.grandTotal ?? item.grand_total ?? item.total ?? item.total_amount ?? 0
        );
        const subtotal = Number(item.subtotal ?? grandTotal);
        const deliveryFee = Number(item.deliveryFee ?? item.delivery_fee ?? item.shipping_fee ?? 0);
        const discountAmount = Number(item.discountAmount ?? item.discount_amount ?? 0);
        const couponCode = (item.couponCode || item.coupon_code || null) as string | null;

        matchedList.push({
          id: String(item.id || orderNum),
          order_number: orderNum,
          created_at: String(item.createdAt || item.created_at || new Date().toISOString()),
          status: (item.orderStatus || item.status || "pending") as OrderStatus,
          grand_total: grandTotal,
          subtotal: subtotal,
          discount_amount: discountAmount,
          delivery_fee: deliveryFee,
          coupon_code: couponCode,
          delivery_address: deliveryAddr,
          customer_name: String(item.customerName || item.customer_name || item.name || "গ্রাহক"),
          customer_phone: cleanPhone,
          payment_method: (item.paymentMethod || item.payment_method || "cod") as PaymentMethod,
          payment_status: (item.paymentStatus || item.payment_status || "unpaid") as PaymentStatus,
          courier_partner: (item.courierPartner || item.courier_partner || null) as string | null,
          courier_tracking_code: (item.courierTrackingCode || item.courier_tracking_code || null) as
            | string
            | null,
          items: parsedItems,
        });
      }
    } catch {
      // Ignore corrupted localStorage entries
    }
  }

  return matchedList;
}

export default function CustomerDashboardPage() {
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [mounted, setMounted] = useState(false);

  // Authentication State
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    phone: "",
    email: "",
    alternativePhone: "",
    defaultDeliveryNotes: "",
    memberSince: "২০২৬",
  });

  // Orders State
  const [orders, setOrders] = useState<CustomerOrderDTO[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState<"all" | "active" | "delivered" | "cancelled">(
    "all"
  );
  const [ordersSearch, setOrdersSearch] = useState("");

  // Address Book State
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  // Invoice Modal State
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<InvoiceOrderData | null>(null);

  // Logout Modal State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Toast / Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Current Date / Time
  const [currentDateTimeBn, setCurrentDateTimeBn] = useState("");

  // Zustand Stores
  const addItemToCart = useCartStore((state) => state.addItem);
  const openCartDrawer = useCartStore((state) => state.openDrawer);
  const wishlistItems = useWishlistStore((state) => state.items || []);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);

  // Show Toast Helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Set Bengali Date Time
  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCurrentDateTimeBn(formatBanglaDateTime(now));
  }, []);

  // ==========================================
  // Auth Guard & Initial Data Loading
  // ==========================================
  const loadOrdersForPhone = useCallback(
    async (cleanPhone: string) => {
      setIsLoadingOrders(true);
      const serverOrders: CustomerOrderDTO[] = [];

      try {
        const result = await getCustomerOrdersByPhone(cleanPhone);
        if (result.success && Array.isArray(result.orders)) {
          serverOrders.push(...result.orders);
        }
      } catch (err) {
        console.warn("[CustomerDashboard] Server orders query notice:", err);
      }

      const localOrders = getLocalOrdersByPhone(cleanPhone);

      const orderMap = new Map<string, CustomerOrderDTO>();
      for (const order of serverOrders) {
        const key = (order.order_number || order.id).trim().toUpperCase();
        orderMap.set(key, order);
      }
      for (const order of localOrders) {
        const key = (order.order_number || order.id).trim().toUpperCase();
        if (!orderMap.has(key)) {
          orderMap.set(key, order);
        }
      }

      const finalOrders = Array.from(orderMap.values()).sort((a, b) => {
        const timeA = new Date(a.created_at).getTime() || 0;
        const timeB = new Date(b.created_at).getTime() || 0;
        return timeB - timeA;
      });

      setOrders(finalOrders);
      setIsLoadingOrders(false);

      // Auto-seed addresses if address book is empty and orders exist
      if (typeof window !== "undefined") {
        const savedRaw = localStorage.getItem(STORAGE_ADDRESSES_KEY);
        if (!savedRaw && finalOrders.length > 0) {
          const firstWithAddr = finalOrders.find((o) => o.delivery_address);
          if (firstWithAddr) {
            const initialAddr: SavedAddress = {
              id: "addr-initial-1",
              label: "home",
              title: "বাসা / হোম",
              recipientName: firstWithAddr.customer_name || "গ্রাহক",
              phone: firstWithAddr.customer_phone || cleanPhone,
              zone: "inside_dhaka",
              district: "ঢাকা",
              thana: "গুলশান",
              fullAddress: firstWithAddr.delivery_address,
              isDefault: true,
            };
            const list = [initialAddr];
            setAddresses(list);
            localStorage.setItem(STORAGE_ADDRESSES_KEY, JSON.stringify(list));
          }
        }
      }
    },
    []
  );

  useEffect(() => {
    const authenticate = async () => {
      setIsCheckingAuth(true);

      let foundPhone = "";
      let foundName = "";
      let foundEmail = "";

      // 1. Check Supabase User
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          foundEmail = user.email || "";
          foundName = user.user_metadata?.full_name || user.user_metadata?.name || "";
          foundPhone = user.phone || user.user_metadata?.phone || "";
        }
      } catch {
        // Continue to fallback
      }

      // 2. Check localStorage
      if (typeof window !== "undefined") {
        const storedPhone =
          localStorage.getItem(STORAGE_PHONE_KEY) || localStorage.getItem("customer_phone");
        if (storedPhone && isValidBDPhone(storedPhone)) {
          foundPhone = normalizeBDPhone(storedPhone);
        }

        // Try reading latest placed order phone if still empty
        if (!foundPhone) {
          const latestOrderRaw = localStorage.getItem("sunnah_latest_order");
          if (latestOrderRaw) {
            try {
              const parsed = JSON.parse(latestOrderRaw);
              const oPhone = parsed.phone || parsed.customerPhone || parsed.customer_phone;
              if (oPhone && isValidBDPhone(oPhone)) {
                foundPhone = normalizeBDPhone(oPhone);
                localStorage.setItem(STORAGE_PHONE_KEY, foundPhone);
              }
            } catch {
              // ignore
            }
          }
        }

        // Read stored profile
        const profileRaw = localStorage.getItem(STORAGE_PROFILE_KEY);
        if (profileRaw) {
          try {
            const p = JSON.parse(profileRaw);
            if (p.name && !foundName) foundName = p.name;
            if (p.email && !foundEmail) foundEmail = p.email;
            setUserProfile((prev) => ({
              ...prev,
              name: p.name || prev.name,
              phone: p.phone || foundPhone || prev.phone,
              email: p.email || foundEmail || prev.email,
              alternativePhone: p.alternativePhone || "",
              defaultDeliveryNotes: p.defaultDeliveryNotes || "",
              memberSince: p.memberSince || "২০২৬",
            }));
          } catch {
            // ignore
          }
        }

        // Read stored addresses
        const addressesRaw = localStorage.getItem(STORAGE_ADDRESSES_KEY);
        if (addressesRaw) {
          try {
            const addrList = JSON.parse(addressesRaw);
            if (Array.isArray(addrList)) {
              setAddresses(addrList);
            }
          } catch {
            // ignore
          }
        }
      }

      // If no session found at all, route to login
      if (!foundPhone && !foundEmail) {
        router.replace("/login?redirect=/account");
        return;
      }

      setIsAuthenticated(true);
      setUserPhone(foundPhone);
      setUserProfile((prev) => ({
        ...prev,
        name: foundName || prev.name || "সম্মানিত সুন্নাহ মেম্বার",
        phone: foundPhone || prev.phone,
        email: foundEmail || prev.email,
      }));

      setIsCheckingAuth(false);

      if (foundPhone) {
        loadOrdersForPhone(foundPhone);
      }
    };

    authenticate();
  }, [router, loadOrdersForPhone]);

  // ==========================================
  // Calculated Metrics
  // ==========================================
  const activeOrder = useMemo(() => {
    return orders.find((o) =>
      ["pending", "confirmed", "processing", "shipped"].includes(o.status)
    );
  }, [orders]);

  const activeShipmentsCount = useMemo(() => {
    return orders.filter((o) =>
      ["pending", "confirmed", "processing", "shipped"].includes(o.status)
    ).length;
  }, [orders]);

  const deliveredOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "delivered").length;
  }, [orders]);

  const totalSpentValue = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled" && o.status !== "returned")
      .reduce((sum, o) => sum + (o.grand_total || 0), 0);
  }, [orders]);

  const previousOrderedItems = useMemo(() => {
    const map = new Map<string, CustomerOrderItem>();
    for (const order of orders) {
      if (order.status !== "cancelled") {
        for (const item of order.items || []) {
          const key = (item.productId || item.productTitle).toLowerCase();
          if (!map.has(key)) {
            map.set(key, item);
          }
        }
      }
    }
    return Array.from(map.values()).slice(0, 6);
  }, [orders]);

  // Top products fallback for reorder section
  const fallbackReorderProducts = useMemo(() => {
    return ALL_PRODUCTS.slice(0, 4);
  }, []);

  // Filtered Orders for Orders Tab
  const filteredOrdersList = useMemo(() => {
    let result = [...orders];

    if (ordersFilter === "active") {
      result = result.filter((o) =>
        ["pending", "confirmed", "processing", "shipped"].includes(o.status)
      );
    } else if (ordersFilter === "delivered") {
      result = result.filter((o) => o.status === "delivered");
    } else if (ordersFilter === "cancelled") {
      result = result.filter((o) => ["cancelled", "returned"].includes(o.status));
    }

    if (ordersSearch.trim()) {
      const q = ordersSearch.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          (o.courier_tracking_code && o.courier_tracking_code.toLowerCase().includes(q)) ||
          o.items?.some((it) => it.productTitle.toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, ordersFilter, ordersSearch]);

  // ==========================================
  // Handlers
  // ==========================================
  const handleReorderItem = (item: {
    productId: string;
    productTitle: string;
    variantName?: string | null;
    unitPrice: number;
    image?: string;
  }) => {
    addItemToCart({
      id: `${item.productId}-${item.variantName || "std"}`,
      productId: item.productId,
      variantId: item.productId,
      title: item.productTitle,
      titleBn: item.productTitle,
      variantName: item.variantName || "স্ট্যান্ডার্ড প্যাক",
      unitPrice: item.unitPrice,
      image: item.image || "/images/hero-honey.png",
      weightLabel: item.variantName || "",
      quantity: 1,
      maxStock: 50,
    });
    openCartDrawer();
    showToast(`"${item.productTitle}" কার্টে যোগ করা হয়েছে!`);
  };

  const handleOpenInvoice = (order: CustomerOrderDTO) => {
    const invoiceData: InvoiceOrderData = {
      orderNumber: order.order_number || order.id,
      fullName: order.customer_name || userProfile.name || "সম্মানিত গ্রাহক",
      phone: order.customer_phone || userPhone,
      shippingAddress: order.delivery_address || "ঢাকা, বাংলাদেশ",
      subtotal: order.subtotal || order.grand_total,
      deliveryFee: order.delivery_fee || 0,
      discountAmount: order.discount_amount || 0,
      couponCode: order.coupon_code || null,
      grandTotal: order.grand_total,
      createdAt: order.created_at,
      items: (order.items || []).map((it) => ({
        id: it.id,
        productId: it.productId,
        variantId: it.productId,
        title: it.productTitle,
        titleBn: it.productTitle,
        variantName: it.variantName || "স্ট্যান্ডার্ড প্যাক",
        unitPrice: it.unitPrice,
        image: it.image || "/images/hero-honey.png",
        weightLabel: it.variantName || "",
        quantity: it.quantity,
        maxStock: 50,
      })),
    };
    setSelectedInvoiceOrder(invoiceData);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(userProfile));
      if (userProfile.phone) {
        localStorage.setItem(STORAGE_PHONE_KEY, normalizeBDPhone(userProfile.phone));
      }
    }
    showToast("প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!");
  };

  const handleSaveAddress = (address: SavedAddress) => {
    let updated: SavedAddress[];
    if (address.isDefault) {
      updated = addresses.map((a) => ({ ...a, isDefault: false }));
    } else {
      updated = [...addresses];
    }

    const index = updated.findIndex((a) => a.id === address.id);
    if (index >= 0) {
      updated[index] = address;
    } else {
      updated.push(address);
    }

    setAddresses(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ADDRESSES_KEY, JSON.stringify(updated));
    }
    setIsAddressModalOpen(false);
    setEditingAddress(null);
    showToast("ঠিকানা সফলভাবে সংরক্ষণ করা হয়েছে!");
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ADDRESSES_KEY, JSON.stringify(updated));
    }
    showToast("ঠিকানাটি মুছে ফেলা হয়েছে।");
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_ADDRESSES_KEY, JSON.stringify(updated));
    }
    showToast("ডিফল্ট ডেলিভারি ঠিকানা হিসেবে সেট করা হয়েছে!");
  };

  const handleConfirmLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_PHONE_KEY);
        localStorage.removeItem("customer_phone");
        localStorage.removeItem("sunnah_customer_auth");
        localStorage.removeItem(STORAGE_PROFILE_KEY);
      }
      setIsLogoutModalOpen(false);
      router.push("/login");
    }
  };

  // WhatsApp Concierge Link
  const waConciergeUrl = useMemo(() => {
    const greeting = `আসসালামু আলাইকুম সুন্নাহ সোর্স VIP সাপোর্ট,\nআমি ${
      userProfile.name || "সুন্নাহ মেম্বার"
    } (${userPhone})। ড্যাশবোর্ড থেকে আমার অর্ডার ও পণ্য সংক্রান্ত তথ্য জানতে চাচ্ছি।`;
    return `https://wa.me/880${SUPPORT_PHONE.slice(-10)}?text=${encodeURIComponent(greeting)}`;
  }, [userProfile.name, userPhone]);

  // ==========================================
  // Auth Loading Screen (Luxury Apple Polish)
  // ==========================================
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-surface-canvas text-charcoal-900 flex flex-col font-bengali">
        <AnnouncementBar />
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
          <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-stone-200/80 shadow-card text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0F3E2E] flex items-center justify-center mx-auto shadow-md">
              <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-charcoal-900">
              সুন্নাহ সোর্স ড্যাশবোর্ডে স্বাগতম...
            </h2>
            <p className="text-sm text-charcoal-500">
              আপনার নিরাপদ অ্যাকাউন্ট ও অর্ডার তথ্য লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন।
            </p>
            <div className="flex items-center justify-center gap-2 pt-2 text-[#0F3E2E]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs font-semibold">ভেরিফাই করা হচ্ছে</span>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ==========================================
  // Render Dashboard
  // ==========================================
  return (
    <div className="min-h-screen bg-surface-canvas text-charcoal-900 flex flex-col font-bengali antialiased">
      {/* 1. Global Announcement */}
      <AnnouncementBar />

      {/* 2. Global Header */}
      <Header />

      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* ========================================================= */}
        {/* SECTION 1: BESPOKE LUXURY HERO BANNER & STATUS HEADER    */}
        {/* ========================================================= */}
        <section
          aria-label="স্বাগতম ও প্রোফাইল হেডার"
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3E2E] via-[#144A37] to-[#0D2A18] text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-emerald-900/40"
        >
          {/* Subtle Islamic Geometric Star Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#D48B28_1px,transparent_1px)] [background-size:20px_20px]" />

          {/* Golden Ambient Blur Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Personalized Greeting & Badges */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Verified Gold Badge with Subtle Pulse */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/15 border border-amber-400/40 text-amber-300 shadow-sm backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  ভেরিফাইড সুন্নাহ মেম্বার
                </span>

                {/* Live Date / Time Badge */}
                {mounted && currentDateTimeBn && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-emerald-100 border border-white/10 backdrop-blur-sm">
                    <Clock className="w-3.5 h-3.5 text-emerald-300" />
                    {currentDateTimeBn}
                  </span>
                )}
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                আসসালামু আলাইকুম,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">
                  {userProfile.name || "সম্মানিত গ্রাহক"}!
                </span>
              </h1>

              {/* Contact Meta */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-emerald-200/90 font-mono">
                {userPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>+88 {toBanglaDigits(userPhone)}</span>
                  </div>
                )}
                {userProfile.email && (
                  <div className="flex items-center gap-1.5 font-sans">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>{userProfile.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-emerald-300 font-sans">
                  <span>সদস্য: {userProfile.memberSince || "২০২৬"}</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/track-order"
                prefetch={true}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-all border border-white/20 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <Truck className="w-4 h-4 text-amber-400" />
                <span>অর্ডার ট্র্যাক</span>
              </Link>

              <Link
                href="/shop"
                prefetch={true}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-charcoal-900 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-amber-900/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4 text-charcoal-900" />
                <span>নতুন অর্ডার করুন</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: INTERACTIVE TAB NAVIGATION & WORKSPACE         */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ------------------------------------------------------- */}
          {/* DESKTOP LEFT SIDEBAR NAVIGATION                        */}
          {/* ------------------------------------------------------- */}
          <aside className="hidden lg:block lg:col-span-3 bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-3 shadow-card sticky top-24 space-y-1.5">
            <div className="px-4 py-3 border-b border-stone-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400">
                ড্যাশবোর্ড মেন্যু
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left",
                activeTab === "overview"
                  ? "bg-[#0F3E2E] text-white shadow-md shadow-emerald-950/20"
                  : "text-charcoal-700 hover:text-[#0F3E2E] hover:bg-emerald-50/60"
              )}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard
                  className={cn(
                    "w-4 h-4",
                    activeTab === "overview" ? "text-amber-400" : "text-emerald-700"
                  )}
                />
                <span>ওভারভিউ</span>
              </div>
              <ChevronRight
                className={cn(
                  "w-4 h-4 opacity-50",
                  activeTab === "overview" && "text-amber-400 opacity-100"
                )}
              />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left",
                activeTab === "orders"
                  ? "bg-[#0F3E2E] text-white shadow-md shadow-emerald-950/20"
                  : "text-charcoal-700 hover:text-[#0F3E2E] hover:bg-emerald-50/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Package
                  className={cn(
                    "w-4 h-4",
                    activeTab === "orders" ? "text-amber-400" : "text-emerald-700"
                  )}
                />
                <span>আমার অর্ডারসমূহ</span>
              </div>
              {orders.length > 0 && (
                <span
                  className={cn(
                    "font-mono text-xs px-2 py-0.5 rounded-full font-bold",
                    activeTab === "orders"
                      ? "bg-amber-400 text-charcoal-900"
                      : "bg-emerald-100 text-emerald-800"
                  )}
                >
                  {toBanglaDigits(orders.length)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left",
                activeTab === "addresses"
                  ? "bg-[#0F3E2E] text-white shadow-md shadow-emerald-950/20"
                  : "text-charcoal-700 hover:text-[#0F3E2E] hover:bg-emerald-50/60"
              )}
            >
              <div className="flex items-center gap-3">
                <MapPin
                  className={cn(
                    "w-4 h-4",
                    activeTab === "addresses" ? "text-amber-400" : "text-emerald-700"
                  )}
                />
                <span>সংরক্ষিত ঠিকানা</span>
              </div>
              {addresses.length > 0 && (
                <span
                  className={cn(
                    "font-mono text-xs px-2 py-0.5 rounded-full font-bold",
                    activeTab === "addresses"
                      ? "bg-amber-400 text-charcoal-900"
                      : "bg-stone-100 text-charcoal-700"
                  )}
                >
                  {toBanglaDigits(addresses.length)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("wishlist")}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left",
                activeTab === "wishlist"
                  ? "bg-[#0F3E2E] text-white shadow-md shadow-emerald-950/20"
                  : "text-charcoal-700 hover:text-[#0F3E2E] hover:bg-emerald-50/60"
              )}
            >
              <div className="flex items-center gap-3">
                <Heart
                  className={cn(
                    "w-4 h-4",
                    activeTab === "wishlist" ? "text-rose-400" : "text-rose-500"
                  )}
                />
                <span>পছন্দের তালিকা</span>
              </div>
              {wishlistItems.length > 0 && (
                <span
                  className={cn(
                    "font-mono text-xs px-2 py-0.5 rounded-full font-bold",
                    activeTab === "wishlist"
                      ? "bg-rose-500 text-white"
                      : "bg-rose-100 text-rose-700"
                  )}
                >
                  {toBanglaDigits(wishlistItems.length)}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer text-left",
                activeTab === "profile"
                  ? "bg-[#0F3E2E] text-white shadow-md shadow-emerald-950/20"
                  : "text-charcoal-700 hover:text-[#0F3E2E] hover:bg-emerald-50/60"
              )}
            >
              <div className="flex items-center gap-3">
                <User
                  className={cn(
                    "w-4 h-4",
                    activeTab === "profile" ? "text-amber-400" : "text-emerald-700"
                  )}
                />
                <span>প্রোফাইল সেটিংস</span>
              </div>
              <ChevronRight
                className={cn(
                  "w-4 h-4 opacity-50",
                  activeTab === "profile" && "text-amber-400 opacity-100"
                )}
              />
            </button>

            <div className="pt-3 border-t border-stone-200/80">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>লগআউট</span>
              </button>
            </div>

            {/* VIP Direct Box in Sidebar */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#0F3E2E]/10 to-amber-500/10 border border-amber-500/20 text-center space-y-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                VIP কনসিয়ার্জ সহায়তা
              </span>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                যেকোনো অর্ডার সংক্রান্ত তথ্যে ডেডিকেটেড সাপোর্ট প্রতিনিধির সাথে চ্যাট করুন।
              </p>
              <a
                href={waConciergeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-[#0F3E2E] hover:bg-[#144A37] text-white font-bold text-xs transition-colors shadow-sm"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>সরাসরি চ্যাট শুরু করুন</span>
              </a>
            </div>
          </aside>

          {/* ------------------------------------------------------- */}
          {/* MOBILE HORIZONTAL PILL TAB BAR (STICKY ZERO-RELOAD)    */}
          {/* ------------------------------------------------------- */}
          <div className="lg:hidden col-span-1 sticky top-16 z-30 bg-surface-canvas/95 backdrop-blur-md py-2 -mx-3 px-3 border-b border-stone-200/70 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
                  activeTab === "overview"
                    ? "bg-[#0F3E2E] text-white shadow-sm"
                    : "bg-white text-charcoal-700 border border-stone-200"
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>ওভারভিউ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
                  activeTab === "orders"
                    ? "bg-[#0F3E2E] text-white shadow-sm"
                    : "bg-white text-charcoal-700 border border-stone-200"
                )}
              >
                <Package className="w-3.5 h-3.5" />
                <span>অর্ডার ({toBanglaDigits(orders.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("addresses")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
                  activeTab === "addresses"
                    ? "bg-[#0F3E2E] text-white shadow-sm"
                    : "bg-white text-charcoal-700 border border-stone-200"
                )}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>ঠিকানা</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("wishlist")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
                  activeTab === "wishlist"
                    ? "bg-rose-700 text-white shadow-sm"
                    : "bg-white text-charcoal-700 border border-stone-200"
                )}
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>উইশলিস্ট ({toBanglaDigits(wishlistItems.length)})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0",
                  activeTab === "profile"
                    ? "bg-[#0F3E2E] text-white shadow-sm"
                    : "bg-white text-charcoal-700 border border-stone-200"
                )}
              >
                <User className="w-3.5 h-3.5" />
                <span>প্রোফাইল</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>লগআউট</span>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* MAIN TAB CONTENT AREA                                  */}
          {/* ------------------------------------------------------- */}
          <div className="lg:col-span-9 space-y-6 sm:space-y-8">
            {/* ===================================================== */}
            {/* TAB 1: OVERVIEW                                       */}
            {/* ===================================================== */}
            {activeTab === "overview" && (
              <div className="space-y-6 sm:space-y-8">
                {/* 1. Live Shipment Progress Widget (Hero UX) */}
                {activeOrder ? (
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-amber-500/30 p-5 sm:p-7 shadow-card relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            চলমান পার্সেল
                          </span>
                          <span className="font-mono text-xs font-bold text-charcoal-700">
                            #{activeOrder.order_number}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-500 mt-1">
                          অর্ডারের তারিখ: {formatBanglaDateTime(activeOrder.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/track-order?orderNumber=${encodeURIComponent(
                            activeOrder.order_number
                          )}&phone=${encodeURIComponent(userPhone)}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F3E2E] hover:bg-[#144A37] text-white text-xs font-bold transition-colors shadow-sm"
                        >
                          <Truck className="w-3.5 h-3.5 text-amber-400" />
                          <span>অর্ডার ট্র্যাক করুন</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(activeOrder)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-charcoal-800 text-xs font-bold transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-charcoal-600" />
                          <span>ইনভয়েস ডাউনলোড</span>
                        </button>
                      </div>
                    </div>

                    {/* 4-Step Interactive Progress Bar */}
                    <div className="py-6 sm:py-8">
                      {(() => {
                        // Steps: 0: pending/confirmed (অর্ডার গৃহীত), 1: processing (প্যাকিং সম্পন্ন), 2: shipped (কুরিয়ারে হস্তান্তর), 3: delivered (ডেলিভার্ড)
                        let currentStep = 0;
                        if (activeOrder.status === "processing") currentStep = 1;
                        else if (activeOrder.status === "shipped") currentStep = 2;
                        else if (activeOrder.status === "delivered") currentStep = 3;

                        const steps = [
                          { title: "অর্ডার গৃহীত", desc: "অর্ডার নিশ্চিত হয়েছে" },
                          { title: "প্যাকিং সম্পন্ন", desc: "খাঁটি পণ্য বোতলজাত" },
                          { title: "কুরিয়ারে হস্তান্তর", desc: "ডেলিভারির পথে আছে" },
                          { title: "ডেলিভার্ড", desc: "হাতে পাওয়া সম্পন্ন" },
                        ];

                        return (
                          <div className="relative">
                            {/* Connecting Line */}
                            <div className="absolute top-5 left-6 right-6 h-1 bg-stone-200 -z-0">
                              <div
                                className="h-full bg-gradient-to-r from-[#0F3E2E] to-amber-500 transition-all duration-700"
                                style={{
                                  width: `${(currentStep / 3) * 100}%`,
                                }}
                              />
                            </div>

                            {/* 4 Step Nodes */}
                            <div className="grid grid-cols-4 gap-2 relative z-10 text-center">
                              {steps.map((st, idx) => {
                                const isDone = idx < currentStep;
                                const isCurrent = idx === currentStep;
                                return (
                                  <div key={idx} className="flex flex-col items-center">
                                    <div
                                      className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md",
                                        isDone
                                          ? "bg-[#0F3E2E] text-white ring-4 ring-emerald-50"
                                          : isCurrent
                                          ? "bg-amber-500 text-charcoal-900 ring-4 ring-amber-200 animate-pulse"
                                          : "bg-white text-stone-400 border-2 border-stone-200"
                                      )}
                                    >
                                      {isDone ? (
                                        <Check className="w-5 h-5 text-white" />
                                      ) : isCurrent ? (
                                        <Truck className="w-5 h-5 text-charcoal-900" />
                                      ) : (
                                        toBanglaDigits(idx + 1)
                                      )}
                                    </div>
                                    <span
                                      className={cn(
                                        "text-xs sm:text-sm font-bold mt-2",
                                        isCurrent
                                          ? "text-amber-800"
                                          : isDone
                                          ? "text-[#0F3E2E]"
                                          : "text-stone-400"
                                      )}
                                    >
                                      {st.title}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-charcoal-500 hidden sm:block mt-0.5">
                                      {st.desc}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Active Order Item Preview Strip */}
                    {activeOrder.items && activeOrder.items.length > 0 && (
                      <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {activeOrder.items.slice(0, 3).map((it, idx) => (
                              <div
                                key={idx}
                                className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 overflow-hidden relative"
                              >
                                <Image
                                  src={it.image || "/images/hero-honey.png"}
                                  alt={it.productTitle}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                          <span className="font-semibold text-charcoal-800">
                            {activeOrder.items[0].productTitle}{" "}
                            {activeOrder.items.length > 1 &&
                              `ও আরও ${toBanglaDigits(activeOrder.items.length - 1)}টি পণ্য`}
                          </span>
                        </div>
                        <div className="font-bold text-[#0F3E2E] font-mono text-sm">
                          মোট: {formatBDT(activeOrder.grand_total)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* No Active Order Hero Slate */
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-6 sm:p-8 text-center space-y-3 shadow-card">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0F3E2E] flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-charcoal-900">
                      আপনার কোনো চলমান পার্সেল নেই
                    </h3>
                    <p className="text-xs sm:text-sm text-charcoal-500 max-w-md mx-auto">
                      আলহামদুলিল্লাহ! আপনার পূর্বের সকল অর্ডার সম্পন্ন হয়েছে। খাঁটি ও প্রাকৃতিক
                      পণ্যের কালেকশন দেখতে আমাদের শপে ঘুরে আসুন।
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F3E2E] hover:bg-[#144A37] text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
                      >
                        <ShoppingBag className="w-4 h-4 text-amber-400" />
                        <span>শপ থেকে অর্ডার করুন</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* 2. Curated Metric Glass-Cards (4 Cards, High-Contrast Harmony) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Orders */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-5 shadow-card hover:border-amber-500/40 transition-all hover:scale-[1.01]">
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-xs font-bold text-charcoal-500">মোট সফল অর্ডার</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-[#0F3E2E]">
                        <PackageCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-mono">
                      {toBanglaDigits(deliveredOrdersCount)}
                      <span className="text-xs text-charcoal-400 font-sans ml-1">টি</span>
                    </div>
                    <p className="text-[11px] text-charcoal-400 mt-1">সর্বমোট ডেলিভার্ড পার্সেল</p>
                  </div>

                  {/* Card 2: Active Shipments */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-5 shadow-card hover:border-amber-500/40 transition-all hover:scale-[1.01]">
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-xs font-bold text-charcoal-500">চলমান ডেলিভারি</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Truck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono">
                      {toBanglaDigits(activeShipmentsCount)}
                      <span className="text-xs text-charcoal-400 font-sans ml-1">টি</span>
                    </div>
                    <p className="text-[11px] text-charcoal-400 mt-1">ডেলিভারি প্রক্রিয়ায় আছে</p>
                  </div>

                  {/* Card 3: Total Spent */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-5 shadow-card hover:border-amber-500/40 transition-all hover:scale-[1.01]">
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-xs font-bold text-charcoal-500">মোট খরচ / মূল্য</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-[#0F3E2E]">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 font-mono">
                      {formatBDT(totalSpentValue)}
                    </div>
                    <p className="text-[11px] text-charcoal-400 mt-1">সর্বমোট অর্ডারের ভ্যালু</p>
                  </div>

                  {/* Card 4: Wishlist Items */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-5 shadow-card hover:border-rose-400/40 transition-all hover:scale-[1.01]">
                    <div className="flex items-center justify-between pb-3">
                      <span className="text-xs font-bold text-charcoal-500">পছন্দের তালিকা</span>
                      <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                        <Heart className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono">
                      {toBanglaDigits(wishlistItems.length)}
                      <span className="text-xs text-charcoal-400 font-sans ml-1">টি</span>
                    </div>
                    <p className="text-[11px] text-charcoal-400 mt-1">সংরক্ষিত পছন্দের পণ্য</p>
                  </div>
                </div>

                {/* 3. Quick Reorder Section */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-charcoal-900">
                        দ্রুত আবার কিনুন (Quick Reorder)
                      </h2>
                      <p className="text-xs text-charcoal-500">
                        আপনার পূর্বে অর্ডারকৃত ও সর্বাধিক জনপ্রিয় সুন্নাহ কালেকশন
                      </p>
                    </div>
                    <Link
                      href="/shop"
                      className="text-xs font-bold text-[#0F3E2E] hover:underline flex items-center gap-1"
                    >
                      <span>সকল পণ্য</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(previousOrderedItems.length > 0
                      ? previousOrderedItems
                      : fallbackReorderProducts.map((p) => ({
                          productId: p.id,
                          productTitle: p.titleBn,
                          variantName: p.variants?.[0]?.displayName || "স্ট্যান্ডার্ড প্যাক",
                          unitPrice: p.variants?.[0]?.salePrice || p.variants?.[0]?.regularPrice || 500,
                          image: p.images?.[0] || "/images/hero-honey.png",
                        }))
                    )
                      .slice(0, 4)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col justify-between p-4 rounded-2xl border border-stone-200/70 bg-stone-50/50 hover:bg-white hover:border-amber-500/40 transition-all hover:shadow-md group"
                        >
                          <div className="space-y-3">
                            <div className="aspect-square w-full rounded-xl overflow-hidden bg-white relative">
                              <Image
                                src={item.image || "/images/hero-honey.png"}
                                alt={item.productTitle}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div>
                              <h3 className="text-xs sm:text-sm font-bold text-charcoal-900 line-clamp-1">
                                {item.productTitle}
                              </h3>
                              {item.variantName && (
                                <p className="text-[11px] text-charcoal-500 mt-0.5">
                                  {item.variantName}
                                </p>
                              )}
                              <div className="font-mono font-bold text-sm text-[#0F3E2E] mt-1">
                                {formatBDT(item.unitPrice)}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleReorderItem(item)}
                            className="mt-3 w-full py-2 px-3 rounded-xl bg-[#0F3E2E] hover:bg-[#144A37] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                            <span>আবার কিনুন</span>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 4. Recent Orders Sneak-Peek */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-6 shadow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-charcoal-900">সাম্প্রতিক অর্ডার</h2>
                      <p className="text-xs text-charcoal-500">আপনার সাম্প্রতিক কেনাকাটার সংক্ষিপ্ত বিবরণ</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="text-xs font-bold text-[#0F3E2E] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>সকল অর্ডার দেখুন ({toBanglaDigits(orders.length)})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-charcoal-400 text-xs">
                      এখনো কোনো অর্ডার পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {orders.slice(0, 3).map((ord) => {
                        const statusConf =
                          ORDER_STATUS_CONFIG[ord.status] || ORDER_STATUS_CONFIG.pending;
                        return (
                          <div
                            key={ord.id}
                            className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 rounded-xl px-2 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-charcoal-900">
                                  #{ord.order_number}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                    statusConf.badgeClass
                                  )}
                                >
                                  <span className={cn("w-1.5 h-1.5 rounded-full", statusConf.dotClass)} />
                                  {statusConf.labelBn}
                                </span>
                              </div>
                              <p className="text-xs text-charcoal-500">
                                {formatBanglaDateTime(ord.created_at)} • {toBanglaDigits(ord.items?.length || 1)}টি পণ্য
                              </p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3">
                              <span className="font-mono font-bold text-sm text-[#0F3E2E]">
                                {formatBDT(ord.grand_total)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenInvoice(ord)}
                                className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-bold text-charcoal-800 transition-colors"
                              >
                                ইনভয়েস
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Sunnah Source VIP Trust Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-900/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0F3E2E] text-amber-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0F3E2E] block">
                        ১০০% খাঁটি ও প্রাকৃতিক
                      </span>
                      <p className="text-[11px] text-charcoal-600">ল্যাব টেস্টে পরীক্ষিত পণ্য</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-900/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">
                        ৭ দিনের সহজ রিটার্ন
                      </span>
                      <p className="text-[11px] text-charcoal-600">নিশ্চিন্ত কেনাকাটার গ্যারান্টি</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-900/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0F3E2E] text-emerald-300 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0F3E2E] block">
                        ক্যাশ অন ডেলিভারি
                      </span>
                      <p className="text-[11px] text-charcoal-600">পণ্য দেখে মূল্য পরিশোধ</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================== */}
            {/* TAB 2: MY ORDERS (Filterable, Searchable)             */}
            {/* ===================================================== */}
            {activeTab === "orders" && (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-card space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900">আমার অর্ডারসমূহ</h2>
                    <p className="text-xs text-charcoal-500">আপনার সমস্ত অতীত ও চলমান অর্ডারের তালিকা</p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { key: "all", label: "সব" },
                      { key: "active", label: "চলমান" },
                      { key: "delivered", label: "সম্পন্ন" },
                      { key: "cancelled", label: "বাতিল" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setOrdersFilter(f.key as "all" | "active" | "delivered" | "cancelled")}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                          ordersFilter === f.key
                            ? "bg-[#0F3E2E] text-white shadow-xs"
                            : "bg-stone-100 text-charcoal-700 hover:bg-stone-200"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder="অর্ডার নম্বর বা পণ্যের নাম দিয়ে খুঁজুন..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]"
                  />
                  {ordersSearch && (
                    <button
                      type="button"
                      onClick={() => setOrdersSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Orders List */}
                {isLoadingOrders ? (
                  <div className="text-center py-12 space-y-3">
                    <Loader2 className="w-7 h-7 text-[#0F3E2E] animate-spin mx-auto" />
                    <p className="text-xs text-charcoal-500">অর্ডার লোড করা হচ্ছে...</p>
                  </div>
                ) : filteredOrdersList.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                      <Package className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-charcoal-700">কোনো অর্ডার পাওয়া যায়নি</p>
                    <p className="text-xs text-charcoal-400">ফিল্টার বা সার্চ কিওয়ার্ড পরিবর্তন করে দেখতে পারেন।</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrdersList.map((ord) => {
                      const statusConf =
                        ORDER_STATUS_CONFIG[ord.status] || ORDER_STATUS_CONFIG.pending;
                      return (
                        <div
                          key={ord.id}
                          className="rounded-2xl border border-stone-200/80 bg-white p-5 hover:border-amber-500/40 transition-all shadow-xs space-y-4"
                        >
                          {/* Order Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-base text-charcoal-900">
                                  #{ord.order_number}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                                    statusConf.badgeClass
                                  )}
                                >
                                  <span
                                    className={cn("w-1.5 h-1.5 rounded-full", statusConf.dotClass)}
                                  />
                                  {statusConf.labelBn}
                                </span>
                              </div>
                              <p className="text-xs text-charcoal-500">
                                অর্ডারের তারিখ: {formatBanglaDateTime(ord.created_at)}
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <span className="font-mono font-extrabold text-base text-[#0F3E2E]">
                                {formatBDT(ord.grand_total)}
                              </span>
                              <span className="text-[11px] text-charcoal-400 block">
                                {ord.payment_method === "cod" ? "ক্যাশ অন ডেলিভারি" : "অনলাইন পেমেন্ট"} •{" "}
                                {ord.payment_status === "paid" ? "পরিশোধিত" : "অপরিশোধিত"}
                              </span>
                            </div>
                          </div>

                          {/* Line Items */}
                          <div className="divide-y divide-stone-50">
                            {ord.items?.map((it, idx) => (
                              <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-stone-100 relative overflow-hidden shrink-0">
                                    <Image
                                      src={it.image || "/images/hero-honey.png"}
                                      alt={it.productTitle}
                                      fill
                                      sizes="48px"
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-charcoal-900">
                                      {it.productTitle}
                                    </h4>
                                    <p className="text-[11px] text-charcoal-500">
                                      {it.variantName || "স্ট্যান্ডার্ড"} • পরিমাণ: {toBanglaDigits(it.quantity)}টি
                                    </p>
                                  </div>
                                </div>
                                <div className="font-mono font-bold text-xs sm:text-sm text-charcoal-800">
                                  {formatBDT(it.lineTotal || it.unitPrice * it.quantity)}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Courier tracking strip if available */}
                          {ord.courier_tracking_code && (
                            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-emerald-700" />
                                <span>
                                  কুরিয়ার: <strong className="font-mono">{ord.courier_partner || "Steadfast"}</strong>
                                </span>
                                <span className="text-stone-300">|</span>
                                <span>
                                  ট্র্যাকিং কোড: <strong className="font-mono">{ord.courier_tracking_code}</strong>
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (ord.courier_tracking_code) {
                                    navigator.clipboard.writeText(ord.courier_tracking_code);
                                    showToast("ট্র্যাকিং কোড কপি করা হয়েছে!");
                                  }
                                }}
                                className="text-[#0F3E2E] hover:underline font-bold flex items-center gap-1"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>কপি</span>
                              </button>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs text-charcoal-500 line-clamp-1 max-w-sm">
                              📍 {ord.delivery_address}
                            </span>

                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/track-order?orderNumber=${encodeURIComponent(
                                  ord.order_number
                                )}&phone=${encodeURIComponent(userPhone)}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-charcoal-800 text-xs font-bold transition-colors"
                              >
                                <Truck className="w-3.5 h-3.5 text-emerald-700" />
                                <span>ট্র্যাক</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleOpenInvoice(ord)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-charcoal-800 text-xs font-bold transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5 text-charcoal-600" />
                                <span>ইনভয়েস প্রিন্ট</span>
                              </button>

                              {ord.items && ord.items.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleReorderItem(ord.items[0])}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F3E2E] hover:bg-[#144A37] text-white text-xs font-bold transition-colors shadow-xs"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                                  <span>পুনরায় কিনুন</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===================================================== */}
            {/* TAB 3: ADDRESS BOOK (সংরক্ষিত ঠিকানা)                 */}
            {/* ===================================================== */}
            {activeTab === "addresses" && (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-card space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900">সংরক্ষিত ঠিকানা (Address Book)</h2>
                    <p className="text-xs text-charcoal-500">
                      সহজ ও দ্রুত চেকআউটের জন্য আপনার হোম ও অফিস ঠিকানা সংরক্ষণ করুন।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddress({
                        id: `addr-${Date.now()}`,
                        label: "home",
                        title: "বাসা / হোম",
                        recipientName: userProfile.name || "",
                        phone: userPhone || "",
                        zone: "inside_dhaka",
                        district: "ঢাকা",
                        thana: "",
                        fullAddress: "",
                        isDefault: addresses.length === 0,
                      });
                      setIsAddressModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F3E2E] hover:bg-[#144A37] text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>নতুন ঠিকানা যোগ করুন</span>
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-charcoal-700">কোনো সংরক্ষিত ঠিকানা নেই</p>
                    <p className="text-xs text-charcoal-400">
                      "নতুন ঠিকানা যোগ করুন" বাটনে ক্লিক করে ডেলিভারি ঠিকানা সেভ করুন।
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={cn(
                          "p-5 rounded-2xl border transition-all space-y-3 relative flex flex-col justify-between",
                          addr.isDefault
                            ? "border-[#0F3E2E] bg-emerald-50/30 shadow-sm"
                            : "border-stone-200/80 bg-white"
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {addr.label === "home" ? (
                                <Home className="w-4 h-4 text-[#0F3E2E]" />
                              ) : addr.label === "office" ? (
                                <Briefcase className="w-4 h-4 text-[#0F3E2E]" />
                              ) : (
                                <Building2 className="w-4 h-4 text-[#0F3E2E]" />
                              )}
                              <span className="font-bold text-sm text-charcoal-900">{addr.title}</span>
                            </div>
                            {addr.isDefault && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F3E2E] text-white">
                                ডিফল্ট
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-charcoal-700 space-y-0.5">
                            <p className="font-bold text-charcoal-900">{addr.recipientName}</p>
                            <p className="font-mono text-charcoal-600">{addr.phone}</p>
                            <p className="text-charcoal-600 leading-relaxed pt-1">
                              {addr.fullAddress}
                              {addr.thana && `, ${addr.thana}`}
                              {addr.district && `, ${addr.district}`}
                            </p>
                            <p className="text-[11px] text-emerald-800 font-semibold pt-1">
                              {addr.zone === "inside_dhaka" ? "ঢাকা সিটি (৳৭০)" : "ঢাকার বাইরে (৳১৩০)"}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs text-[#0F3E2E] hover:underline font-semibold"
                            >
                              ডিফল্ট করুন
                            </button>
                          )}
                          <div className="flex items-center gap-3 ml-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddress(addr);
                                setIsAddressModalOpen(true);
                              }}
                              className="text-xs text-charcoal-600 hover:text-charcoal-900 font-semibold flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>সম্পাদনা</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>মুছুন</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===================================================== */}
            {/* TAB 4: WISHLIST (পছন্দের তালিকা)                     */}
            {/* ===================================================== */}
            {activeTab === "wishlist" && (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-card space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-charcoal-900">
                      পছন্দের তালিকা ({toBanglaDigits(wishlistItems.length)})
                    </h2>
                    <p className="text-xs text-charcoal-500">
                      আপনার সংরক্ষিত প্রিয় পণ্যসমূহ; যেকোনো সময় ১-ক্লিকে কার্টে যোগ করতে পারেন।
                    </p>
                  </div>
                  {wishlistItems.length > 0 && (
                    <Link
                      href="/wishlist"
                      className="text-xs font-bold text-[#0F3E2E] hover:underline flex items-center gap-1"
                    >
                      <span>উইশলিস্ট পেজ</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {wishlistItems.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                      <Heart className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-charcoal-700">আপনার পছন্দের তালিকা খালি</p>
                    <p className="text-xs text-charcoal-400">
                      যেকোনো পণ্যের হৃদপিণ্ড আইকনে ক্লিক করে তালিকায় যুক্ত করুন।
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F3E2E] hover:bg-[#144A37] text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
                      >
                        <ShoppingBag className="w-4 h-4 text-amber-400" />
                        <span>শপ ব্রাউজ করুন</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistItems.map((prod) => {
                      const defaultVariant = prod.variants?.[0];
                      const price = defaultVariant?.salePrice || defaultVariant?.regularPrice || 500;
                      return (
                        <div
                          key={prod.id}
                          className="p-4 rounded-2xl border border-stone-200/80 bg-white hover:border-amber-500/40 transition-all shadow-xs flex flex-col justify-between space-y-3 group"
                        >
                          <div className="space-y-3">
                            <div className="aspect-square w-full rounded-xl overflow-hidden bg-stone-100 relative">
                              <Image
                                src={prod.images?.[0] || "/images/hero-honey.png"}
                                alt={prod.titleBn}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  removeFromWishlist(prod.id);
                                  showToast("পছন্দের তালিকা থেকে সরানো হয়েছে।");
                                }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm text-rose-600 hover:bg-white transition-colors shadow-sm"
                                title="মুছে ফেলুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                                {prod.badge || "১০০% প্রাকৃতিক"}
                              </span>
                              <h3 className="text-sm font-bold text-charcoal-900 mt-1 line-clamp-1">
                                {prod.titleBn}
                              </h3>
                              <p className="text-xs text-charcoal-500 line-clamp-1 mt-0.5">
                                {prod.shortDescriptionBn}
                              </p>
                              <div className="font-mono font-bold text-sm text-[#0F3E2E] mt-2">
                                {formatBDT(price)}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              addItemToCart({
                                id: `${prod.id}-${defaultVariant?.id || "std"}`,
                                productId: prod.id,
                                variantId: defaultVariant?.id || prod.id,
                                title: prod.titleBn,
                                titleBn: prod.titleBn,
                                variantName: defaultVariant?.displayName || "স্ট্যান্ডার্ড প্যাক",
                                unitPrice: price,
                                image: prod.images?.[0] || "/images/hero-honey.png",
                                weightLabel: defaultVariant?.displayName || "",
                                quantity: 1,
                                maxStock: defaultVariant?.stockQuantity || 50,
                              });
                              openCartDrawer();
                              showToast(`"${prod.titleBn}" কার্টে যোগ করা হয়েছে!`);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#0F3E2E] hover:bg-[#144A37] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                            <span>১-ক্লিকে কার্টে যোগ করুন</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===================================================== */}
            {/* TAB 5: PROFILE SETTINGS & SECURITY                   */}
            {/* ===================================================== */}
            {activeTab === "profile" && (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-card space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-charcoal-900">প্রোফাইল সেটিংস ও নিরাপত্তা</h2>
                  <p className="text-xs text-charcoal-500">
                    আপনার ব্যক্তিগত তথ্য, যোগাযোগ নম্বর ও ডেলিভারি পছন্দসমূহ পরিচালনা করুন।
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal-700 block">পূর্ণ নাম *</label>
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                      required
                      placeholder="যেমন: মোঃ আব্দুল্লাহ"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] bg-stone-50/50 focus:bg-white"
                    />
                  </div>

                  {/* Primary Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal-700 block">
                      প্রধান মোবাইল নম্বর *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={userProfile.phone || userPhone}
                        onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                        required
                        placeholder="01XXXXXXXXX"
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] font-mono bg-stone-50/50 focus:bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        ভেরিফাইড
                      </span>
                    </div>
                  </div>

                  {/* Alternate Phone */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal-700 block">
                      বিকল্প মোবাইল নম্বর (ঐচ্ছিক)
                    </label>
                    <input
                      type="tel"
                      value={userProfile.alternativePhone || ""}
                      onChange={(e) =>
                        setUserProfile({ ...userProfile, alternativePhone: e.target.value })
                      }
                      placeholder="জরুরি যোগাযোগের জন্য"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] font-mono bg-stone-50/50 focus:bg-white"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal-700 block">ইমেইল ঠিকানা</label>
                    <input
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                      placeholder="example@mail.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] bg-stone-50/50 focus:bg-white"
                    />
                  </div>

                  {/* Default Delivery Instructions */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-charcoal-700 block">
                      ডেলিভারি সংক্রান্ত স্থায়ী নির্দেশনা (ঐচ্ছিক)
                    </label>
                    <textarea
                      rows={2}
                      value={userProfile.defaultDeliveryNotes || ""}
                      onChange={(e) =>
                        setUserProfile({ ...userProfile, defaultDeliveryNotes: e.target.value })
                      }
                      placeholder="যেমন: গেটের দারোয়ানের কাছে রেখে যেতে পারেন..."
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] bg-stone-50/50 focus:bg-white"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F3E2E] hover:bg-[#144A37] text-white font-bold text-sm transition-colors shadow-sm cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-amber-400" />
                      <span>পরিবর্তন সংরক্ষণ করুন</span>
                    </button>
                  </div>
                </form>

                {/* Account Security Information Box */}
                <div className="pt-6 border-t border-stone-100 space-y-3">
                  <h3 className="text-sm font-bold text-charcoal-900">নিরাপত্তা ও একাউন্ট স্থিতি</h3>
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-charcoal-800">অ্যাকাউন্ট ভেরিফিকেশন</span>
                      <p className="text-charcoal-500">মোবাইল নম্বরের মাধ্যমে নিরাপদ একাউন্ট সুরক্ষিত।</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      সুরক্ষিত
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ========================================================= */}
      {/* SECTION 3: VIP WHATSAPP CONCIERGE FLOATING ACTION         */}
      {/* ========================================================= */}
      <aside aria-label="ভিআইপি সহায়তা অ্যাকশন" className="fixed bottom-6 right-6 z-40">
        <a
          href={waConciergeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#0F3E2E] to-[#144A37] text-white font-bold text-xs sm:text-sm shadow-2xl border-2 border-amber-400 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
          </span>
          <WhatsAppIcon className="w-5 h-5 text-emerald-400" />
          <span className="hidden sm:inline font-sans">VIP Concierge</span>
          <span className="text-[10px] text-amber-300 font-normal hidden lg:inline">
            (সহায়তা: {SUPPORT_PHONE_DISPLAY})
          </span>
        </a>
      </aside>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT ADDRESS MODAL                         */}
      {/* ========================================================= */}
      {isAddressModalOpen && editingAddress && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-base sm:text-lg font-bold text-charcoal-900">
                {addresses.some((a) => a.id === editingAddress.id)
                  ? "ঠিকানা সম্পাদনা"
                  : "নতুন ডেলিভারি ঠিকানা"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddressModalOpen(false);
                  setEditingAddress(null);
                }}
                className="text-stone-400 hover:text-charcoal-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveAddress(editingAddress);
              }}
              className="space-y-3.5"
            >
              {/* Type selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal-700 block">ঠিকানার ধরন</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "home", label: "বাসা / হোম", icon: Home },
                    { key: "office", label: "অফিস", icon: Briefcase },
                    { key: "other", label: "অন্যান্য", icon: Building2 },
                  ].map((t) => {
                    const IconComp = t.icon;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() =>
                          setEditingAddress({
                            ...editingAddress,
                            label: t.key as "home" | "office" | "other",
                            title: t.label,
                          })
                        }
                        className={cn(
                          "py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all",
                          editingAddress.label === t.key
                            ? "bg-[#0F3E2E] text-white border-[#0F3E2E]"
                            : "bg-stone-50 text-charcoal-700 border-stone-200"
                        )}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal-700 block">প্রাপকের নাম *</label>
                <input
                  type="text"
                  required
                  value={editingAddress.recipientName}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, recipientName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal-700 block">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={editingAddress.phone}
                  onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] font-mono"
                />
              </div>

              {/* Zone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal-700 block">ডেলিভারি জোন *</label>
                <select
                  value={editingAddress.zone}
                  onChange={(e) =>
                    setEditingAddress({
                      ...editingAddress,
                      zone: e.target.value as "inside_dhaka" | "outside_dhaka",
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E] bg-white"
                >
                  <option value="inside_dhaka">ঢাকা সিটি (ডেলিভারি চার্জ ৳৭০)</option>
                  <option value="outside_dhaka">ঢাকা সিটির বাইরে (ডেলিভারি চার্জ ৳১৩০)</option>
                </select>
              </div>

              {/* District & Thana */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal-700 block">জেলা *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.district}
                    onChange={(e) =>
                      setEditingAddress({ ...editingAddress, district: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-charcoal-700 block">থানা / উপজেলা *</label>
                  <input
                    type="text"
                    required
                    value={editingAddress.thana}
                    onChange={(e) => setEditingAddress({ ...editingAddress, thana: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-charcoal-700 block">
                  পূর্ণ ঠিকানা (বাড়ি/রোড/এলাকা) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingAddress.fullAddress}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, fullAddress: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3E2E]"
                />
              </div>

              {/* Default toggle */}
              <label className="flex items-center gap-2 text-xs font-medium text-charcoal-700 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingAddress.isDefault}
                  onChange={(e) =>
                    setEditingAddress({ ...editingAddress, isDefault: e.target.checked })
                  }
                  className="rounded text-[#0F3E2E] focus:ring-[#0F3E2E]"
                />
                <span>ডিফল্ট ডেলিভারি ঠিকানা হিসেবে সংরক্ষণ করুন</span>
              </label>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddressModalOpen(false);
                    setEditingAddress(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-charcoal-700 text-xs font-bold transition-colors"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F3E2E] hover:bg-[#144A37] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: PRINTABLE INVOICE MODAL                          */}
      {/* ========================================================= */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6">
            <button
              type="button"
              onClick={() => setSelectedInvoiceOrder(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/90 hover:bg-white text-charcoal-900 shadow-md transition-colors print:hidden"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
            <PrintableInvoice
              order={selectedInvoiceOrder}
              onClose={() => setSelectedInvoiceOrder(null)}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: LUXURY APPLE-GRADE LOGOUT CONFIRMATION MODAL     */}
      {/* ========================================================= */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">লগআউট নিশ্চিত করুন</h3>
            <p className="text-xs sm:text-sm text-charcoal-500 leading-relaxed">
              আপনি কি নিশ্চিত যে আপনার সুন্নাহ সোর্স অ্যাকাউন্ট থেকে লগআউট করতে চান? পরবর্তী সময়
              অর্ডার ইতিহাস ও ঠিকানা ব্যবহারে পুনরায় সাইন ইন করতে হবে।
            </p>
            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-charcoal-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                না, ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-colors shadow-md cursor-pointer"
              >
                হ্যাঁ, লগআউট নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TOAST NOTIFICATION POPUP                                  */}
      {/* ========================================================= */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="bg-[#0F3E2E] text-white px-4 py-3 rounded-2xl shadow-xl border border-amber-400/40 flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 4. Global Footer */}
      <Footer />

      {/* 5. Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* 6. Global Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
