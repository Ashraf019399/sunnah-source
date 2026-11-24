"use server";

/**
 * Customer Courier History & Fraud Check Service
 * Analyzes customer parcel history, returns, cancellations, and delivery success rate.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { getCourierSettings } from "@/lib/actions/admin-courier-actions";
import { validateBangladeshiPhone } from "@/lib/services/fake-order-guard";

export type CustomerRiskLevel = "safe" | "moderate" | "high";

export interface CustomerCourierHistory {
  phone: string;
  totalOrders: number;
  deliveredCount: number;
  cancelledCount: number;
  returnedCount: number;
  pendingCount: number;
  successRate: number; // 0 to 100 percentage
  riskLevel: CustomerRiskLevel;
  riskLabelBn: string;
  riskDescriptionBn: string;
  pastOrders: {
    orderNumber: string;
    grandTotal: number;
    status: string;
    createdAt: string;
    courierTracking?: string;
  }[];
  externalCheckUrls: {
    steadfastUrl: string;
    fraudCheckBdUrl: string;
  };
}

/**
 * Computes customer risk level based on past delivery performance.
 */
function evaluateCustomerRisk(
  total: number,
  delivered: number,
  returned: number,
  cancelled: number
): { riskLevel: CustomerRiskLevel; labelBn: string; descBn: string; rate: number } {
  const completedOrFailed = delivered + returned + cancelled;

  // New customer with no previous history
  if (total === 0 || completedOrFailed === 0) {
    return {
      riskLevel: "safe",
      labelBn: "নতুন গ্রাহক (New)",
      descBn: "এই নম্বরে অতীতে কোনো ডেলিভারি হিস্ট্রি নেই। স্বাভাবিক প্রক্রিয়া অনুসরণ করুন।",
      rate: 100,
    };
  }

  const successRate = Math.round((delivered / completedOrFailed) * 100);

  // High Risk: Multiple cancellations/returns or success rate below 50%
  if ((returned + cancelled >= 2 && delivered === 0) || (completedOrFailed >= 2 && successRate < 50)) {
    return {
      riskLevel: "high",
      labelBn: "উচ্চ ঝুঁকি (High Risk)",
      descBn: `সতর্কতা! এই গ্রাহকের পূর্বের পার্সেল ক্যানসেল বা রিটার্ন হয়েছে (${returned + cancelled} টি)। অর্ডার পাঠানোর আগে অগ্রিম ডেলিভারি চার্জ অথবা ফোনে পুনরায় নিশ্চিত হওয়া বাঞ্ছনীয়।`,
      rate: successRate,
    };
  }

  // Moderate Risk: 1 return or cancellation with some delivered
  if (returned + cancelled >= 1 && successRate < 80) {
    return {
      riskLevel: "moderate",
      labelBn: "মাঝারি ঝুঁকি (Moderate)",
      descBn: "অতীতে অন্তত একটি পার্সেল ক্যানসেল বা রিটার্ন হয়েছে। ফোনে কথা বলে কাস্টমারের আগ্রহ নিশ্চিত করুন।",
      rate: successRate,
    };
  }

  // Safe / Low Risk
  return {
    riskLevel: "safe",
    labelBn: "নিরাপদ ও বিশ্বস্ত (Safe)",
    descBn: "এই গ্রাহকের পূর্ববর্তী ডেলিভারি সন্তোষজনক। নিশ্চিন্তে অর্ডার প্রসেস করতে পারেন।",
    rate: successRate,
  };
}

/**
 * Server Action: Retrieves customer courier delivery and cancellation history.
 */
export async function getCustomerCourierHistoryAction(
  rawPhone: string
): Promise<{ success: boolean; data?: CustomerCourierHistory; message?: string }> {
  try {
    const { cleanPhone, isValid } = validateBangladeshiPhone(rawPhone);
    if (!isValid || !cleanPhone) {
      return {
        success: false,
        message: "বৈধ মোবাইল নম্বর প্রদান করুন।",
      };
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        success: false,
        message: "ডাটাবেজ সার্ভিস রোল কনফিগার করা নেই।",
      };
    }

    const adminClient = await createAdminClient();

    // Query all orders by guest_phone or inside shipping_address
    const { data: orders, error } = await adminClient
      .from("orders")
      .select("id, order_number, grand_total, order_status, courier_tracking_code, created_at")
      .or(`guest_phone.eq.${cleanPhone},shipping_address->>phone.eq.${cleanPhone}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getCustomerCourierHistoryAction] DB error:", error);
      return { success: false, message: "অর্ডার হিস্ট্রি লোড করা যায়নি।" };
    }

    const orderList = orders || [];
    let deliveredCount = 0;
    let cancelledCount = 0;
    let returnedCount = 0;
    let pendingCount = 0;

    for (const ord of orderList) {
      const st = ord.order_status?.toLowerCase();
      if (st === "delivered") deliveredCount++;
      else if (st === "cancelled") cancelledCount++;
      else if (st === "returned") returnedCount++;
      else pendingCount++;
    }

    const risk = evaluateCustomerRisk(
      orderList.length,
      deliveredCount,
      returnedCount,
      cancelledCount
    );

    const result: CustomerCourierHistory = {
      phone: cleanPhone,
      totalOrders: orderList.length,
      deliveredCount,
      cancelledCount,
      returnedCount,
      pendingCount,
      successRate: risk.rate,
      riskLevel: risk.riskLevel,
      riskLabelBn: risk.labelBn,
      riskDescriptionBn: risk.descBn,
      pastOrders: orderList.map((o) => ({
        orderNumber: o.order_number,
        grandTotal: Number(o.grand_total) || 0,
        status: o.order_status || "pending",
        createdAt: o.created_at,
        courierTracking: o.courier_tracking_code || undefined,
      })),
      externalCheckUrls: {
        steadfastUrl: `https://steadfast.com.bd/merchant/consignment?search=${encodeURIComponent(cleanPhone)}`,
        fraudCheckBdUrl: `https://fraudcheckbd.com/?phone=${encodeURIComponent(cleanPhone)}`,
      },
    };

    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    console.error("[getCustomerCourierHistoryAction] Server error:", err);
    return {
      success: false,
      message: err.message || "সার্ভার ত্রুটি ঘটেছে।",
    };
  }
}
